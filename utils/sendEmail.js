require("dotenv").config(); 
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOtpEmail = async (to, otp) => {
  const msg = {
    to,
    from: process.env.SENDGRID_SENDER_EMAIL,
    subject: "Mã OTP đặt lại mật khẩu",
    text: `Mã OTP của bạn là: ${otp}. Mã có hiệu lực 10 phút.`,
    html: `<p>Mã OTP của bạn là: <b>${otp}</b></p><p>Mã có hiệu lực 10 phút.</p>`,
  };

  try {
    await sgMail.send(msg);
    console.log("Email OTP đã gửi thành công!");
  } catch (err) {
    console.error("Gửi email OTP lỗi:", err.response ? err.response.body : err);
    throw err;
  }
};

module.exports = sendOtpEmail;
