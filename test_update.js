require('dotenv').config();
const db = require('./src/models');
const bcrypt = require('bcryptjs');

async function testDeleteEndpoint() {
    try {
        await db.sequelize.authenticate();
        console.log('✅ Conectado a la BD AWS');

        // 1. Crear alumno de prueba
        const existing = await db.Student.findOne({ where: { matricula: '99999999' } });
        if (existing) await existing.destroy(); // limpiamos si ya existía

        const hashed = await bcrypt.hash('test123', 10);
        await db.Student.create({
            matricula: '99999999',
            name: 'ALUMNO PRUEBA DELETE',
            careerName: 'DESARROLLO DE SOFTWARE MULTIPLATAFORMA',
            email: 'prueba.delete@gestiauttecam.com',
            password: hashed,
            isFirstLogin: false,
            emailVerified: true,
            status: 'Pendiente'
        });
        console.log('✅ Alumno de prueba creado con email: prueba.delete@gestiauttecam.com');

        // 2. Simular exactamente lo que hace el endpoint deleteStudent
        const student = await db.Student.findOne({
            where: db.sequelize.where(
                db.sequelize.fn('LOWER', db.sequelize.col('matricula')),
                '99999999'
            )
        });

        await student.update({
            email: null,
            password: null,
            isFirstLogin: true,
            emailVerified: false,
            loginAttempts: 0,
            lockUntil: null
        });
        console.log('✅ Se ejecutó el "resetear cuenta" (igual que el botón del dashboard)');

        // 3. Verificar que el registro SIGUE en la BD
        const afterDelete = await db.Student.findOne({ where: { matricula: '99999999' } });

        if (afterDelete) {
            console.log('\n✅ PRUEBA EXITOSA — El alumno SIGUE en la base de datos:');
            console.log(`   Matrícula: ${afterDelete.matricula}`);
            console.log(`   Nombre: ${afterDelete.name}`);
            console.log(`   Email: ${afterDelete.email}`);         // null
            console.log(`   Password: ${afterDelete.password}`);   // null
            console.log(`   isFirstLogin: ${afterDelete.isFirstLogin}`); // true
        } else {
            console.log('\n❌ ERROR — El alumno fue BORRADO de la BD (esto no debería pasar)');
        }

        process.exit(0);
    } catch(err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

testDeleteEndpoint();
