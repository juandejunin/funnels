// require("dotenv").config();
// const express = require("express");
// const helmet = require("helmet");
// const fs = require("fs");
// const http = require("http");
// const https = require("https");
// const path = require("path");
// const connectToDatabase = require("./config/db");
// const userRoutes = require("./routes/userRoutes");

// const app = express();
// const PORT_HTTP = process.env.PORT_HTTP // Puerto para HTTP
// const PORT_HTTPS = process.env.PORT_HTTP // Puerto para HTTPS
// const NODE_ENV = process.env.NODE_ENV || "development"; // Entorno de ejecución

// // Solo intentar cargar los certificados si estamos en producción
// let sslOptions = {};

// if (NODE_ENV === "production") {
//   // Verificar que las variables de entorno estén definidas
//   if (!process.env.PRIVATE_KEY_FILE || !process.env.CERT_FILE) {
//     throw new Error(
//       "PRIVATE_KEY_FILE o CERT_FILE no están definidas en las variables de entorno"
//     );
//   }

//   // Leer archivos de certificado y clave privada
//   try {
//     sslOptions = {
//       key: fs.readFileSync(path.resolve(__dirname, 'certs', 'private_key.key')),
//       cert: fs.readFileSync(path.resolve(__dirname, 'certs', 'cert_file.cer')),
//     };
//   } catch (error) {
//     console.error("Error al cargar los certificados SSL:", error.message);
//     throw new Error("No se pudieron cargar los certificados SSL.");
//   }
// }

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.static("public"));
// // Configuración de seguridad con Helmet
// app.use(
//   helmet({
//     contentSecurityPolicy: false, // Desactiva CSP si es necesario configurarlo manualmente
//   })
// );
// // Configurar EJS como motor de plantillas
// app.set("view engine", "ejs");

// // Conectar a MongoDB
// connectToDatabase()
//   .then(() => {
//     console.log("Conexión a MongoDB exitosa");
//   })
//   .catch((err) => {
//     console.error("Error al conectar a MongoDB:", err.message);
//     process.exit(1); // Salir si no se puede conectar a la base de datos
//   });

// // Rutas
// app.use("/", userRoutes);

// // Ruta de prueba para salud del servidor
// app.get("/health", (req, res) => {
//   res.status(200).json({ status: "OK", message: "Server is healthy" });
// });

// // Redirigir tráfico HTTP a HTTPS solo si estamos en producción
// if (NODE_ENV === "production") {
//   http
//     .createServer((req, res) => {
//       res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
//       res.end();
//     })
//     .listen(PORT_HTTP, () => {
//       console.log(
//         `Servidor HTTP escuchando en el puerto ${PORT_HTTP} (redirigiendo a HTTPS)`
//       );
//     });

//   // Iniciar servidor HTTPS en producción
//   https.createServer(sslOptions, app).listen(PORT_HTTPS, () => {
//     console.log(`Servidor HTTPS escuchando en el puerto ${PORT_HTTPS}`);
//   });
// } else {
//   // Solo en local no usamos HTTPS, solo HTTP
//   app.listen(PORT_HTTP, () => {
//     console.log(
//       `Servidor HTTP en desarrollo escuchando en el puerto ${PORT_HTTP}`
//     );
//   });
// }

// module.exports = app;


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
const PORT_HTTPS = process.env.PORT_HTTPS || 3001; // Puerto para HTTPS
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
