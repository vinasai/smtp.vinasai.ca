const nodemailer = require("nodemailer");

const sendMail = async ({
  from,
  appPassword,
  to,
  subject,
  body,
  attachments,
}) => {
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
    ...(attachments?.length && { attachments }),
  });

  return info.messageId;
};

module.exports = { sendMail };
