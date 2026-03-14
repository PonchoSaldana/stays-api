require('dotenv').config();
const db = require('./src/models');

async function checkDocs() {
    try {
        const docs = await db.Document.findAll({
            include: [{ model: db.Student, as: 'student' }],
            limit: 10,
            order: [['createdAt', 'DESC']]
        });
        console.log('--- Últimos 10 Documentos en BD ---');
        docs.forEach(d => {
            console.log(`Alumno: ${d.studentMatricula} (${d.student?.name}), Doc: ${d.documentName}, Path: ${d.filePath}, Stage: ${d.stage}`);
        });
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}
checkDocs();
