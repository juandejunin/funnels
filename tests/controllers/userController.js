const User = require("../models/user");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

// Función para manejar el registro
async function handleRegistrationRequest(userData) {
  try {
    const existingUser = await User.findOne({ email: userData.email });

    if (existingUser) {
      await sendEmailWithOptions(existingUser, userData);
      return;
    }

    // Crear un nuevo usuario si no existe
    const token = jwt.sign(
      { email: userData.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const newUser = new User({
      name: userData.name,
      email: userData.email,
      verificationToken: token,
    });

    await newUser.save();
    await sendVerificationEmail(userData.email, token);

  } catch (error) {
    console.error("Error al registrar usuario:", error.message);
  }
}

// Función para enviar un correo de verificación
async function sendVerificationEmail(email, token) {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const verificationLink = `http://localhost:${process.env.PORT}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verifica tu correo para recibir el libro gratuito",
    text: `Por favor, haz clic en el siguiente enlace para verificar tu correo: ${verificationLink}`,
  };

  await transporter.sendMail(mailOptions);
}

// Función para enviar el libro por correo
async function sendBookEmail(user) {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Tu libro gratuito PDF",
    text: "Gracias por verificar tu correo. ¡Aquí está tu libro en PDF!",
    attachments: [
      {
        filename: "book.pdf",
        path: "./teoria.pdf", // Asegúrate de que la ruta sea correcta
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { handleRegistrationRequest, sendBookEmail };
