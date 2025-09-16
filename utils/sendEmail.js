require("dotenv").config();
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends an OTP email
 * @param {string} to - recipient email
 * @param {string} otp - OTP code
 * @param {string} [subject="Mã OTP"] - email subject (optional)
 * @param {string} [message] - custom message (optional)
 */
const sendOtpEmail = async (to, otp, subject = "Mã OTP", message) => {
  const msg = {
    to,
    from: process.env.SENDGRID_SENDER_EMAIL,
    subject,
    text: message || `Mã OTP của bạn là: ${otp}. Mã có hiệu lực 10 phút.`,
    html: `<p>Mã OTP của bạn là: <b>${otp}</b></p><p>Mã có hiệu lực 10 phút.</p>`,
  };

  try {
    await sgMail.send(msg);
    console.log("Email OTP đã gửi thành công tới:", to);
  } catch (err) {
    console.error("Gửi email OTP lỗi:", err.response ? err.response.body : err);
    throw err;
  }
};

module.exports = sendOtpEmail;
