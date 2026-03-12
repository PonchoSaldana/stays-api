require('dotenv').config();
const db = require('./src/models');

async function checkTable() {
    try {
        await db.sequelize.authenticate();
        console.log('Conexión exitosa a la base de datos.');
        
        const [results] = await db.sequelize.query("SHOW COLUMNS FROM companies");
        console.log('Columnas actuales en BD:');
        results.forEach(col => console.log(`- ${col.Field}`));
        
    } catch (error) {
        console.error('ERROR:', error.message);
    } finally {
        process.exit(0);
    }
}

checkTable();
