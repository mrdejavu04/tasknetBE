const mongoose = require("mongoose");

async function connectDB(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    autoIndex: true, // lần đầu sẽ tạo index theo schema
  });
  console.log("✅ MongoDB connected");
}

module.exports = connectDB;
