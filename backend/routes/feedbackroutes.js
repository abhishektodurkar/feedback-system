const express = require("express");
const Feedback = require("../models/Feedback");
const FormConfig = require("../models/FormConfig");
const AuditLog = require("../models/AuditLog");
const protect = require("../middleware/authMiddleware");
const sendNotification = require("../utils/sendNotification");

const router = express.Router();

const defaultForm = {
  version: 1,
  title: "Feedback Form",
  categories: ["Website", "Service", "Support", "Suggestion", "Other"],
  channels: ["Website", "Mobile", "Email", "In person"],
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

const getActiveForm = async () => {
  let form = await FormConfig.findOne({ isActive: true }).sort({ version: -1 });
  if (!form) {
    form = await FormConfig.create(defaultForm);
  }
  return form;
};

const escapeCsv = (value) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

router.get("/form", protect, async (req, res) => {
  const form = await getActiveForm();
  res.json(form);
});

router.post("/form", protect, requireAdmin, async (req, res) => {
  const lastForm = await FormConfig.findOne().sort({ version: -1 });
  const version = lastForm ? lastForm.version + 1 : 1;

  await FormConfig.updateMany({}, { isActive: false });

  const form = await FormConfig.create({
    version,
    title: req.body.title || "Feedback Form",
    categories: req.body.categories || defaultForm.categories,
    channels: req.body.channels || defaultForm.channels,
    isActive: true,
  });

  await AuditLog.create({
    action: "FORM_VERSION_CREATED",
    userEmail: req.user.email,
    details: `Form version ${version} created`,
  });

  res.status(201).json(form);
});

router.post("/", protect, async (req, res) => {
  try {
    const { title, message, rating, category, channel } = req.body;
    if (!message || !rating) {
      return res.status(400).json({ message: "Message and rating are required" });
    }

    const form = await getActiveForm();
    const feedback = new Feedback({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      title,
      message,
      rating,
      category,
      channel,
      formVersion: form.version,
      priority: Number(rating) <= 2 ? "high" : Number(rating) === 3 ? "medium" : "low",
      statusHistory: [{ status: "pending", note: "Feedback submitted" }],
    });

    await feedback.save();
    await AuditLog.create({
      action: "FEEDBACK_SUBMITTED",
      userEmail: req.user.email,
      details: `${category || "General"} feedback submitted with rating ${rating}`,
    });

    await sendNotification(
      req.user.email,
      "Feedback Submitted",
      "Thanks for your feedback. Your submission was received successfully."
    );

    res.status(201).json({ message: "Feedback received", feedback });
  } catch (err) {
    console.error("Error saving feedback:", err.message);
    res.status(500).json({ message: "Server error while saving feedback" });
  }
});

router.get("/mine", protect, async (req, res) => {
  const feedbacks = await Feedback.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(feedbacks);
});

router.get("/all", protect, requireAdmin, async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    console.error("Error fetching feedbacks:", err.message);
    res.status(500).json({ message: "Failed to retrieve feedbacks" });
  }
});

router.get("/analytics", protect, requireAdmin, async (req, res) => {
  const feedbacks = await Feedback.find().lean();
  const total = feedbacks.length;
  const averageRating = total
    ? (feedbacks.reduce((sum, fb) => sum + Number(fb.rating || 0), 0) / total).toFixed(1)
    : "0.0";

  const countBy = (key) =>
    feedbacks.reduce((result, item) => {
      const label = item[key] || "Unknown";
      result[label] = (result[label] || 0) + 1;
      return result;
    }, {});

  res.json({
    total,
    averageRating,
    byStatus: countBy("status"),
    byCategory: countBy("category"),
    byRating: countBy("rating"),
    highPriority: feedbacks.filter((fb) => fb.priority === "high").length,
  });
});

router.patch("/:id/status", protect, requireAdmin, async (req, res) => {
  const { status, adminNote } = req.body;
  const allowedStatuses = ["pending", "reviewed", "resolved", "rejected"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const feedback = await Feedback.findById(req.params.id).populate("user", "email");
  if (!feedback) return res.status(404).json({ message: "Feedback not found" });

  feedback.status = status;
  feedback.adminNote = adminNote || "";
  feedback.moderated = true;
  feedback.statusHistory.push({
    status,
    note: adminNote || `Marked as ${status}`,
  });
  await feedback.save();

  await AuditLog.create({
    action: "FEEDBACK_STATUS_UPDATED",
    userEmail: req.user.email,
    details: `Feedback ${feedback._id} marked as ${status}`,
  });

  if (feedback.user?.email) {
    await sendNotification(
      feedback.user.email,
      "Feedback Status Updated",
      `Your feedback is now marked as ${status}.`
    );
  }

  res.json(feedback);
});

router.get("/audit", protect, requireAdmin, async (req, res) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(50);
  res.json(logs);
});

router.get("/export", protect, requireAdmin, async (req, res) => {
  try {
    const format = req.query.format || "json";
    const feedbacks = await Feedback.find().populate("user", "name email").lean();

    if (format === "csv") {
      const headers = [
        "User Name",
        "Email",
        "Title",
        "Category",
        "Channel",
        "Rating",
        "Status",
        "Priority",
        "Form Version",
        "Message",
        "Created At",
      ];
      const rows = feedbacks.map((fb) => [
        fb.user?.name,
        fb.user?.email,
        fb.title,
        fb.category,
        fb.channel,
        fb.rating,
        fb.status,
        fb.priority,
        fb.formVersion,
        fb.message,
        fb.createdAt,
      ]);
      const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");

      res.setHeader("Content-Disposition", 'attachment; filename="feedback_export.csv"');
      res.setHeader("Content-Type", "text/csv");
      return res.status(200).send(csv);
    }

    res.setHeader("Content-Disposition", 'attachment; filename="feedback_export.json"');
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify(feedbacks, null, 2));
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).send("Error exporting feedback.");
  }
});

module.exports = router;
