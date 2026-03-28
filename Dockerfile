FROM node:20-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias primero (mejor caché de Docker)
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm install --omit=dev

# Copiar el código fuente
COPY . .

# Crear carpeta temporal para Excel de importación
# (los documentos de alumnos van a S3, no al filesystem)
RUN mkdir -p uploads/excel logs

# Exponer puerto
EXPOSE 3001

# Variables de entorno base
ENV NODE_ENV=production
ENV PORT=3001

# Healthcheck para ECS/EC2 load balancers
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Arrancar con node directamente (PM2 se usa en EC2, no en Docker)
CMD ["node", "server.js"]
