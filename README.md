# Sistema de Gestión de Estadías — UT Tecamachalco

API REST para la plataforma de gestión de estadías profesionales universitarias.

## Stack

- **Runtime:** Node.js 20 + Express
- **Base de Datos:** MySQL / TiDB Cloud (Sequelize ORM)
- **Almacenamiento:** Amazon S3 (`gestia-docs-uttecam`)
- **Autenticación:** JWT + bcrypt
- **Email:** Resend API

## Ramas

| Rama | Descripción |
|------|-------------|
| `main` | Desarrollo local (almacenamiento local) |
| `prod` | Producción en AWS EC2 + S3 |

## Instalación local

```bash
npm install
cp .env.example .env    # llenar con tus valores
npm start
```

## Despliegue en EC2

```bash
# En el servidor EC2 (Ubuntu 24.04)
git clone https://github.com/PonchoSaldana/stays-api.git
cd stays-api
git checkout prod
npm install --omit=dev
nano .env               # llenar con variables de producción

pm2 start ecosystem.config.js --env production
pm2 save && pm2 startup
```

## Variables de entorno necesarias

Ver `.env.example` para la lista completa.

Las variables críticas en producción son:
- `JWT_SECRET` — secreto para firmar tokens JWT
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — conexión a base de datos
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME` — acceso a S3
- `FRONTEND_URL` — dominio del frontend (para CORS)
- `ROOT_USERNAME`, `ROOT_PASSWORD` — credenciales del administrador raíz

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/auth/login` | Login alumnos/admins |
| GET | `/api/students` | Listar alumnos |
| POST | `/api/documents/upload` | Subir documento a S3 |
| GET | `/api/documents/:id/download` | URL prefirmada S3 |
| GET | `/api/careers` | Listar carreras |
| GET | `/api/companies` | Listar empresas |
