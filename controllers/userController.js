const {
  handleRegistrationRequest,
  sendBookEmail,
  updateNameService,
  generateUnsubscribeLink,
} = require("../services/userService");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const validator = require("validator");

async function registerUser(req, res) {
  const { name, email, acceptPrivacyPolicy } = req.body; // Obtenemos 'acceptPrivacyPolicy' del body

  // Validación de nombre, correo y si el checkbox de privacidad fue marcado
  if (
    !name ||
    !email ||
    !validator.isAlpha(name, "es-ES", { ignore: " " }) ||
    !validator.isEmail(email)
  ) {
    return res.status(400).render("form", {
      errorMessage: "Nombre o correo inválido. Por favor, intente de nuevo.",
      name,
      email,
    });
  }

  // Validación del consentimiento de la política de privacidad
  if (!acceptPrivacyPolicy) {
    return res.status(400).render("form", {
      errorMessage: "Debes aceptar la política de privacidad para continuar.",
      name,
      email,
    });
  }

  try {
    await handleRegistrationRequest({ name, email });
    console.log(email)
    res.redirect("/verify-email.html");
  } catch (error) {
    console.error(error);
    res.status(500).render("form", {
      errorMessage: "Ocurrió un error. Por favor, intente más tarde.",
      name,
      email,
    });
  }
}

const updateName = async (req, res) => {
  const { token, action, newName } = req.query;

  try {
    const result = await updateNameService({ token, action, newName });

    if (action === "maintain") {
      res.redirect("/keep-name-success.html"); // Redirige a mantener nombre
    } else if (action === "change") {
      res.redirect("/change-name-success.html"); // Redirige a cambiar nombre
    } else {
      throw new Error("Acción no válida.");
    }
  } catch (error) {
    res.status(400).redirect("/error.html"); // Redirige a la página de error
  }
};

async function verifyEmail(req, res) {
  const token = req.query.token;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const user = await User.findOne({ email, verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: "Token inválido o expirado" });
    }

    user.isConfirmed = true;
    user.verificationToken = null;
    await user.save();

    await sendBookEmail(user);
    res.redirect("/confirmation-success.html");
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Token inválido o expirado" });
  }
}

async function requestBook(req, res) {
  const { name, email } = req.body;

  // Validación de nombre y correo
  if (
    !name ||
    !email ||
    !validator.isAlpha(name, "es-ES", { ignore: " " }) ||
    !validator.isEmail(email)
  ) {
    return res.render("form", {
      errorMessage: "Invalid name or email. Please try again.",
      name,
      email,
    });
  }

  // Si la validación es exitosa, procesa la solicitud
  try {
    // Lógica para enviar el libro o realizar la acción deseada
    res.redirect("/success"); // Redirige a una página de éxito, por ejemplo
  } catch (error) {
    console.error(error);
    res.status(500).render("index", {
      errorMessage: "An error occurred. Please try again later.",
      name,
      email,
    });
  }
}

function getEmailFromToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verifica el token con la clave secreta
    const email = decoded.email; // Extrae el email del payload del token
    console.log("Email extraído del token:", email);
    return email; // Devuelve el email si fue descifrado correctamente
  } catch (error) {
    console.error("Error al descifrar el token:", error);
    return null; // Devuelve null en caso de error
  }
}

async function unsubscribeUser(req, res) {
  const { token } = req.query;  // Obtienes el token desde la query de la URL

  if (!token) {
    return res.status(400).send("Falta el token en la consulta.");
  }

  try {
    // Verifica y decodifica el token para obtener el email
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email; // Extrae el email del payload

    console.log("Email extraído del token:", email);

    // Busca y elimina el usuario por su correo electrónico
    const user = await User.findOneAndDelete({ email });

    if (user) {
      console.log("Usuario eliminado exitosamente:", email);
      return res.send("Usuario dado de baja exitosamente.");
    } else {
      console.log("Usuario no encontrado:", email);
      return res.status(404).send("Usuario no encontrado.");
    }

  } catch (error) {
    console.error("Error al procesar el token o al eliminar al usuario:", error);
    return res.status(400).send("Token inválido o ha expirado.");
  }
}


module.exports = {
  registerUser,
  updateName,
  verifyEmail,
  requestBook,
  unsubscribeUser,
};
