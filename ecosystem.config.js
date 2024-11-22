module.exports = {
    apps: [
      {
        name: "my-app", 
        script: "./app.js", 
        watch: true, // Habilita la opción de watch
        env: {
          NODE_ENV: "development", 
          PORT_HTTP: 3000,
          PORT_HTTPS: 3001,
        },
        env_production: {
          NODE_ENV: "production",
          PORT_HTTP: 80, 
          PORT_HTTPS: 443,
        },
      },
    ],
  };
  