const mongoose = require("mongoose");
const crypto = require("crypto");

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  apiKey: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(32).toString("hex"),
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: String,
    default: "admin",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Project", projectSchema);
