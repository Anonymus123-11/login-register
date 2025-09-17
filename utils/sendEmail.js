require("dotenv").config();
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(to, subject, text, html = null) {
  const msg = {
    to,
    from: process.env.FROM_EMAIL, // email đã verify trên SendGrid
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

module.exports = sendEmail;
