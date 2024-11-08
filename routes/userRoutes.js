// const express = require("express");
// const router = express.Router();
// const jwt = require("jsonwebtoken");
// const nodemailer = require("nodemailer");
// const User = require("../models/User");



// // router.get("/", (req, res) => {
// //     res.sendFile(path.join(__dirname, "../public/inicio.html"));
// //   });

// // Ruta para manejar las solicitudes del formulario
// router.post("/request-book", async (req, res) => {
//   const { name, email } = req.body;
//   if (!name || !email) {
//     return res.status(400).json({ message: "Name and email are required" });
//   }

//   try {
//     const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
//     const newUser = new User({ name, email, verificationToken: token });
//     await newUser.save();

//     const transporter = nodemailer.createTransport({
//       service: "Gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     const verificationLink = `http://localhost:${process.env.PORT}/verify-email?token=${token}`;

//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "Verify Your Email to Get the Free PDF Book",
//       text: `Please click the following link to verify your email: ${verificationLink}`,
//     };

//     await transporter.sendMail(mailOptions);
//     res.redirect("/verify-email.html");
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error sending verification email" });
//   }
// });

// // Ruta de verificación de correo electrónico
// router.get("/verify-email", async (req, res) => {
//   const token = req.query.token;

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const email = decoded.email;

//     const user = await User.findOne({ email, verificationToken: token });
//     if (!user) {
//       return res.status(400).json({ message: "Invalid or expired token" });
//     }

//     user.isConfirmed = true;
//     user.verificationToken = null;
//     await user.save();

//     const transporter = nodemailer.createTransport({
//       service: "Gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "Your Free PDF Book",
//       text: "Thank you for verifying your email! Here is your PDF book.",
//       attachments: [
//         {
//           filename: "book.pdf",
//           path: "./teoria.pdf",
//         },
//       ],
//     };

//     await transporter.sendMail(mailOptions);
//     res.redirect("/confirmation-success.html");
//   } catch (error) {
//     console.error(error);
//     res.status(400).json({ message: "Invalid or expired token" });
//   }
// });

// module.exports = router;


const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");

// Función para manejar la lógica de registro
async function handleRegistrationRequest(userData) {
  try {
    // Verificar si el correo ya existe en la base de datos
    const existingUser = await User.findOne({ email: userData.email });

    if (existingUser) {
      // Si el correo existe, enviar opciones al usuario
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userData.email,
        subject: "Correo Existente - Actualiza tu Información",
        text: `Hola ${existingUser.name},

        Hemos detectado que ya estás registrado con este correo. Puedes:
        
        1. **Actualizar tu nombre a "${userData.name}"** y continuar con la solicitud del material.
        2. **Mantener el nombre actual "${existingUser.name}"** y recibir el material solicitado sin cambiar tus datos.

        Por favor, responde a este correo con "Cambiar nombre" o "Mantener nombre" para proceder con tu solicitud.`,
      };

      await transporter.sendMail(mailOptions);

      // Esperar una respuesta (aquí necesitarías implementar un mecanismo para escuchar la respuesta)
      // Suponemos que la respuesta es procesada de alguna forma

      // Lógica para manejar la respuesta del usuario, por ejemplo, usando un webhook o API
      const userResponse = await listenForUserResponse(); // Esta función es hipotética

      if (userResponse === 'Cambiar nombre') {
        // Si el usuario decide cambiar el nombre, actualizar en la base de datos
        existingUser.name = userData.name;
        await existingUser.save();
      }

      // Enviar el material solicitado (sin importar si cambió o no el nombre)
      await sendMaterialToUser(existingUser.email);

    } else {
      // Si el correo no existe, crear un nuevo usuario y proceder
      const token = jwt.sign({ email: userData.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
      const newUser = new User({ name: userData.name, email: userData.email, verificationToken: token });
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
        to: userData.email,
        subject: "Verifica tu correo para recibir el libro gratuito",
        text: `Por favor, haz clic en el siguiente enlace para verificar tu correo: ${verificationLink}`,
      };

      await transporter.sendMail(mailOptions);
      res.redirect("/verify-email.html");
    }
  } catch (error) {
    console.error("Error en el registro del usuario:", error.message);
  }
}

// Ruta para manejar las solicitudes del formulario
router.post("/request-book", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required" });
  }

  try {
    await handleRegistrationRequest({ name, email });
    res.redirect("/confirmation-success.html");
  } catch (error) {
    res.status(500).json({ message: "Error handling the registration request" });
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
      subject: "Tu libro gratuito PDF",
      text: "Gracias por verificar tu correo. ¡Aquí está tu libro en PDF!",
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
