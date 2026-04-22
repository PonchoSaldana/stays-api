require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./src/models');

async function insertTestStudent() {
    try {
        await db.sequelize.authenticate();
        console.log('Conexión con AWS Database exitosa.');

        const hashed = await bcrypt.hash('123456', 10);
        
        // Verificamos si ya existe para asegurar de que no arroje error
        const existing = await db.Student.findOne({ where: { matricula: '99999999' } });
        if (existing) {
            await existing.destroy();
        }

        const testStudent = await db.Student.create({
            matricula: '99999999',
            name: 'ALUMNO DE PRUEBAs',
            careerName: 'DESARROLLO DE SOFTWARE MULTIPLATAFORMA',
            status: 'Pendiente',
            email: 'prueba@gestiauttecam.com',
            password: hashed,
            isFirstLogin: false,
            emailVerified: true
        });

        console.log('Alumno de prueba insertado exitosamente:');
        console.log(testStudent.toJSON());
        process.exit(0);
    } catch(err) {
        console.error('Error insertando alumno API', err);
        process.exit(1);
    }
}
insertTestStudent();
