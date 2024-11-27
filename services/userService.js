const User = require("../models/user");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const ejs = require("ejs");
const path = require("path");

let PORT;
let unsubscribeLink = "";
if (process.env.NODE_ENV === "development") {
  PORT = process.env.PORT_HTTP || 3000; // Puerto para desarrollo
} else if (process.env.NODE_ENV === "production") {
  PORT = process.env.PORT_HTTPS || 443; // Puerto para producción (puerto por defecto 443)
}

function generateUnsubscribeLink(email) {
  // Generar el token de desuscripción
  const token = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "1h", // Expiración del token
  });

  // Crear el enlace real de desuscripción, con el dominio correcto (puede ser 'localhost' o el dominio en producción)
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  let unsubscribeLink = `${protocol}://${process.env.BASE_URL}${
    process.env.NODE_ENV === "production" ? "" : `:${PORT}`
  }/unsubscribe?email=${email}&token=${token}`;

  return unsubscribeLink;
}

async function handleRegistrationRequest(userData) {
  try {
    // Buscar usuario por email
    const existingUser = await User.findOne({ email: userData.email });

    if (existingUser) {
      if (!existingUser.isConfirmed) {
        // Si el usuario no está confirmado, reutilizar el token existente
        let token = existingUser.verificationToken;

        if (!token) {
          // Generar un nuevo token si no existe
          token = jwt.sign(
            { email: existingUser.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
          );
          existingUser.verificationToken = token;
          await existingUser.save();
        }

        console.log("Token reutilizado/enviado:", token);
        // Enviar correo de verificación
        await sendVerificationEmail(existingUser.email, token);
        return;
      }

      if (existingUser.name === userData.name) {
        // Si el usuario está confirmado y el nombre coincide, enviamos el libro directamente
        await sendBookEmail(existingUser);
        return;
      }

      // Si el nombre es diferente, enviamos opciones para cambiar o mantener el nombre
      await sendEmailWithOptions(existingUser, userData);
      return;
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
    console.error("Error en el servicio de registro:", error.message);
    throw new Error("Error al registrar usuario: " + error.message);
  }
}

async function sendVerificationEmail(email, token) {
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const baseURL = process.env.BASE_URL || "localhost";
  const port =
    process.env.NODE_ENV === "production" ? "" : `:${process.env.PORT || 80}`;

  // Generar enlaces con protocolo dinámico
  const verificationLink = `${protocol}://${baseURL}${port}/verify-email?token=${token}`;

  let unsubscribeLink = generateUnsubscribeLink(email);
  // Ruta de la plantilla EJS
  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    "emailTemplate.ejs"
  );
  try {
    // Cargar y renderizar la plantilla EJS
    const htmlContent = await ejs.renderFile(templatePath, {
      verificationLink,
      unsubscribeLink,
    });

    // Configurar transporte de correo
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Opciones del correo
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verifica tu correo para recibir el libro gratuito",
      html: htmlContent,
    };

    // Enviar correo
    await transporter.sendMail(mailOptions);
    console.log("Correo de verificación enviado a:", email);
  } catch (error) {
    console.error("Error al enviar el correo:", error);
  }
}

async function sendBookEmail(user) {
  // Generar enlace de cancelación de suscripción
  let unsubscribeLink = generateUnsubscribeLink(user.email);

  // Cargar y renderizar la plantilla EJS
  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    "bookEmailTemplate.ejs"
  );

  const htmlContent = await ejs.renderFile(templatePath, {
    unsubscribeLink,
  });

  // Crear un transportador para Nodemailer
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Configuración del correo
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Tu libro gratuito Aprendizaje Typescript",
    text: "Gracias por verificar tu correo. ¡Aquí está tu libro electrónico gratuito creado a partir de contribuyentes de Stack Overflow!",
    attachments: [
      {
        filename: "book.pdf",
        path: "./typescript-es.pdf", // Asegúrate de que la ruta sea correcta
      },
    ],
    html: htmlContent,
  };

  try {
    // Enviar el correo
    await transporter.sendMail(mailOptions);
    console.log("Correo de libro enviado a:", user.email);
  } catch (error) {
    console.error("Error al enviar el correo:", error);
  }
}

async function sendEmailWithOptions(existingUser, newUserData) {
  let unsubscribeLink = generateUnsubscribeLink(existingUser.email);

  // Crear un transportador para Nodemailer
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

  const optionsLink = `${process.env.BASE_URL}/update-name?token=${token}&action=maintain`;
  const changeNameLink = `${process.env.BASE_URL}/update-name?token=${token}&action=change&newName=${newUserData.name}`;

  // Cargar y renderizar la plantilla EJS
  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    "updateNameEmailTemplate.ejs"
  );
  const htmlContent = await ejs.renderFile(templatePath, {
    existingUserName: existingUser.name,
    newName: newUserData.name,
    optionsLink,
    changeNameLink,
    unsubscribeLink,
  });

  // Configuración del correo
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: existingUser.email,
    subject: "Ya estás registrado, ¿quieres actualizar tu nombre?",
    html: htmlContent,
  };

  try {
    // Enviar el correo
    await transporter.sendMail(mailOptions);
    console.log(
      "Correo de actualización de nombre enviado a:",
      existingUser.email
    );
  } catch (error) {
    console.error("Error al enviar el correo:", error);
  }
}

async function updateNameService({ token, action, newName }) {
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const email = decodedToken.email;

    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    if (action === "maintain") {
      await sendBookEmail(user);
      return {
        message: `Nombre actual: ${user.name}. Se mantiene el nombre y continúa con la solicitud del material.`,
      };
    }

    if (action === "change" && newName) {
      user.name = newName;
      await user.save();
      await sendBookEmail(user);
      return {
        message: `Nombre cambiado a "${newName}" exitosamente. El libro ha sido enviado a tu correo.`,
      };
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
  generateUnsubscribeLink,
};
