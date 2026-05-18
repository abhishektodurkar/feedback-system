const mongoose = require("mongoose");

const formConfigSchema = new mongoose.Schema({
  version: { type: Number, required: true, unique: true },
  title: { type: String, default: "Feedback Form" },
  categories: {
    type: [String],
    default: ["Website", "Service", "Support", "Suggestion", "Other"],
  },
  channels: {
    type: [String],
    default: ["Website", "Mobile", "Email", "In person"],
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("FormConfig", formConfigSchema);
