const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

const router = express.Router();

// Register Route
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const selectedRole = ["user", "admin"].includes(role) ? role : "user";

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: selectedRole,
    });

    await user.save();
    await AuditLog.create({
      action: "USER_REGISTERED",
      userEmail: email,
      details: `${name} registered as ${user.role}`,
    });

    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    if (role && user.role !== role) {
      return res.status(403).json({ message: `This account is registered as ${user.role}` });
    }

    await AuditLog.create({
      action: "USER_LOGIN",
      userEmail: user.email,
      details: `${user.name} logged in as ${user.role}`,
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
