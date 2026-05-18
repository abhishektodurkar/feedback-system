const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  userEmail: { type: String, default: "system" },
  details: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
