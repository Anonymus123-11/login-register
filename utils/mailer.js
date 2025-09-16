// utils/mailer.js
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
    SMTP_FROM,
  } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure:
        String(SMTP_SECURE || "").toLowerCase() === "true" ||
        Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    cachedTransporter.from = SMTP_FROM || SMTP_USER;
    return cachedTransporter;
  }

  // Fallback Ethereal cho môi trường dev nếu chưa cấu hình SMTP_*
  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  cachedTransporter.from = `"Auth Demo (Ethereal)" <${testAccount.user}>`;
  return cachedTransporter;
}

/**
 * Gửi OTP qua email
 * @param {string} to
 * @param {string} otpCode
 * @param {"verify"|"reset"} purpose
 */
async function sendOtpEmail(to, otpCode, purpose = "verify") {
  const transporter = await getTransporter();

  const subject =
    purpose === "reset" ? "Your password reset code" : "Your verification code";

  const intro =
    purpose === "reset"
      ? "Use the following code to reset your password:"
      : "Use the following code to verify your email:";

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <p>${intro}</p>
      <p style="font-size:20px"><b>${otpCode}</b></p>
      <p>This code will expire in <b>10 minutes</b>.</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: transporter.from,
    to,
    subject,
    html,
  });

  if (nodemailer.getTestMessageUrl && info) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log("📬 Ethereal preview:", previewUrl);
  }
}

module.exports = { sendOtpEmail };
