const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  meetingId: { type: String, required: true, unique: true }, // Ensure this is unique and not null
  roomId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  hostName: { type: String, required: true },
}, { timestamps: true });

const Meeting = mongoose.model("Meeting", meetingSchema);

module.exports = Meeting;
