// tests/databaseConnection.test.js

const mongoose = require('mongoose');
require('dotenv').config();

describe('Database Connection', () => {
  beforeAll(async () => {
    // Usamos `mongoose.connect` para intentar conectar a la base de datos
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    } catch (error) {
      console.error('Error al conectar a MongoDB:', error.message);
    }
  });

  it('should connect to MongoDB successfully', () => {
    // Verifica si el estado de la conexión es "connected"
    expect(mongoose.connection.readyState).toBe(1); // 1 significa conectado
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });
});
