// tests/databaseConnection.test.js

const mongoose = require('mongoose');
const User = require('../models/User');
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


  it('should create a new user', async () => {
    const user = new User({ name: 'Juan', email: 'juan@example.com' });
    const savedUser = await user.save();
    
    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe('Juan');
    expect(savedUser.email).toBe('juan@example.com');
  });

  it('should find a user by email', async () => {
    const user = new User({ name: 'Ana', email: 'ana@example.com' });
    await user.save();

    const foundUser = await User.findOne({ email: 'ana@example.com' });
    
    expect(foundUser).toBeDefined();
    expect(foundUser.name).toBe('Ana');
    expect(foundUser.email).toBe('ana@example.com');
  });

  it('should delete a user by email', async () => {
    const user = new User({ name: 'Carlos', email: 'carlos@example.com' });
    await user.save();

    await User.deleteOne({ email: 'carlos@example.com' });
    
    const deletedUser = await User.findOne({ email: 'carlos@example.com' });
    expect(deletedUser).toBeNull();
  });

//   it('should not allow duplicate email addresses', async () => {
//     const user1 = new User({ name: 'David', email: 'david@example.com' });
//     await user1.save();

//     const user2 = new User({ name: 'Daniel', email: 'david@example.com' });

//     let error;
//     try {
//       await user2.save();
//     } catch (err) {
//       error = err;
//     }

//     expect(error).toBeDefined();
//     expect(error.code).toBe(11000); // Error de duplicado en MongoDB
//   });

  afterAll(async () => {
    await mongoose.disconnect();
  });
});


