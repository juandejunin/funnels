require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const connectToDatabase = require("./config/db");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT_HTTP = process.env.PORT_HTTP || 3000; // Puerto para HTTP
const PORT_HTTPS = process.env.PORT_HTTPS || 443; // Puerto para HTTPS
const NODE_ENV = process.env.NODE_ENV || "development"; // Entorno de ejecución

// Configuración para SSL (solo en producción)
let sslOptions = {};

if (NODE_ENV === "production") {
  // Verificar certificados en producción
  if (!process.env.PRIVATE_KEY_FILE || !process.env.CERT_FILE) {
    throw new Error(
      "PRIVATE_KEY_FILE o CERT_FILE no están definidas en las variables de entorno"
    );
  }

  // Cargar certificados SSL
  try {
    sslOptions = {
      key: fs.readFileSync(process.env.PRIVATE_KEY_FILE),
      cert: fs.readFileSync(process.env.CERT_FILE),
    };
  } catch (error) {
    console.error("Error al cargar los certificados SSL:", error.message);
    throw new Error("No se pudieron cargar los certificados SSL.");
  }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  helmet({
    contentSecurityPolicy: false, // Ajustar según las necesidades de tu app
  })
);
app.set("view engine", "ejs");

// Conectar a la base de datos
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

// Ruta de salud del servidor
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is healthy" });
});

// Ruta para redirecciones seguras
app.get("/redirect", (req, res) => {
  const url = req.query.url;

  // Validar que la URL exista
  if (!url) {
    return res.status(400).json({ error: "URL es requerida" });
  }

  try {
    // Crear un objeto URL para analizar la URL proporcionada
    const parsedUrl = new URL(url);

    // Validar según el entorno
    const isDevelopment = NODE_ENV === "development";

    if (isDevelopment) {
      // En desarrollo: permitir localhost
      if (parsedUrl.origin === "http://localhost") {
        return res.redirect(url);
      } else {
        return res.status(403).json({ error: "Redirección no permitida en desarrollo" });
      }
    } else {
      // En producción: redirigir a HTTPS si la URL es http://tusistema.es
      if (parsedUrl.origin === "http://tusistema.es") {
        return res.redirect(`https://tusistema.es${parsedUrl.pathname}${parsedUrl.search}`);
      } else if (parsedUrl.origin === "https://tusistema.es") {
        return res.redirect(url);
      } else {
        return res.status(403).json({ error: "Redirección no permitida en producción" });
      }
    }
  } catch (error) {
    // Manejo de errores si la URL es inválida
    return res.status(400).json({ error: "URL inválida" });
  }
});

// Servidores HTTP y HTTPS
if (NODE_ENV === "production") {
  // Redirigir tráfico HTTP a HTTPS
  http
    .createServer((req, res) => {
      res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
      res.end();
    })
    .listen(PORT_HTTP, () => {
      console.log(
        `Servidor HTTP escuchando en el puerto ${PORT_HTTP} (redirigiendo a HTTPS)`
      );
    });

  // Servidor HTTPS
  https.createServer(sslOptions, app).listen(PORT_HTTPS, () => {
    console.log(`Servidor HTTPS escuchando en el puerto ${PORT_HTTPS}`);
  });
} else {
  // Servidor HTTP en desarrollo
  app.listen(PORT_HTTP, () => {
    console.log(
      `Servidor HTTP en desarrollo escuchando en el puerto ${PORT_HTTP}`
    );
  });
}

module.exports = app;
