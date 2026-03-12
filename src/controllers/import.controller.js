const db = require('../models');
const Student = db.Student;
const Company = db.Company;
const xlsx = require('xlsx');
const fs = require('fs');
const { clean, getValue } = require('../utils/excelHelper');

// ─── Importar alumnos desde Excel ────────────────────────────────────────────
exports.importStudents = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Por favor sube un archivo Excel' });

    const filePath = req.file.path;
    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const students = [];
        rows.forEach((row) => {
            const matricula = clean(getValue(row, ['Matrícula', 'Matricula', 'matricula']));
            const nombre = clean(getValue(row, ['Nombre', 'nombre', 'Nombre Completo']));

            const normMatricula = matricula ? matricula.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';
            const normNombre = nombre ? nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';

            // Ignorar filas que parezcan encabezados o estén vacías
            if (matricula && nombre && !normMatricula.includes('matricula') && !normNombre.includes('nombre')) {
                students.push({
                    matricula,
                    name: nombre,
                    careerName: clean(getValue(row, ['Carrera', 'Programa', 'Especialidad'])),
                    grade: clean(getValue(row, ['Grado', 'Cuatrimestre', 'Semestre'])),
                    group: clean(getValue(row, ['Grupo', 'Seccion'])),
                    shift: clean(getValue(row, ['Turno'])),
                    generation: clean(getValue(row, ['Generación', 'Generacion'])),
                    director: clean(getValue(row, ['Director']))
                });
            }
        });

        // Upsert selectivo — NO sobreescribe campos de autenticación ni estado
        for (const s of students) {
            const existing = await Student.findOne({
                where: db.sequelize.where(
                    db.sequelize.fn('LOWER', db.sequelize.col('matricula')),
                    s.matricula.toLowerCase()
                )
            });

            if (existing) {
                // Solo actualiza campos académicos
                await existing.update({
                    name: s.name,
                    careerName: s.careerName,
                    grade: s.grade,
                    group: s.group,
                    shift: s.shift,
                    generation: s.generation,
                    director: s.director
                    // NO tocar: password, email, isFirstLogin, emailVerified, status, companyId
                });
            } else {
                await Student.create(s);
            }
        }

        fs.unlinkSync(filePath);
        console.log(` Importación exitosa: ${students.length} alumnos procesados en la base de datos.`);
        res.json({ message: `${students.length} alumnos importados correctamente`, count: students.length });

    } catch (error) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ message: 'Error al importar alumnos', error: error.message });
    }
};

// ─── Importar empresas desde Excel ───────────────────────────────────────────
exports.importCompanies = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Por favor sube un archivo Excel' });

    const filePath = req.file.path;
    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const companies = [];
        rows.forEach((row) => {
            const name = clean(getValue(row, ['Empresa', 'Nombre', 'Razon Social', 'Institucion']));
            
            const normName = name ? name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';
            
            if (name && !normName.includes('empresa') && !normName.includes('nombre') && !normName.includes('razon social')) {
                companies.push({
                    name,
                    address: clean(getValue(row, ['Direccion', 'Domicilio', 'Ubicacion'])),
                    contact: clean(getValue(row, ['Contacto', 'Responsable', 'Encargado', 'Tutor'])),
                    businessLine: clean(getValue(row, ['Giro', 'Actividad', 'Sector'])),
                    email: clean(getValue(row, ['Correo', 'Email', 'E-mail'])),
                    phone: clean(getValue(row, ['Telefono', 'Celular', 'Movil', 'Tel'])),
                    maxStudents: parseInt(clean(getValue(row, ['Cupos', 'MaxAlumnos', 'Max', 'Capacidad'])) || '5') || 5
                });
            }
        });

        await Company.bulkCreate(companies, { ignoreDuplicates: true });

        fs.unlinkSync(filePath);
        console.log(` Catálogo actualizado: ${companies.length} empresas cargadas.`);
        res.json({ message: `${companies.length} empresas importadas correctamente`, count: companies.length });

    } catch (error) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ message: 'Error al importar empresas', error: error.message });
    }
};

// ─── Limpiar tabla alumnos (solo root) ───────────────────────────────────────
exports.clearStudents = async (req, res) => {
    try {
        if (req.user.role !== 'ROOT') {
            return res.status(403).json({ message: 'Solo root puede borrar todos los alumnos' });
        }
        // Eliminamos usando DELETE FROM para evitar problemas con TRUNCATE y FKs
        await Student.destroy({ where: {}, cascade: true });
        res.json({ message: 'Tabla de alumnos limpiada correctamente' });
    } catch (err) {
        console.error('Error al limpiar alumnos:', err);
        res.status(500).json({ message: 'Error al limpiar la tabla de alumnos', error: err.message });
    }
};

// ─── Limpiar tabla empresas (solo root) ──────────────────────────────────────
exports.clearCompanies = async (req, res) => {
    try {
        if (req.user.role !== 'ROOT') {
            return res.status(403).json({ message: 'Solo root puede borrar todas las empresas' });
        }
        // Eliminamos usando DELETE FROM
        await Company.destroy({ where: {} });
        res.json({ message: 'Tabla de empresas limpiada correctamente' });
    } catch (err) {
        console.error('Error al limpiar empresas:', err);
        res.status(500).json({ message: 'Error al limpiar la tabla de empresas', error: err.message });
    }
};
