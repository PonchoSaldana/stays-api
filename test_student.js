require('dotenv').config();
const db = require('./src/models');

async function restoreStudent() {
    try {
        await db.sequelize.authenticate();
        
        const existing = await db.Student.findOne({ where: { matricula: '24325027' } });
        if (existing) {
            console.log('El alumno ya existía.');
            process.exit(0);
        }

        const testStudent = await db.Student.create({
            matricula: '24325027',
            name: 'SALDAÑA CAMACHO ALFONSO', // Usamos el formato que tenía en la tabla original
            careerName: 'DESARROLLO DE SOFTWARE MULTIPLATAFORMA',
            status: 'Pendiente',
            email: null,
            password: null,
            isFirstLogin: true,
            emailVerified: false
        });

        console.log('Alumno restaurado exitosamente:');
        console.log(testStudent.toJSON());
        process.exit(0);
    } catch(err) {
        console.error('Error restaurando', err);
        process.exit(1);
    }
}
restoreStudent();
