const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});


const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;


const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const channels = {};

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("createChannel", (channelId) => {
    socket.join(channelId);
    channels[channelId] = socket.id;
    console.log(`Channel created: ${channelId}`);
  });

  socket.on("sendData", async (data) => {
    io.to(data.channelId).emit("receiveData", data);

    
    const { error } = await supabase
      .from("messages")
      .insert([{ channel_id: data.channelId, content: data.content }]);

    if (error) {
      console.error("Supabase Insert Error:", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
