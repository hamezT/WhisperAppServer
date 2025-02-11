require('dotenv').config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/database');
const authenticateToken = require('./middleware/authenticateToken'); // Đường dẫn đến middleware xác thực của bạn
const User = require('./models/User'); // Đường dẫn đến mô hình User

const app = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
const apiRoutes = require("./routes/index.js");
const imgRoutes = require("./routes");       // Đường dẫn tới file routes.js bên ngoài

app.use("/api", apiRoutes);
app.use("/", imgRoutes)

// Socket.IO logic
// Xử lý kết nối Socket.IO
io.on('connection', (socket) => {
  console.log('Một người dùng đã kết nối');
  
  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`Người dùng đã tham gia phòng trò chuyện: ${chatId}`);
  });

  socket.on('newMessage', async (data) => {
    console.log(data); // Thêm dòng này để console ra toàn bộ dữ liệu nhận được
    const { chatId, senderId, content, type, fileUrl, createdAt } = data;

    // Lấy avatar của người gửi từ cơ sở dữ liệu
    const sender = await User.findById(senderId).select('avatar');
    const avatar = sender.avatar;

    socket.to(chatId).emit('message', {
      chatId,
      senderId,
      avatar,
      content,
      type,
      fileUrl,
      createdAt,
    });
    console.log(`avatar ${avatar}`)
    console.log(`Tin nhắn mới từ ${senderId} trong phòng trò chuyện ${chatId}`);
  });
  // Thêm sự kiện "typing"
  socket.on('typing', (data) => {
    const { chatId, userId } = data;
    socket.to(chatId).emit('typing', { userId });
    console.log(`Người dùng ${userId} đang nhập tin nhắn trong phòng trò chuyện ${chatId}`);
  });

  socket.on('disconnect', () => {
    console.log('Người dùng đã ngắt kết nối');
  });
});

server.listen(port, "10.21.14.129", () => {
  console.log(`Server started on port ${port}`);
});