const nodemailer = require("nodemailer");

function createTransporter() {
  return nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendEmail(mailOptions) {
  const transporter = createTransporter();
  try {
    await transporter.sendMail(mailOptions);
    console.log("Correo enviado:", mailOptions.to);
  } catch (error) {
    console.error("Error al enviar el correo:", error);
  }
}

module.exports = { createTransporter, sendEmail };
