const request = require("supertest");
const mongoose = require("mongoose");
const nodemailerMock = require("nodemailer-mock");
const app = require("../server"); // Asegúrate de que la ruta sea correcta

// Configuración de pruebas (limpieza de la base de datos y mock de Nodemailer)
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
  // Limpiar conexiones y mocks después de las pruebas
  await mongoose.connection.close();
  nodemailerMock.mock.reset(); // Reiniciar el mock
});

// Prueba básica para comprobar la respuesta del servidor
describe("POST /request-book", () => {
  it("should return a 400 error if name or email is missing", async () => {
    // Faltando nombre
    let response = await request(app)
      .post("/request-book")
      .send({ email: "juan@example.com" });
    expect(response.status).toBe(400); // Verifica que el servidor devuelva un error 400
    expect(response.body.message).toBe("Name and email are required");

    // Faltando correo
    response = await request(app)
      .post("/request-book")
      .send({ name: "Juan" });
    expect(response.status).toBe(400); // Verifica que el servidor devuelva un error 400
    expect(response.body.message).toBe("Name and email are required");
  });

  it("should return a 302 and redirect when name and email are provided", async () => {
    const response = await request(app)
      .post("/request-book")
      .send({ name: "Juan", email: "juan@example.com" });

    expect(response.status).toBe(302); // Verifica que se haga una redirección
  });
});
