require('dotenv').config();

// ─── Validar variables de entorno críticas al arrancar ────────────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'DB_NAME', 'DB_USER', 'DB_HOST'];
const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length > 0) {
    console.error(`Variables de entorno faltantes: ${missing.join(', ')}`);
    console.error('   Revisa tu archivo .env antes de iniciar el servidor.');
    process.exit(1);
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// Render, AWS, Nginx y otros Cloud providers usan proxies. Confiar en todos los proxies de la cadena.
app.set('trust proxy', true);

// ─── CORS ─────────────────────────────────────────────────────────────────────
// En producción, cambia '*' al dominio real del frontend en FRONTEND_URL del .env
const allowedOrigins = process.env.FRONTEND_URL
    ? [
        process.env.FRONTEND_URL,
        'https://ponchosaldana.github.io',
        'https://www.gestiautecam.com',
        'https://gestiautecam.com',
        'https://www.gestiauttecam.com',
        'https://gestiauttecam.com',
        'https://125t.amplifyapp.com',
    ]
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(cors({
    origin: (origin, callback) => {
        // Permitir llamadas sin origin (Postman, curl) o si está en la lista blanca
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.up.railway.app') || origin.endsWith('.github.io') || origin.endsWith('.amplifyapp.com') || origin.endsWith('.gestiautecam.com') || origin.endsWith('.gestiauttecam.com')) {
            return callback(null, true);
        }
        console.warn(` CORS bloqueado para origin no reconocido: ${origin}`);
        callback(new Error(`CORS bloqueado para: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── Middleware (Cuerpo de las peticiones) ────────────────────────────────────
// Debe ir antes del Rate Limiting para que los limiters puedan leer req.body.matricula
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Límite general — 200 peticiones por 15 min por IP
// El generalLimiter queda desactivado para evitar bloqueos innecesarios en root/admin.
// Las rutas críticas tienen sus propios limiters abajo.

// Límite estricto solo para los endpoints de LOGIN:
// Límite de SEGURIDAD por IP para LOGIN (Protección contra DOS)
// El bloqueo real por intentos (7 fallos) lo hace el controlador directamente en la BD
// Este límite es alto (100) para no molestar a los humanos probando el sistema.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, 
    message: { message: 'Demasiados intentos fallidos desde esta red. Espera 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV !== 'production', // desactivado en dev
    validate: false,
    keyGenerator: (req) => (req.ip || 'unknown-ip').replace(/:/g, '_')
});



// Límite estricto para LOGIN (Alumnos y Admins)
app.use('/api/auth/login', loginLimiter);

// Límite para ENVÍO DE CÓDIGOS / RECUPERACIÓN (Previene spam de correo)
const mailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // 5 correos por hora por IP o matrícula
    message: { message: 'Has solicitado demasiados códigos. Intenta en una hora.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    keyGenerator: (req) => {
        const ip = (req.ip || 'unknown-ip').replace(/:/g, '_');
        return req.body?.matricula ? `mail_${req.body.matricula.toLowerCase()}` : `mail_${ip}`;
    }
});
app.use('/api/auth/send-code', mailLimiter);
app.use('/api/auth/forgot-password', mailLimiter);

// Límite para BÚSQUEDA / VERIFICACIÓN (Previene escaneo de matrículas)
const searchLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 100, // 100 intentos cada 5 min (más permisivo para tests)
    message: { message: 'Demasiadas consultas. Espera un momento.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: false
});
app.use('/api/auth/check-matricula', searchLimiter);
app.use('/api/auth/hint', searchLimiter);

// Límite para importaciones (evitar abuso de subida de archivos pesados)
const importLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 20, // max 20 importaciones por hora
    message: { message: 'Demasiadas importaciones. Intenta en 1 hora.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: false
});
app.use('/api/import', importLimiter);
app.use('/api/importar-empresas', importLimiter);

// Los body parsers fueron movidos arriba del Rate Limiting

// ─── Carpeta temporal para Excel (los Excel de importación se procesan localmente) ──
// Los documentos de alumnos ya van directo a S3 — esta carpeta solo es para imports.
const excelTempDir = path.join(__dirname, 'uploads', 'excel');
if (!fs.existsSync(excelTempDir)) fs.mkdirSync(excelTempDir, { recursive: true });

// ─── Inicializar base de datos ────────────────────────────────────────────────
require('./src/models');

// ─── Ruta raíz (health check) ─────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        message: 'API — Sistema de Estadias UT Tecamachalco',
        version: '2.2',
        status: 'ok',
        env: process.env.NODE_ENV || 'development',
        storage: process.env.S3_BUCKET_NAME ? `S3 (${process.env.S3_BUCKET_NAME})` : 'local',
        timestamp: new Date().toISOString()
    });
});

// ─── Health check para load balancers / Amplify ───────────────────────────────
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/students', require('./src/routes/students.routes'));
app.use('/api/companies', require('./src/routes/companies.routes'));
app.use('/api/import', require('./src/routes/import.routes'));
app.post('/api/importar-empresas', require('./src/utils/jwt').verifyAdmin, require('./src/middleware/upload').uploadExcel.single('file'), require('./src/controllers/import.controller').importCompanies);
app.use('/api/documents', require('./src/routes/documents.routes'));
app.use('/api/config', require('./src/routes/config.routes'));
app.use('/api/admins', require('./src/routes/admins.routes'));
app.use('/api/careers', require('./src/routes/careers.routes'));

// ─── Manejo de errores global ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
    // No exponer detalles de error en producción
    const isProduction = process.env.NODE_ENV === 'production';
    console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}:`, err.message);
    res.status(err.status || 500).json({
        message: err.message || 'Error interno del servidor',
        ...(isProduction ? {} : { stack: err.stack })
    });
});

app.listen(PORT, () => {
    console.log(`\n Servidor corriendo en http://localhost:${PORT}`);
    console.log(`CORS permitido para: ${allowedOrigins.join(', ')}`);
    console.log(`Uploads en: ${path.join(__dirname, 'uploads')}`);
});
