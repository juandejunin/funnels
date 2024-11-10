const User = require("../models/user");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");


// Lógica para manejar el registro de un usuario
async function handleRegistrationRequest(userData) {
  try {
    const existingUser = await User.findOne({ email: userData.email });

    if (existingUser) {
      await sendEmailWithOptions(existingUser, userData);
      return; // Si el usuario ya existe, sale de la función
    }

    // Crear un nuevo usuario si no existe
    const token = jwt.sign({ email: userData.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const newUser = new User({
      name: userData.name,
      email: userData.email,
      verificationToken: token,
    });

    await newUser.save();
    await sendVerificationEmail(userData.email, token);
  } catch (error) {
    throw new Error("Error al registrar usuario: " + error.message);
  }
}

// Enviar correo de verificación
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

// Enviar el libro por correo
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
// Enviar un correo cuando el usuario ya existe en la base de datos, ofreciéndole la opción de mantener su nombre o cambiarlo
async function sendEmailWithOptions(existingUser, newUserData) {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const token = jwt.sign(
    {
      existingUserName: existingUser.name,
      newName: newUserData.name,
      email: existingUser.email,
      actionOptions: ["maintain", "change"], // Opciones de acción
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  console.log(
    "Token generado para opciones de actualización de nombre:",
    token
  );

  // const optionsLink = `http://localhost:${process.env.PORT}/update-name?email=${existingUser.email}&action=maintain`;
  // const changeNameLink = `http://localhost:${process.env.PORT}/update-name?email=${existingUser.email}&action=change&newName=${newUserData.name}`;

  const optionsLink = `http://localhost:${process.env.PORT}/update-name?token=${token}&action=maintain`;
  const changeNameLink = `http://localhost:${process.env.PORT}/update-name?token=${token}&action=change&newName=${newUserData.name}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: existingUser.email,
    subject: "Ya estás registrado, ¿quieres actualizar tu nombre?",
    text: `
      Hola ${existingUser.name},
      
      Ya tenemos un registro con tu correo electrónico. Por favor, elige una de las siguientes opciones:
      
      1. Si deseas mantener tu nombre actual, haz clic en el siguiente enlace: ${optionsLink}.
      2. Si prefieres cambiar tu nombre, haz clic en este otro enlace: ${changeNameLink}.
      
      Si tienes alguna duda, no dudes en ponerte en contacto con nosotros.

      ¡Gracias por tu interés!

      Saludos,
      El equipo de soporte
    `,
  };

  // Enviar el correo
  await transporter.sendMail(mailOptions);
}

async function updateNameService({ token, action, newName }) {
  console.log(token)
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const email = decodedToken.email;

    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    if (action === 'maintain') {
      await sendBookEmail(user);
      return { message: `Nombre actual: ${user.name}. Se mantiene el nombre y continúa con la solicitud del material.` };
    }

    if (action === 'change' && newName) {
      user.name = newName;
      await user.save();
      await sendBookEmail(user);
      return { message: `Nombre cambiado a "${newName}" exitosamente. El libro ha sido enviado a tu correo.` };
    }

    throw new Error("Acción no válida o falta el nuevo nombre");
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = {
  handleRegistrationRequest,
  sendBookEmail,
  updateNameService,
};
