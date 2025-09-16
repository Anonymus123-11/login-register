const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail(to, subject, text) {
  await transporter.verify(); // báo lỗi cấu hình ngay nếu thiếu user/pass
  return transporter.sendMail({
    from: `"Support Team" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
}

module.exports = sendEmail;
