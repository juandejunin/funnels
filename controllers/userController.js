const {
  handleRegistrationRequest,
  sendBookEmail,
  updateNameService,
} = require("../services/userService");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const validator = require("validator");

async function registerUser(req, res) {
  const { name, email } = req.body;

  // Validación de nombre y correo
  if (!name || !email || !validator.isAlpha(name, 'es-ES', { ignore: " " }) || !validator.isEmail(email)) {
    // Renderizamos 'index.ejs' con el mensaje de error y los datos ingresados
    return res.status(400).render("form", {
      errorMessage: "Invalid name or email. Please try again.",
      name,
      email
    });
  }

  try {
    await handleRegistrationRequest({ name, email });
    res.redirect("/verify-email.html");
  } catch (error) {
    console.error(error);
    res.status(500).render("index", {
      errorMessage: "An error occurred. Please try again later.",
      name,
      email
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
  if (!name || !email || !validator.isAlpha(name, 'es-ES', { ignore: " " }) || !validator.isEmail(email)) {
    return res.render("index", {
      errorMessage: "Invalid name or email. Please try again.",
      name,
      email
    });
  }

  // Si la validación es exitosa, procesa la solicitud
  try {
    // Lógica para enviar el libro o realizar la acción deseada
    res.redirect("/success");  // Redirige a una página de éxito, por ejemplo
  } catch (error) {
    console.error(error);
    res.status(500).render("index", {
      errorMessage: "An error occurred. Please try again later.",
      name,
      email
    });
  }
}

module.exports = { registerUser, updateName, verifyEmail, requestBook };
