const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  const { orderId } = socket.handshake.query;

  if (orderId) {
    socket.join(`order_${orderId}`);
    console.log(`Socket ${socket.id} joined room: order_${orderId}`);
  }

  // Rider updates location
  socket.on('update-location', (data) => {
    // data: { orderId, lat, lng, eta }
    console.log(`Location update for order ${data.orderId}:`, data.lat, data.lng);
    
    // Broadcast to everyone in the room (the customer)
    io.to(`order_${data.orderId}`).emit('location-update', {
      lat: data.lat,
      lng: data.lng,
      eta: data.eta
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
