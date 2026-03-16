const express = require("express");
const { verifyAdmin } = require("../middleware/admin.middleware");
const {
  createProject,
  listProjects,
  revokeProject,
  regenerateKey,
  deleteProject,
} = require("../controllers/project.controller");

const router = express.Router();

router.use(verifyAdmin); // all project routes require admin token

router.post("/", createProject);
router.get("/", listProjects);
router.patch("/:id/revoke", revokeProject);
router.patch("/:id/regenerate", regenerateKey);
router.delete("/:id", deleteProject);

module.exports = router;
