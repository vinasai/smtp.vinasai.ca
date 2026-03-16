const { sendMail } = require("../services/mail.service");

const sendMailHandler = async (req, res) => {
  const { from, appPassword, to, subject, body } = req.body;

  if (!from || !appPassword || !to || !subject || !body) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: from, appPassword, to, subject, body",
    });
  }

  try {
    const messageId = await sendMail({ from, appPassword, to, subject, body });
    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
      messageId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: error.message,
    });
  }
};

module.exports = { sendMailHandler };
