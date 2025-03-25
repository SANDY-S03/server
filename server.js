const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const channels = {}; // Store active channels

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Create or Join a Channel
  socket.on("createChannel", async (channelId) => {
    socket.join(channelId);
    channels[channelId] = socket.id;
    console.log(`Channel Created/Joined: ${channelId}`);

    const { error } = await supabase
      .from("channels")
      .upsert([{ id: channelId, created_at: new Date().toISOString() }]);

    if (error) {
      console.error("Supabase Error:", error);
    }
  });

  socket.on("sendData", async (data) => {
    io.to(data.channelId).emit("receiveData", data);

    const { error } = await supabase.from("messages").insert([
      {
        channel_id: data.channelId,
        type: data.type,
        content: data.content,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Supabase Error:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
