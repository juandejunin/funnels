const { handleRegistrationRequest, sendBookEmail, updateNameService } = require("../services/userService");
const User = require("../models/user");
const jwt = require('jsonwebtoken');


async function registerUser(req, res) {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: "El nombre y el correo son requeridos" });
  }

  try {
    await handleRegistrationRequest({ name, email });
    res.redirect("/confirmation-success.html");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al manejar la solicitud de registro" });
  }
}

const updateName = async (req, res) => {
  const { token, action, newName } = req.query; // Extracción del token y acción
  try {
    const result = await updateNameService({ token, action, newName });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
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

module.exports = { registerUser, updateName, verifyEmail };
