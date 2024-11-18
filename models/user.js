const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  isConfirmed: { type: Boolean, default: false },
  verificationToken: String,
  tokenExpiry: Date, // Almacena la fecha de expiración del token, opcional
});

module.exports = mongoose.model("User", userSchema);
