const Project = require("../models/project.model");

const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res
      .status(401)
      .json({ success: false, message: "Missing x-api-key header" });
  }

  try {
    const project = await Project.findOne({ apiKey });

    if (!project) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid API key" });
    }

    if (!project.isActive) {
      return res
        .status(403)
        .json({ success: false, message: "API key has been revoked" });
    }

    req.project = project; // attach project info to request
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { authenticateApiKey };
