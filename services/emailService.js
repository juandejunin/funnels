const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const emailTemplatesPath = path.join(__dirname, '..', 'emailTemplates'); // Ruta a la carpeta de templates

// Función para leer el archivo HTML y hacer el reemplazo de las variables dinámicas
function getEmailTemplate(templateName, replacements) {
  const filePath = path.join(emailTemplatesPath, `${templateName}.html`);
  let template = fs.readFileSync(filePath, 'utf-8');
  
  // Reemplazar las variables en el HTML con las correspondientes
  for (const [key, value] of Object.entries(replacements)) {
    template = template.replace(new RegExp(`\${${key}}`, 'g'), value);
  }
  
  return template;
}

// Función para enviar el correo de verificación
async function sendVerificationEmail(email, token) {
  const verificationLink = `${process.env.BASE_URL}/verify-email?token=${token}`;
  const unsubscribeLink = generateUnsubscribeLink(email);

  const htmlContent = getEmailTemplate('verificationEmail', { verificationLink, unsubscribeLink });

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verifica tu correo para recibir el libro gratuito',
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Correo de verificación enviado a:', email);
  } catch (error) {
    console.error('Error al enviar el correo:', error);
  }
}

// Función para enviar el correo con el libro
async function sendBookEmail(email, bookUrl) {
  const unsubscribeLink = generateUnsubscribeLink(email);

  const htmlContent = getEmailTemplate('bookEmail', { bookUrl, unsubscribeLink });

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '¡Aquí está tu libro gratuito!',
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Correo con el libro enviado a:', email);
  } catch (error) {
    console.error('Error al enviar el correo:', error);
  }
}

// Función general para enviar un correo con opciones
async function sendEmailWithOptions(email, subject, templateName, replacements) {
  const unsubscribeLink = generateUnsubscribeLink(email);

  // Reemplazar los valores en la plantilla
  replacements.unsubscribeLink = unsubscribeLink;

  const htmlContent = getEmailTemplate(templateName, replacements);

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Correo con asunto "${subject}" enviado a:`, email);
  } catch (error) {
    console.error('Error al enviar el correo:', error);
  }
}

// Función para generar un enlace de cancelación de suscripción (placeholder)
function generateUnsubscribeLink(email) {
  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
  return `${process.env.BASE_URL}/unsubscribe?token=${token}`;
}

// Exportar las funciones para que puedan ser usadas en otros módulos
module.exports = {
  sendVerificationEmail,
  sendBookEmail,
  sendEmailWithOptions,
  generateUnsubscribeLink,
};
