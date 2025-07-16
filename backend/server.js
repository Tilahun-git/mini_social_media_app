import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import cookieParser from 'cookie-parser';

import userRouter from "./routes/userRouter.js";
import postRouter from "./routes/postRouter.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);


const allowedOrigins = ["http://localhost:3000"];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));


app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads")); 
app.use(express.static(path.join(__dirname, 'public'))); 

app.use("/api/user", userRouter);
app.use("/api/posts", postRouter);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(" User connected:", socket.id);

  socket.on("newMessage", (message) => {
    io.emit("messageReceived", message);
  });

  socket.on("disconnect", () => {
    console.log(" User disconnected:", socket.id);
  });
});

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log(" MongoDB Connected"))
.catch((err) => console.error(" MongoDB Connection Error:", err));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
