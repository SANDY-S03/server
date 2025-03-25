const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let channels = {}; // Store active channels and users

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("createChannel", (channelId) => {
    if (!channels[channelId]) {
      channels[channelId] = [];
    }
    channels[channelId].push(socket.id);
    socket.join(channelId);
    console.log(`User ${socket.id} joined channel ${channelId}`);
  });

  socket.on("sendData", ({ channelId, type, content }) => {
    io.to(channelId).emit("receiveData", { type, content });
  });

  socket.on("disconnect", () => {
    for (const channel in channels) {
      channels[channel] = channels[channel].filter((id) => id !== socket.id);
      if (channels[channel].length === 0) delete channels[channel];
    }
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
