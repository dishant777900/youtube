
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // console.log("Mongo URL:", process.env.MONGODB_URL);

    await mongoose.connect(process.env.MONGODB_URL);

    console.log("✅ Connected with MongoDB");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:");
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;