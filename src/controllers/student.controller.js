const db = require('../models');
const Student = db.Student;

exports.findAll = async (req, res) => {
    try {
        const students = await Student.findAll();
        res.send(students);
    } catch (err) {
        res.status(500).send({
            message: err.message || "Some error occurred while retrieving students."
        });
    }
};

exports.findByMatricula = async (req, res) => {
    try {
        const inputMatricula = req.params.matricula;
        console.log('Buscando matrícula:', inputMatricula);

        // Intentar búsqueda exacta primero (PK)
        let student = await Student.findByPk(inputMatricula);

        // Si no se encuentra, buscar de forma más flexible
        if (!student) {
            const allStudents = await Student.findAll();
            console.log(`Total estudiantes en BD: ${allStudents.length}`);

            // Normalizar y buscar
            const normalizedInput = String(inputMatricula).trim().toLowerCase();
            student = allStudents.find(s =>
                String(s.matricula).trim().toLowerCase() === normalizedInput
            );

            if (student) {
                console.log('Estudiante encontrado con búsqueda flexible:', student.matricula);
            } else {
                console.log('Estudiante NO encontrado. Primeras 5 matrículas en BD:');
                allStudents.slice(0, 5).forEach(s => console.log('  -', s.matricula));
            }
        }

        if (!student) {
            return res.status(404).send({
                message: "Student not found with matricula " + inputMatricula
            });
        }

        console.log(' Enviando datos:', student.name);
        res.send(student);
    } catch (err) {
        console.error(' Error en findByMatricula:', err);
        res.status(500).send({
            message: "Error retrieving student with matricula " + req.params.matricula
        });
    }
};
