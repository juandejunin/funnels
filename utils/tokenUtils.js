const jwt = require("jsonwebtoken");

function generateVerificationToken(email) {
  return jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
}

function generateUnsubscribeLink(email) {
  const token = generateVerificationToken(email);
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const port = process.env.NODE_ENV === "production" ? "" : `:${process.env.PORT || 80}`;
  return `${protocol}://${process.env.BASE_URL}${port}/unsubscribe?email=${email}&token=${token}`;
}

module.exports = { generateVerificationToken, generateUnsubscribeLink };
