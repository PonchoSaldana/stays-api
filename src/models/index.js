const { Sequelize } = require('sequelize');

// configuración de la conexión a mysql usando las variables del archivo .env
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,     // cambiar a console.log para ver las sentencias sql en consola
        pool: {
            max: 10,        // máximo de conexiones simultáneas al pool
            min: 0,
            acquire: 30000, // tiempo máximo para obtener una conexión (ms)
            idle: 10000     // tiempo para liberar conexiones inactivas (ms)
        },
        define: {
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci'
        },
        dialectOptions: {
            // permite leer fechas como strings para evitar problemas de zona horaria
            dateStrings: true,
            typeCast: true,
            // habilita ssl si el host no es localhost (necesario en producción/nube)
            ssl: (process.env.DB_SSL === 'true' || (process.env.DB_HOST && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST)) || !process.env.DB_HOST) ? {
                minVersion: 'TLSv1.2',
                rejectUnauthorized: false // false para mayor compatibilidad con docker y nubes
            } : null
        }
    }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// registro de todos los modelos de la aplicación
db.Student = require('./Student')(sequelize);
db.Company = require('./Company')(sequelize);
db.Document = require('./Document')(sequelize);
db.Admin = require('./Admin')(sequelize);
db.Config = require('./Config')(sequelize);   // configuraciones globales persistentes

// ─── asociaciones entre modelos ──────────────────────────────────────────────

// un alumno pertenece a una empresa (puede ser null si aún no seleccionó)
db.Student.belongsTo(db.Company, { foreignKey: 'companyId', as: 'company' });
// una empresa puede tener muchos alumnos
db.Company.hasMany(db.Student, { foreignKey: 'companyId', as: 'students' });

// un alumno tiene muchos documentos asociados
db.Student.hasMany(db.Document, { foreignKey: 'studentMatricula', sourceKey: 'matricula', as: 'documents' });
// cada documento pertenece a un alumno
db.Document.belongsTo(db.Student, { foreignKey: 'studentMatricula', targetKey: 'matricula', as: 'student' });

// sincroniza los modelos con la base de datos al iniciar el servidor
// sequence: crea las tablas si no existen (sin borrar las existentes)
db.sequelize.sync()
    .then(() => {
        console.log(`✅ conectado a bd: ${process.env.DB_NAME} en ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    })
    .catch((err) => {
        console.error('❌ error de conexión bd:', err.message);
        console.error(`🔌 intentando conectar a: ${process.env.DB_HOST} en puerto ${process.env.DB_PORT}`);
    });

module.exports = db;
