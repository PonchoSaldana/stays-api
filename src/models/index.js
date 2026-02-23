const { Sequelize } = require('sequelize');

// ─── Conexión MySQL ──────────────────────────────────────────────────────────
const sequelize = new Sequelize(
    process.env.DB_NAME || 'stays_uttecam',   // Nombre de la base de datos
    process.env.DB_USER || 'root',             // Usuario
    process.env.DB_PASS || '',                 // Contraseña
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
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
            ssl: process.env.DB_SSL === 'true' ? {
                minVersion: 'TLSv1.2',
                rejectUnauthorized: true
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
        console.log('✅ Base de datos MySQL sincronizada correctamente');
    })
    .catch((err) => {
        console.error('❌ Error al sincronizar MySQL:', err.message);
        console.error('   Verifica que MySQL esté corriendo y las credenciales en .env sean correctas');
    });

module.exports = db;
