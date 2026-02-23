const { Sequelize } = require('sequelize');

// ─── Conexión MySQL ──────────────────────────────────────────────────────────
const sequelize = new Sequelize(
    process.env.DB_NAME || 'stays_uttecam',
    process.env.DB_USER || '24zvhwLGFULVSSp.root',
    process.env.DB_PASS || 'Poncho2005',
    {
        host: process.env.DB_HOST || 'gateway01.us-west-2.prod.aws.tidbcloud.com',
        port: process.env.DB_PORT || 4000,
        dialect: 'mysql',
        logging: false,                        // Cambiar a console.log para debug SQL
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci'
        },
        dialectOptions: {
            // Permite leer fechas como strings (evita problemas con timezone)
            dateStrings: true,
            typeCast: true,
            ssl: (process.env.DB_SSL === 'true' || (process.env.DB_HOST && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST)) || !process.env.DB_HOST) ? {
                minVersion: 'TLSv1.2',
                rejectUnauthorized: false // Cambiado a false para mayor compatibilidad con entornos de contenedores (Docker)
            } : null
        }
    }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// ─── Registrar Modelos ───────────────────────────────────────────────────────
db.Student = require('./Student')(sequelize);
db.Company = require('./Company')(sequelize);
db.Document = require('./Document')(sequelize);
db.Admin = require('./Admin')(sequelize);

// ─── Asociaciones ────────────────────────────────────────────────────────────
// Alumno ↔ Empresa
db.Student.belongsTo(db.Company, { foreignKey: 'companyId', as: 'company' });
db.Company.hasMany(db.Student, { foreignKey: 'companyId', as: 'students' });

// Alumno ↔ Documentos
db.Student.hasMany(db.Document, { foreignKey: 'studentMatricula', sourceKey: 'matricula', as: 'documents' });
db.Document.belongsTo(db.Student, { foreignKey: 'studentMatricula', targetKey: 'matricula', as: 'student' });

// ─── Sincronizar BD ──────────────────────────────────────────────────────────
// alter:true → actualiza columnas sin borrar datos existentes
// IMPORTANTE: en producción usa migraciones en lugar de alter:true
db.sequelize.sync({ alter: true })
    .then(() => {
        console.log(`✅ Conectado a BD: ${process.env.DB_NAME} en ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    })
    .catch((err) => {
        console.error('❌ Error de conexión BD:', err.message);
        console.error(`🔌 Intentando conectar a: ${process.env.DB_HOST || 'localhost'} en puerto ${process.env.DB_PORT || 3306}`);
    });

module.exports = db;
