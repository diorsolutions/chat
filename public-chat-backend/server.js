const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

app.post("/verify-user", (req, res) => {
  const { firstName, lastName } = req.body;
  if (!firstName || !lastName) {
    return res.status(400).json({ error: "Ism va familiya kiritilishi shart!" });
  }
  if (firstName.length < 2 || lastName.length < 2) {
    return res.status(400).json({ error: "Ism va familiya kamida 2 ta harfdan iborat bo'lishi kerak!" });
  }
  const nameRegex = /^[a-zA-Z\u00C0-\u017F']+$/;
  if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
    return res.status(400).json({ error: "Ism va familiya faqat harflardan iborat bo'lishi kerak!" });
  }

  res.status(200).json({
    message: "Foydalanuvchi tasdiqlandi",
    user: { firstName, lastName },
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

mongoose
  .connect("mongodb://localhost:27017/public-chat", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB ga ulanish muvaffaqiyatli!"))
  .catch((err) => console.error("MongoDB ga ulanishda xatolik:", err));

const messageSchema = new mongoose.Schema({
  username: String,
  text: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

const users = {};

// ✅ Qo‘shilgan funksiya — barcha userlar ro‘yxatini yuborish
const emitOnlineUsers = () => {
  const userList = Object.values(users); // faqat username lar
  io.emit("update-users", userList);
};

io.on("connection", (socket) => {
  console.log("Yangi foydalanuvchi ulandi:", socket.id);

  socket.on("set-username", async ({ firstName, lastName }) => {
    const username = `${firstName} ${lastName}`;
    users[socket.id] = username;
    console.log("Foydalanuvchi nomi o'rnatildi:", username);

    socket.emit("user-joined", {
      username,
      message: `Siz chatga qo'shildingiz`,
      type: "system",
    });

    socket.broadcast.emit("user-joined", {
      username,
      message: `${username} chatga qo'shildi`,
      type: "system",
    });

    emitOnlineUsers(); // ✅ yangi userlar ro‘yxatini frontga yuborish

    try {
      const last20Messages = await Message.find().sort({ timestamp: -1 }).limit(20).exec();
      socket.emit("last-20-messages", last20Messages.reverse());
    } catch (error) {
      console.error("Xabarlarni olishda xatolik:", error);
    }
  });

  socket.on("typing", () => {
    const username = users[socket.id];
    if (username) {
      socket.broadcast.emit("typing", { username });
    }
  });

  socket.on("stop-typing", () => {
    const username = users[socket.id];
    if (username) {
      socket.broadcast.emit("stop-typing", { username });
    }
  });

  socket.on("new-message", async (text) => {
    const username = users[socket.id];
    if (!username || !text) return;

    const newMessage = new Message({ username, text, timestamp: new Date() });

    try {
      await newMessage.save();
      io.emit("message", newMessage);
    } catch (err) {
      console.error("Xabarni saqlashda xatolik:", err);
    }
  });

  socket.on("disconnect", () => {
    const username = users[socket.id];
    if (username) {
      io.emit("user-left", { username, message: `${username} chatdan chiqdi` });
      delete users[socket.id];
      emitOnlineUsers(); // ✅ user chiqsa — ro‘yxatni yangilash
    }
  });
});

server.listen(port, () => {
  console.log(`Server ${port} portida ishlayapti`);
});
