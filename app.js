require("dotenv").config();
const express = require("express");
const connectToDatabase = require("./config/db");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
const helmet = require('helmet');
app.use(helmet());

// Configurar EJS como motor de plantillas
app.set('view engine', 'ejs');
// Conectar a MongoDB
connectToDatabase();

// Rutas
app.use("/", userRoutes);


// Iniciar el servidor


// Definir tus rutas y middleware aquí
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
