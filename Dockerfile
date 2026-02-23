# Usar una imagen base de Node.js ligera
FROM node:18-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm install --omit=dev

# Copiar el resto del código de la aplicación
COPY . .

# Asegurar que las carpetas de uploads existan (opcional ya que server.js las crea)
RUN mkdir -p uploads/excel uploads/students

# Exponer el puerto que usa la app
EXPOSE 3001

# Definir variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3001

# Comando para arrancar la aplicación
CMD ["node", "server.js"]
