require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

// 👉 Bật CORS, cho phép FE truy cập API

app.use(cors({
  origin: "https://tasknet-fe.vercel.app",  // domain FE của bạn trên Vercel
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
// Middlewares
app.use(express.json());
app.use(morgan("dev"));

// Test route
app.get("/", (_, res) => res.json({ ok: true }));

// API routes
app.use("/api/tasks", taskRoutes);
app.get("/ping", (_, res) => res.json({ msg: "pong" }));

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    const port = process.env.PORT || 4000;
    const host = "0.0.0.0"; // 👈 Bắt buộc để Render expose ra ngoài
    app.listen(port, host, () =>
      console.log(`🚀 Server running on http://${host}:${port}`)
    );
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
})();
