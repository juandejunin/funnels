const express = require("express");
const router = express.Router();
const { registerUser, updateName, verifyEmail } = require("../controllers/userController");

router.get("/form", (req, res) => {
    res.render("form", {
      errorMessage: "",  // Si quieres mostrar un mensaje de error, colócalo aquí
      name: "",          // Nombre pre-rellenado si es necesario
      email: ""          // Email pre-rellenado si es necesario
    });
  });
router.post("/request-book", registerUser);
router.get("/update-name", updateName);
router.get("/verify-email", verifyEmail);

module.exports = router;
