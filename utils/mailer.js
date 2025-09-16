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

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
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

  // Fallback: use Ethereal test account if SMTP not configured
  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  return cachedTransporter;
}

async function sendOtpEmail(to, otpCode) {
  const transporter = await getTransporter();
  const from = process.env.SMTP_FROM || "no-reply@example.com";

  const info = await transporter.sendMail({
    from,
    to,
    subject: "Your OTP Code",
    text: `Your verification code is ${otpCode}. It expires in 10 minutes.`,
    html: `<p>Your verification code is <b>${otpCode}</b>. It expires in 10 minutes.</p>`,
  });

  if (nodemailer.getTestMessageUrl && info) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("Ethereal message preview:", previewUrl);
    }
  }
}

module.exports = { sendOtpEmail };


