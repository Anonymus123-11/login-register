require("dotenv").config();
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(to, subject, text, html = null) {
  const msg = {
    to,
    from: process.env.FROM_EMAIL,
    subject,
    text,
    html: html || `<p>${text}</p>`,
  };
  try {
    await sgMail.send(msg);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("SendGrid error:", error);
    if (error.response) console.error(error.response.body);
    throw new Error("Failed to send email");
  }
}

// Gửi OTP
async function sendOtpEmail(to, otp) {
  console.log(`[DEV] OTP for ${to}: ${otp}`); // log OTP để test
  await sendEmail(
    to,
    "Your OTP Code",
    `Your OTP is: ${otp}`,
    `<p>Your OTP code is: <strong>${otp}</strong>. It expires in 5 minutes.</p>`
  );
}

module.exports = { sendEmail, sendOtpEmail };
