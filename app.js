require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const connectToDatabase = require("./config/db");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';  // Se obtiene el valor del entorno, si no se define, por defecto será 'development'

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"], // Solo contenido del propio servidor
      scriptSrc: [
        "'self'",
        "https://code.jquery.com", // jQuery
        "https://cdn.jsdelivr.net", // Popper.js
        "https://stackpath.bootstrapcdn.com", // Bootstrap JS
      ],
      styleSrc: [
        "'self'",
        "https://stackpath.bootstrapcdn.com", // Bootstrap CSS
        "'unsafe-inline'", // Necesario para algunos estilos en línea que usa Bootstrap
      ],
      imgSrc: ["'self'", "data:"], // Imágenes desde el servidor o datos embebidos
      connectSrc: ["'self'"], // Solicitudes de red
      fontSrc: ["'self'", "https://stackpath.bootstrapcdn.com"], // Fuentes de Bootstrap
      objectSrc: ["'none'"], // Bloquear objetos como Flash o plugins
      formAction: ["'self'", "http://194.164.169.108:2500", "https://194.164.169.108:2500"], // Permite formularios desde HTTP y HTTPS
    },
  })
);


// Configurar EJS como motor de plantillas
app.set("view engine", "ejs");

// Conectar a MongoDB
connectToDatabase()
  .then(() => {
    console.log("Conexión a MongoDB exitosa");
  })
  .catch((err) => {
    console.error("Error al conectar a MongoDB:", err.message);
    process.exit(1); // Salir si no se puede conectar a la base de datos
  });

// Rutas
app.use("/", userRoutes);

// Ruta de prueba para salud del servidor
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is healthy" });
});

// Comportamiento según el entorno
if (NODE_ENV === 'production') {
  // Configuraciones específicas para producción (como habilitar caché, o usar un puerto específico)
  console.log("Aplicación en producción");
} else {
  // Configuraciones para desarrollo
  console.log("Aplicación en desarrollo");
}

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
