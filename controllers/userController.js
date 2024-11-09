const { handleRegistrationRequest, sendBookEmail } = require("../services/userService");
const User = require("../models/user");

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

async function updateName(req, res) {
  const { email, action, newName } = req.query;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (action === 'maintain') {
      await sendBookEmail(user);
      return res.json({ message: `Nombre actual: ${user.name}. Se mantiene el nombre y continúa con la solicitud del material.` });
    }

    if (action === 'change' && newName) {
      user.name = newName;
      await user.save();
      await sendBookEmail(user);

      return res.json({ message: `Nombre cambiado a "${newName}" exitosamente. El libro ha sido enviado a tu correo.` });
    }

    return res.status(400).json({ message: "Acción no válida o falta el nuevo nombre" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al procesar la solicitud" });
  }
}

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
