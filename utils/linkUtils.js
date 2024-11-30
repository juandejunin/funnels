function generateVerificationLink(token) {
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const baseURL = process.env.BASE_URL || "localhost";
    const port = process.env.NODE_ENV === "production" ? "" : `:${process.env.PORT || 80}`;
    return `${protocol}://${baseURL}${port}/verify-email?token=${token}`;
  }
  
  module.exports = { generateVerificationLink };
  