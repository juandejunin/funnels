const User = require("../models/user");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

// async function handleRegistrationRequest(userData) {
//   try {
//     const existingUser = await User.findOne({ email: userData.email });

//     if (existingUser) {
//       if (!existingUser.isConfirmed) {
//         // Si el usuario no está confirmado, reutilizar su token existente
//         let token = existingUser.verificationToken;
//         console.log("token viejo: ", token);
//         if (!token) {
//           // Generar un nuevo token si no existe
//           token = jwt.sign(
//             { email: existingUser.email },
//             process.env.JWT_SECRET,
//             {
//               expiresIn: "1h",
//             }
//           );

//           console.log("token luedo de la verificacion: ", token);
//           existingUser.verificationToken = token;
//           await existingUser.save();
//         }
//         // Enviar correo de verificación con el token existente
//         await sendVerificationEmail(existingUser.email, token);
//         return;
//       }

//       if (existingUser.name === userData.name) {
//         // Procedemos con el envío del libro directamente
//         await sendBookEmail(existingUser);
//         return;
//       }

//       // Si el nombre es diferente, enviamos las opciones para cambiar o mantener el nombre
//       await sendEmailWithOptions(existingUser, userData);
//       return;
//     }

//     // Crear un nuevo usuario si no existe
//     const token = jwt.sign({ email: userData.email }, process.env.JWT_SECRET, {
//       expiresIn: "1h",
//     });

//     const newUser = new User({
//       name: userData.name,
//       email: userData.email,
//       verificationToken: token,
//     });

//     await newUser.save();
//     await sendVerificationEmail(userData.email, token);
//   } catch (error) {
//     throw new Error("Error al registrar usuario: " + error.message);
//   }
// }

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
          token = jwt.sign({ email: existingUser.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
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
    const token = jwt.sign({ email: userData.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

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
  const verificationLink = `${process.env.BASE_URL}:${process.env.PORT}/verify-email?token=${token}`;
  // const verificationLink = `http://localhost:${process.env.PORT}/verify-email?token=${token}`;
  // const verificationLink = `${process.env.BASE_URL}/verify-email?token=${token}`;
  const unsubscribeLink = generateUnsubscribeLink(email);

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
    subject: "Verifica tu correo para recibir el libro gratuito",
    html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              color: #333;
              padding: 20px;
            }
            .container {
              background-color: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              max-width: 600px;
              margin: auto;
            }
            h1 {
              color: #4CAF50;
              text-align: center;
            }
            p {
              font-size: 16px;
              line-height: 1.5;
              margin-bottom: 20px;
            }
            .message-box {
              background-color: #f9f9f9;
              padding: 20px;
              border-radius: 10px;
              border: 1px solid #ddd;
              margin-bottom: 20px;
              text-align: center;
            }
            .button {
              display: inline-block;
              background-color: #4CAF50;
              color: white;
              padding: 10px 20px;
              font-size: 16px;
              text-decoration: none;
              border-radius: 5px;
              text-align: center;
              transition: background-color 0.3s;
              margin-top: 20px;
            }
            .button:hover {
              background-color: #45a049;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #888;
              margin-top: 20px;
            }
            .unsubscribe {
              font-size: 12px;
              color: #888;
              text-align: center;
              margin-top: 20px;
            }
            .unsubscribe a {
              color: #888;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>¡Bienvenido!</h1>
            
            <div class="message-box">
              <p>Por favor, haz clic en el siguiente enlace para verificar tu correo:</p>
              <p style="text-align: center;">
                <a href="${verificationLink}" class="button">Verificar mi correo</a>
              </p>
            </div>

            <p>Si no solicitaste este libro, por favor ignora este correo.</p>
            <p>¡Gracias por tu interés!</p>

            <div class="footer">
              <p>Saludos,<br>El equipo de soporte</p>
            </div>

            <div class="unsubscribe">
              <p><a href="${unsubscribeLink}">Darse de baja</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Correo de verificación enviado a:", email);
  } catch (error) {
    console.error("Error al enviar el correo:", error);
  }
}

async function sendBookEmail(user) {
  const unsubscribeLink = generateUnsubscribeLink(user.email);
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
        path: "./typescript-es.pdf", // Asegúrate de que la ruta sea correcta
      },
    ],
    html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              color: #333;
              padding: 20px;
            }
            .container {
              background-color: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              max-width: 600px;
              margin: auto;
            }
            h1 {
              color: #4CAF50;
              text-align: center;
            }
            p {
              font-size: 16px;
              line-height: 1.5;
              margin-bottom: 20px;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #888;
              margin-top: 20px;
            }
            .unsubscribe {
              font-size: 12px;
              color: #888;
              text-align: center;
              margin-top: 20px;
            }
            .unsubscribe a {
              color: #888;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>¡Tu libro gratuito está listo!</h1>
            <p>Gracias por verificar tu correo. Aquí tienes tu libro en PDF, ¡esperamos que lo disfrutes!</p>
            <p>Si tienes algún problema descargando el archivo, no dudes en contactarnos.</p>
            <p>¡Gracias por tu interés!</p>

            <div class="footer">
              <p>Saludos,<br>El equipo de soporte</p>
            </div>

            <div class="unsubscribe">
              <p><a href="${unsubscribeLink}">Darse de baja</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

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

  // const optionsLink = `http://localhost:${process.env.PORT}/update-name?token=${token}&action=maintain`;
  const optionsLink = `${process.env.BASE_URL}/update-name?token=${token}&action=maintain`;
  // const changeNameLink = `http://localhost:${process.env.PORT}/update-name?token=${token}&action=change&newName=${newUserData.name}`;
  const changeNameLink = `${process.env.BASE_URL}/update-name?token=${token}&action=change&newName=${newUserData.name}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: existingUser.email,
    subject: "Ya estás registrado, ¿quieres actualizar tu nombre?",
    html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              color: #333;
              padding: 20px;
            }
            .container {
              background-color: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              max-width: 600px;
              margin: auto;
            }
            h1 {
              color: #4CAF50;
              text-align: center;
            }
            p {
              font-size: 16px;
              line-height: 1.5;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              background-color: #4CAF50;
              color: white;
              padding: 10px 20px;
              font-size: 16px;
              text-decoration: none;
              border-radius: 5px;
              text-align: center;
              margin-bottom: 10px;
              transition: background-color 0.3s;
            }
            .button:hover {
              background-color: #45a049;
            }
            .info-box {
              background-color: #f9f9f9;
              border: 1px solid #ddd;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .info-box p {
              text-align: center;
              font-size: 16px;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #888;
              margin-top: 20px;
            }
            .unsubscribe {
              font-size: 12px;
              color: #888;
              text-align: center;
              margin-top: 20px;
            }
            .unsubscribe a {
              color: #888;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="info-box">
              <h1>¡Hola ${existingUser.name}!</h1>
              <p>Ya tenemos un registro con tu correo electrónico. Por favor, elige una de las siguientes opciones:</p>

              <p>
                <a href="${optionsLink}" class="button">Mantener mi nombre actual: ${existingUser.name}</a>
              </p>
              <p>
                <a href="${changeNameLink}" class="button">Cambiar mi nombre a: ${newUserData.name}</a>
              </p>

              <p>Si tienes alguna duda, no dudes en ponerte en contacto con nosotros.</p>
              <p>¡Gracias por tu interés!</p>
            </div>

            <div class="footer">
              <p>Saludos,<br>El equipo de soporte</p>
            </div>

            <div class="unsubscribe">
              <p><a href="${unsubscribeLink}">Darse de baja</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
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

function generateUnsubscribeLink(email) {
  // Generar el token de desuscripción
  const token = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "1h", // Expiración del token
  });

  // Crear el enlace real de desuscripción, con el dominio correcto (puede ser 'localhost' o el dominio en producción)
  const unsubscribeLink = `http://${process.env.DOMAIN || "localhost"}:${process.env.PORT}/unsubscribe?email=${email}&token=${token}`;

  return unsubscribeLink;
}

module.exports = {
  handleRegistrationRequest,
  sendBookEmail,
  updateNameService,
  generateUnsubscribeLink,
};
