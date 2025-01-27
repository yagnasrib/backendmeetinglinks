const express = require("express");
const router = express.Router();
const Meeting = require("../models/Meeting");

router.post("/create", async (req, res) => {
  const { roomId, title, hostName } = req.body;

  if (!roomId || !title || !hostName) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Generate a unique meetingId
    const meetingId = "MEETING-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    // Create the meeting object and assign the meetingId
    const newMeeting = new Meeting({
      meetingId, // Make sure this is set
      roomId,
      title,
      hostName,
    });

    // Save the meeting to the database
    const savedMeeting = await newMeeting.save();

    // Return success response
    res.status(201).json({ message: "Meeting created successfully", meeting: savedMeeting });
  } catch (error) {
    console.error("Error creating meeting:", error);
    res.status(500).json({ message: "Failed to create meeting", error: error.message });
  }
  app.post("/api/rooms", (req, res) => {
    const { roomId } = req.body;
    if (!roomId) {
      return res.status(400).json({ error: "Room ID is required" });
    }
    res.status(201).json({ message: "Room created", roomId });
  });
  
  app.get("/api/rooms/:roomId/participants", (req, res) => {
    const roomId = req.params.roomId;
    if (participants[roomId]) {
      res.status(200).json(participants[roomId]);
    } else {
      res.status(404).json({ message: "Room not found or has no participants." });
    }
  });
  
});

module.exports = router;
