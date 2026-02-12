const db = require('../models');
const Student = db.Student;
const Company = db.Company;
const xlsx = require('xlsx');
const fs = require('fs');
const { clean, getValue } = require('../utils/excelHelper');

exports.importStudents = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: "Please upload an Excel file!" });
        }

        const path = req.file.path;
        const workbook = xlsx.readFile(path);
        const sheetName = workbook.SheetNames[0];
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log(`📥 Procesando ${rows.length} filas del Excel`);
        const students = [];

        rows.forEach((row, index) => {
            const matricula = clean(getValue(row, ['Matrícula', 'Matricula', 'matricula']));
            const nombre = clean(getValue(row, ['Nombre', 'nombre', 'Nombre Completo']));

            if (matricula && nombre && matricula.toLowerCase() !== 'matrícula') {
                const student = {
                    matricula: matricula,
                    name: nombre,
                    careerName: clean(getValue(row, ['Carrera', 'carrera', 'Carrera (Nombre)'])),
                    grade: clean(getValue(row, ['Grado', 'grado', 'Cuatrimestre', 'Semestre'])),
                    group: clean(getValue(row, ['Grupo', 'grupo', 'Seccion'])),
                    shift: clean(getValue(row, ['Turno', 'turno'])),
                    generation: clean(getValue(row, ['Generación', 'Generacion', 'generacion'])),
                    director: clean(getValue(row, ['NOMBRE DEL DIRECTOR', 'Nombre del Director', 'Director']))
                };
                students.push(student);

                // Log primeras 3 matrículas para debug
                if (index < 3) {
                    console.log(`  ✓ Fila ${index + 1}: Matrícula="${student.matricula}" Nombre="${student.name}"`);
                }
            }
        });

        console.log(`💾 Guardando ${students.length} estudiantes en la BD...`);

        // Upsert (Insert or Update)
        for (const s of students) {
            await Student.upsert(s);
        }

        console.log(`✅ ${students.length} estudiantes guardados exitosamente`);

        fs.unlinkSync(path); // Clean up uploaded file

        res.status(200).send({
            message: "Uploaded the file successfully: " + req.file.originalname,
            count: students.length
        });
    } catch (error) {
        console.error('❌ Error en importStudents:', error);
        res.status(500).send({
            message: "Could not upload the file: " + req.file?.originalname,
            error: error.message
        });
    }
};

exports.importCompanies = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: "Please upload an Excel file!" });
        }

        const path = req.file.path;
        const workbook = xlsx.readFile(path);
        const sheetName = workbook.SheetNames[0];
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const companies = [];

        rows.forEach((row) => {
            const name = clean(getValue(row, ['Empresa', 'empresa', 'Nombre', 'nombre']));

            if (name) {
                const company = {
                    name: name,
                    address: clean(getValue(row, ['Direccion', 'direccion'])),
                    contact: clean(getValue(row, ['Contacto', 'contacto', 'Responsable'])),
                    businessLine: clean(getValue(row, ['Giro', 'giro']))
                };
                companies.push(company);
            }
        });

        // Upsert not directly supported easily for auto-increment ID without unique key constraint on name
        // For simplicity, we just create for now, or check existence.
        // Assuming unique names for now or just bulk creating.
        await Company.bulkCreate(companies);

        fs.unlinkSync(path);

        res.status(200).send({
            message: "Uploaded the file successfully: " + req.file.originalname,
            count: companies.length
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: "Could not upload the file: " + req.file.originalname,
            error: error.message
        });
    }
};

exports.clearStudents = async (req, res) => {
    try {
        await Student.destroy({ where: {}, truncate: true });
        res.send({ message: "All students deleted successfully!" });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

exports.clearCompanies = async (req, res) => {
    try {
        await Company.destroy({ where: {}, truncate: true });
        res.send({ message: "All companies deleted successfully!" });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};
