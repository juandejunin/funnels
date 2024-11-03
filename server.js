// // server.js
// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const nodemailer = require('nodemailer');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Connect to MongoDB

// mongoose.connect(process.env.MONGODB_URI)
// .then(() => {
//   console.log('Conexión a MongoDB establecida');
// }).catch(err => {
//   console.error('Error al conectar a MongoDB:', err.message);
//   process.exit(1);
// });

// // Define a simple model for user emails
// const User = mongoose.model('User', new mongoose.Schema({
//   name: String,
//   email: String,
//   isConfirmed: { type: Boolean, default: false }
// }));

// // Route to handle form submissions
// app.post('/request-book', async (req, res) => {
//   const { name, email } = req.body;
//   if (!name || !email) {
//     return res.status(400).json({ message: 'Name and email are required' });
//   }

//   try {
//     // Save user to the database
//     const newUser = new User({ name, email });
//     await newUser.save();

//     // Send email with Nodemailer
//     const transporter = nodemailer.createTransport({
//       service: 'Gmail', // or another email service
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//       }
//     });

//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: 'Your Free PDF Book',
//       text: 'Thank you for requesting the book! Here is your PDF.',
//       attachments: [
//         {
//           filename: 'book.pdf',
//           path: './path/to/your/book.pdf'
//         }
//       ]
//     };

//     await transporter.sendMail(mailOptions);
//     res.status(200).json({ message: 'Email sent successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error sending email' });
//   }
// });

// // Start the server
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sirve los archivos estáticos desde la carpeta "public"
app.use(express.static('public'));

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('Conexión a MongoDB establecida');
}).catch(err => {
  console.error('Error al conectar a MongoDB:', err.message);
  process.exit(1);
});

// Modelo para los usuarios
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: String,
  isConfirmed: { type: Boolean, default: false }
}));

// Ruta para manejar las solicitudes del formulario
app.post('/request-book', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  try {
    // Guarda el usuario en la base de datos
    const newUser = new User({ name, email });
    await newUser.save();

    // Configura Nodemailer para enviar el correo
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // o cualquier otro servicio de email
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Free PDF Book',
      text: 'Thank you for requesting the book! Here is your PDF.',
      attachments: [
        {
          filename: 'book.pdf',
          path: './teoria.pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error sending email' });
  }
});

// Iniciar el servidor
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
