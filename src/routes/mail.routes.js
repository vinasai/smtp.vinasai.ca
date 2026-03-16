const express = require("express");
const { sendMailHandler } = require("../controllers/mail.controller");
const { authenticateApiKey } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/send-mail", authenticateApiKey, sendMailHandler);

module.exports = router;
