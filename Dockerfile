# Usar una imagen base de Node.js
FROM node:18

# Crear y establecer el directorio de trabajo dentro del contenedor
WORKDIR /usr/app

# Copiar los archivos package.json y package-lock.json (si existe) al contenedor
COPY package*.json ./

# Instalar las dependencias de la aplicación
RUN npm install

# Copiar todo el código fuente al contenedor
COPY . .

# Exponer el puerto en el que la aplicación se ejecutará (por ejemplo, 3000)
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
