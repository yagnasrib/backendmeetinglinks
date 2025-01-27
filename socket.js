module.exports = (io) => {
  const participants = {}; // Store participants for each room
  const roomTimers = {}; // Store timers for each room

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join a meeting room
    socket.on("join-room", ({ roomId, userName }) => {
      // Check if the room exists and enforce participant limit
      if (!participants[roomId]) participants[roomId] = [];
      if (participants[roomId].length >= 5) {
        return socket.emit("room-full", { message: "Room is full. Maximum 5 participants allowed." });
      }

      // Add participant to the room
      participants[roomId].push({ socketId: socket.id, userName });
      socket.join(roomId);
      console.log(`${userName} joined room ${roomId}`);
      io.to(roomId).emit("update-participants", participants[roomId]); // Notify all users in the room

      // Emit event to notify others in the room
      socket.to(roomId).emit("user-joined", { userName, socketId: socket.id });

      // Set up room timer if not already running
      if (!roomTimers[roomId]) {
        roomTimers[roomId] = setTimeout(() => {
          io.to(roomId).emit("room-expired", { message: "Room has expired after 1 hour." });
          delete participants[roomId]; // Clear participants
          delete roomTimers[roomId]; // Clear the timer
        }, 3600000); // 1 hour = 3600000 ms
      }
    });

    // Handle chat messages
    socket.on("message", ({ roomId, userName, message }) => {
      io.to(roomId).emit("message", { userName, message });
    });

    // Handle disconnection
    socket.on("disconnecting", () => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      rooms.forEach((roomId) => {
        // Remove the participant from the room
        participants[roomId] = participants[roomId]?.filter((p) => p.socketId !== socket.id);

        // Notify remaining users in the room
        socket.to(roomId).emit("user-left", { socketId: socket.id });

        // Emit updated participant list
        io.to(roomId).emit("update-participants", participants[roomId]);

        // Cleanup the room if no participants are left
        if (participants[roomId]?.length === 0) {
          clearTimeout(roomTimers[roomId]); // Clear room timer
          delete participants[roomId]; // Remove room participants
          delete roomTimers[roomId]; // Remove the timer
          console.log(`Room ${roomId} is now empty and has been deleted.`);
        }
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
