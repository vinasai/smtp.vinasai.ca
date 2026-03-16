const crypto = require("crypto");
const Project = require("../models/project.model");

const createProject = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res
      .status(400)
      .json({ success: false, message: "Project name is required" });
  }
  try {
    const project = await Project.create({ name });
    return res.status(201).json({ success: true, project });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Project name already exists" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

const listProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    return res.json({ success: true, projects });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const revokeProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    return res.json({ success: true, project });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const regenerateKey = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { apiKey: crypto.randomBytes(32).toString("hex"), isActive: true },
      { new: true },
    );
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    return res.json({ success: true, project });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    return res.json({ success: true, message: "Project deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProject,
  listProjects,
  revokeProject,
  regenerateKey,
  deleteProject,
};
