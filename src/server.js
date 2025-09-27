require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/api/tasks", taskRoutes);

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
