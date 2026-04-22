require('dotenv').config();
const db = require('./src/models');

async function testUpdate() {
    try {
        await db.sequelize.authenticate();
        console.log('Conectado a la DB AWS TiDB');

        const student = await db.Student.findOne({ where: { matricula: '99999999' } });
        if (!student) {
            console.log('El alumno 99999999 YA NO ESTÁ. Alguien o algo lo borró.');
            process.exit(1);
        }

        console.log('Alumno antes de actualizar:', student.email);

        await student.update({
            email: null,
            password: null,
            isFirstLogin: true,
            emailVerified: false,
            loginAttempts: 0,
            lockUntil: null
        });

        console.log('Actualización realizada mediante Sequelize. Verificando si sigue existiendo...');
        const studentAfter = await db.Student.findOne({ where: { matricula: '99999999' } });
        
        if (studentAfter) {
            console.log('Exito! El registro SIGUE VIVO en la base de datos.');
            console.log(studentAfter.toJSON());
        } else {
            console.log('Error critico: La actualización lo borró (no debería pasar).');
        }

        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
testUpdate();
