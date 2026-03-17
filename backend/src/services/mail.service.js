const nodemailer = require("nodemailer");

const sendMail = async ({ from, appPassword, to, subject, body }) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: from,
      pass: appPassword,
    },
  });

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html: body,
  });

  return info.messageId;
};

module.exports = { sendMail };
