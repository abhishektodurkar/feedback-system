require("dotenv").config();
const connectDB = require("./config/db");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

// Connect to MongoDB first
connectDB();

const createAdmin = async () => {
  try {
    const existing = await User.findOne({ email: "admin@example.com" });
    if (existing) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = new User({
      name: "Admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
    });

    await admin.save();
    console.log("✅ Admin created in 'feedback_system' database");
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
  } finally {
    process.exit(); // Exit after completion
  }
};

createAdmin();
