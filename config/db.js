const mongoose = require("mongoose");

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conexión a MongoDB establecida");
  } catch (err) {
    console.error("Error al conectar a MongoDB:", err.message);
    process.exit(1);
  }
};

module.exports = connectToDatabase;


