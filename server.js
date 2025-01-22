const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const socketIo = require("socket.io");
const { v4: uuidv4 } = require("uuid");

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Mongoose schema and model for meetings
const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  meetingId: { type: String, unique: true, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Meeting = mongoose.model("Meeting", meetingSchema);

// API Routes
app.get("/", (req, res) => {
  res.send("Zoom Clone Backend is running!");
});

app.post("/meetings", async (req, res) => {
  try {
    const { title, date } = req.body;
    if (!title || !date) {
      return res.status(400).json({ message: "Title and date are required." });
    }

    const meetingId = uuidv4();
    const newMeeting = new Meeting({ title, date, meetingId });
    await newMeeting.save();

    const meetingLink = `https://frontendmeet.vercel.app//join-meeting/${meetingId}`;
    res.status(201).json({
      message: "Meeting created successfully",
      meeting: newMeeting,
      meetingLink,
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    res.status(500).json({ message: "Error creating meeting", error });
  }
});

app.get("/meetings", async (req, res) => {
  try {
    const meetings = await Meeting.find();
    res.status(200).json(meetings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching meetings", error });
  }
});

app.get("/join-meeting/:id", async (req, res) => {
  try {
    const meetingId = req.params.id;
    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found." });
    }

    res.status(200).json({ message: "Meeting found", meeting });
  } catch (error) {
    console.error("Error joining meeting:", error);
    res.status(500).json({ message: "Error joining meeting", error });
  }
});
app.delete("/meetings/:id", async (req, res) => {
    try {
      const meetingId = req.params.id;
      const meeting = await Meeting.findByIdAndDelete(meetingId); 
     
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found." });
      }
   
      res.status(200).json({ message: "Meeting removed successfully" });
    } catch (error) {
      console.error("Error removing meeting:", error);
      res.status(500).json({ message: "Error removing meeting", error });
    }
  });

// Socket.io Implementation
const activeRooms = {};

const updateUserList = (meetingId) => {
  const userList = activeRooms[meetingId]?.users || [];
  io.to(meetingId).emit("updateUserList", userList);
};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinRoom", (meetingId) => {
    if (!activeRooms[meetingId]) {
      activeRooms[meetingId] = { users: [], timer: null };
      activeRooms[meetingId].timer = setTimeout(() => {
        io.to(meetingId).emit("meetingEnded", "The meeting has ended.");
        delete activeRooms[meetingId];
      }, 60 * 60 * 1000);
    }

    if (activeRooms[meetingId].users.length >= 5) {
      socket.emit("roomFull", "The meeting is full. Only 5 users can join.");
      return;
    }

    activeRooms[meetingId].users.push(socket.id);
    socket.join(meetingId);
    console.log(`User ${socket.id} joined room: ${meetingId}`);
    socket.emit("roomJoined", `You joined room: ${meetingId}`);
    socket.broadcast.to(meetingId).emit("newUserJoined", `User ${socket.id} joined`);

    updateUserList(meetingId);
  });

  socket.on("raiseHand", (meetingId) => {
    console.log(`User ${socket.id} raised their hand in room: ${meetingId}`);
    socket.broadcast.to(meetingId).emit("handRaised", {
      userId: socket.id,
      message: `User ${socket.id} raised their hand.`,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const [meetingId, roomData] of Object.entries(activeRooms)) {
      const index = roomData.users.indexOf(socket.id);
      if (index !== -1) {
        roomData.users.splice(index, 1);
        socket.leave(meetingId);

        if (roomData.users.length === 0) {
          clearTimeout(roomData.timer);
          delete activeRooms[meetingId];
        } else {
          updateUserList(meetingId);
        }
      }
    }
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
