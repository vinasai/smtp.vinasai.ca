const express = require("express");
const { authenticateApiKey } = require("../middleware/auth.middleware");
const { sendMailHandler } = require("../controllers/mail.controller");

const router = express.Router();

router.post("/send-mail", authenticateApiKey, sendMailHandler);

module.exports = router;
