require('dotenv').config();  // Load environment variables

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const meetingRoutes = require("./routes/meetingRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true,
  useUnifiedTopology: true 
})
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Routes
app.use("/api/meetings", meetingRoutes);

const port = process.env.PORT || 5000;  // Use PORT from .env, default to 5000
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
