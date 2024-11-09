const express = require("express");
const router = express.Router();
const { registerUser, updateName, verifyEmail } = require("../controllers/userController");

router.post("/request-book", registerUser);
router.get("/update-name", updateName);
router.get("/verify-email", verifyEmail);

module.exports = router;
