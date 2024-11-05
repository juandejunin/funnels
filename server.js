require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); // Para servir archivos estáticos

// Conectar a MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Conexión a MongoDB establecida");
  })
  .catch((err) => {
    console.error("Error al conectar a MongoDB:", err.message);
    process.exit(1);
  });

// Modelo de Usuario
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    name: String,
    email: String,
    isConfirmed: { type: Boolean, default: false },
    verificationToken: String,
  })
);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/inicio.html"); // Cambia la ruta según la ubicación de tu archivo inicio.html
});

// Ruta para manejar las solicitudes del formulario
app.post("/request-book", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required" });
  }

  try {
    // Genera un token de verificación
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Crea y guarda un nuevo usuario
    const newUser = new User({ name, email, verificationToken: token });
    await newUser.save();

    // Configura Nodemailer
    const transporter = nodemailer.createTransport({
      service: "Gmail", // o cualquier otro servicio de email
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Enlace de verificación
    const verificationLink = `http://localhost:${PORT}/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Email to Get the Free PDF Book",
      text: `Please click the following link to verify your email: ${verificationLink}`,
    };

    await transporter.sendMail(mailOptions);

    // Redirige al usuario a la página de confirmación
    res.redirect("/verify-email.html");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending verification email" });
  }
});

app.get("/verify-email", async (req, res) => {
  const token = req.query.token;

  try {
    // Verifica el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    // Busca al usuario y marca el correo como confirmado
    const user = await User.findOne({ email, verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.isConfirmed = true;
    user.verificationToken = null; // Limpia el token después de la verificación
    await user.save();

    // Configura Nodemailer para enviar el PDF
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Free PDF Book",
      text: "Thank you for verifying your email! Here is your PDF book.",
      attachments: [
        {
          filename: "book.pdf",
          path: "./teoria.pdf",
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    // Redirige a la página de confirmación exitosa
    res.redirect("/confirmation-success.html");
    // res.status(200).json({ message: 'Email verified successfully. The PDF has been sent to your email.' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

// Iniciar el servidor
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
