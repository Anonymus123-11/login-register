const nodemailer = require("nodemailer");

let cachedTransporter = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE,
  } = process.env;

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE || "false").toLowerCase() === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return cachedTransporter;
}

async function sendOtpEmail(to, otpCode) {
  try {
    const transporter = await getTransporter();
    const from = process.env.SMTP_FROM || "no-reply@example.com";

    const info = await transporter.sendMail({
      from,
      to,
      subject: "Your OTP Code",
      text: `Your verification code is ${otpCode}. It expires in 10 minutes.`,
      html: `<p>Your verification code is <b>${otpCode}</b>. It expires in 10 minutes.</p>`,
    });

    console.log("✅ OTP email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Email send error:", err);
    throw err;
  }
}

module.exports = { sendOtpEmail };
