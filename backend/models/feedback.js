const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userName: { type: String, default: "Unknown user" },
  userEmail: { type: String, default: "No email" },
  title: { type: String, default: "General feedback" },
  message: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  category: { type: String, default: "General" },
  channel: { type: String, default: "Website" },
  formVersion: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending", "reviewed", "resolved", "rejected"],
    default: "pending",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  adminNote: { type: String, default: "" },
  moderated: { type: Boolean, default: false },
  statusHistory: [
    {
      status: String,
      note: String,
      changedAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Feedback", feedbackSchema);
