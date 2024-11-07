const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");



// router.get("/", (req, res) => {
//     res.sendFile(path.join(__dirname, "../public/inicio.html"));
//   });

// Ruta para manejar las solicitudes del formulario
router.post("/request-book", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required" });
  }

  try {
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const newUser = new User({ name, email, verificationToken: token });
    await newUser.save();

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
      subject: "Verify Your Email to Get the Free PDF Book",
      text: `Please click the following link to verify your email: ${verificationLink}`,
    };

    await transporter.sendMail(mailOptions);
    res.redirect("/verify-email.html");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending verification email" });
  }
});

// Ruta de verificación de correo electrónico
router.get("/verify-email", async (req, res) => {
  const token = req.query.token;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    const user = await User.findOne({ email, verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.isConfirmed = true;
    user.verificationToken = null;
    await user.save();

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
    res.redirect("/confirmation-success.html");
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

module.exports = router;
