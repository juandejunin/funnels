const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  isConfirmed: { type: Boolean, default: false },
  verificationToken: String,
});

module.exports = mongoose.model("User", userSchema);
