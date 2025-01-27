const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (if needed for testing)
app.get('/', (req, res) => {
  res.send('WebRTC signaling server is running.');
});

// Handle WebRTC signaling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a room
  socket.on('join-room', (roomId) => {
  socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  // Receive and forward an offer
  socket.on('offer', (offer, roomId) => {
    socket.to(roomId).emit('offer', offer);
  });

  // Receive and forward an answer
  socket.on('answer', (answer, roomId) => {
    socket.to(roomId).emit('answer', answer);
  });

  // Receive and forward ICE candidates
  socket.on('ice-candidate', (candidate, roomId) => {
    socket.to(roomId).emit('ice-candidate', candidate);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Signaling server running on http://localhost:${PORT}`);
});
