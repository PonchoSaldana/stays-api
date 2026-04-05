const db = require('../models');
const Student = db.Student;
const Company = db.Company;
const xlsx = require('xlsx');
const { clean, getValue } = require('../utils/excelHelper');

// ─── Importar alumnos desde Excel ────────────────────────────────────────────
// El archivo llega como buffer en memoria (multer.memoryStorage), NO como ruta en disco.
exports.importStudents = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Por favor sube un archivo Excel' });

    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
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

        console.log(` Importación exitosa: ${students.length} alumnos procesados en la base de datos.`);
        res.json({ message: `${students.length} alumnos importados correctamente`, count: students.length });

    } catch (error) {
        console.error('Error en importStudents:', error);
        res.status(500).json({ message: 'Error al importar alumnos', error: error.message });
    }
};

// ─── Importar empresas desde Excel ───────────────────────────────────────────
// El archivo llega como buffer en memoria (multer.memoryStorage), NO como ruta en disco.
exports.importCompanies = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Por favor sube un archivo Excel' });

    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const processedRecords = [];
        let insertedCount = 0;
        let omittedCount = 0;

        for (const row of rows) {
            const numero_empresa = clean(getValue(row, ['No. de Empresa', 'numero_empresa', 'No de empresa']));
            const empresa = clean(getValue(row, ['EMPRESA', 'nombre_empresa', 'Razon Social']));

            if (!empresa || !numero_empresa || String(empresa).toLowerCase().includes('total') || String(empresa).toLowerCase().includes('asignado')) {
                omittedCount++;
                continue;
            }

            let telefono = clean(getValue(row, ['TELEFONO', 'telefono', 'Tel']));
            telefono = telefono ? telefono.replace(/[^\d+ ]/g, '').trim() : '';

            let correo = clean(getValue(row, ['CORREO', 'correo', 'Email']));
            if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
                correo = '';
            }

            const record = {
                numero_empresa,
                empresa,
                direccion: clean(getValue(row, ['DIRECCIÓN', 'direccion', 'Domicilio'])),
                estado: clean(getValue(row, ['ESTADO', 'estado'])),
                telefono,
                nombre_contacto: clean(getValue(row, ['Nom_Dirigidas las Cartas', 'Dirigidas', 'Nombre dirigido'])),
                cargo: clean(getValue(row, ['CARGO', 'cargo'])),
                giro_empresa: clean(getValue(row, ['GIRO', 'giro', 'SECTOR'])),
                correo,
                empresa_contactada: clean(getValue(row, ['EMPRESA CONTACTADA', 'contactada'])),
                apoyo_economico: clean(getValue(row, ['Apoyo Economico/Cantidad', 'apoyo', 'pago'])),
                director: clean(getValue(row, ['Nombre del Director', 'director'])),
                aprendientes_requeridos: clean(getValue(row, ['Numero de Aprendientes REQUERIDOS', 'requeridos'])),
                aprendientes_asignados: clean(getValue(row, ['Numero de Aprendientes ASIGNADOS', 'asignados'])),
                genero_preferente: clean(getValue(row, ['Hombre/Mujer', 'genero'])),
                nombre_proyecto: clean(getValue(row, ['Nombre del Proyecto', 'proyecto'])),
                area_colaboracion: clean(getValue(row, ['Área donde Colaborará', 'area', 'colaboracion'])),
                numero_memo: clean(getValue(row, ['N° DE MEMO', 'memo'])),
                fecha_registro: clean(getValue(row, ['FECHA', 'fecha'])),
                gestionada_por: clean(getValue(row, ['GESTIONADA POR', 'gestionada']))
            };

            const carreraExtraida = clean(getValue(row, ['Carrera', 'Carreras', 'Programa', 'Especialidad'])) || record.giro_empresa;

            processedRecords.push(record);

            const companyData = {
                ...record,
                name: record.empresa,
                address: record.direccion || '',
                phone: record.telefono || '',
                contact: record.nombre_contacto || '',
                managerRH: record.director || record.nombre_contacto || '',
                sector: record.giro_empresa || '',
                economicSupport: record.apoyo_economico || '',
                businessLine: record.giro_empresa || '',
                email: record.correo || '',
                available: true,
                maxStudents: parseInt(record.aprendientes_requeridos, 10) || 5,
                careerId: carreraExtraida
            };

            const existing = await Company.findOne({ where: { numero_empresa: record.numero_empresa } });
            if (existing) {
                await existing.update(companyData);
            } else {
                const byName = await Company.findOne({ where: { name: record.empresa } });
                if (byName) {
                    await byName.update(companyData);
                } else {
                    await Company.create(companyData);
                    insertedCount++;
                }
            }
        }

        res.json({
            message: 'Importación procesada con éxito',
            empresas_nuevas: insertedCount,
            empresas_omitidas_o_actualizadas: omittedCount,
            total_procesado: processedRecords.length,
            registros_procesados: processedRecords
        });

    } catch (error) {
        console.error('Error en importCompanies:', error);
        res.status(500).json({ message: 'Error al importar empresas', error: error.message });
    }
};

// ─── Limpiar tabla alumnos (solo root) ───────────────────────────────────────
exports.clearStudents = async (req, res) => {
    try {
        if (req.user.role !== 'ROOT') {
            return res.status(403).json({ message: 'Solo root puede borrar todos los alumnos' });
        }
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
        await Company.destroy({ where: {} });
        res.json({ message: 'Tabla de empresas limpiada correctamente' });
    } catch (err) {
        console.error('Error al limpiar empresas:', err);
        res.status(500).json({ message: 'Error al limpiar la tabla de empresas', error: err.message });
    }
};

// ─── Descargar todos los documentos en un ZIP ───────────────────────────────
exports.downloadAllDocumentsZip = async (req, res) => {
    const archiver = require('archiver');
    const path = require('path');
    const fs = require('fs');

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=Expedientes_Completos.zip');

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
        res.status(500).send({ error: err.message });
    });

    archive.pipe(res);

    const docsDir = path.join(__dirname, '../../uploads/documentos');

    if (fs.existsSync(docsDir)) {
        archive.directory(docsDir, 'Expedientes');
    } else {
        archive.append('No hay documentos subidos actualmente.', { name: 'leeme.txt' });
    }

    archive.finalize();
};

// ─── Limpiar TODOS los documentos (Archivos y BD) ──────────────────────────
exports.clearAllDocuments = async (req, res) => {
    const path = require('path');
    const fs = require('fs');
    try {
        if (req.user.role !== 'ROOT') {
            return res.status(403).json({ message: 'Solo root puede realizar la limpieza masiva' });
        }

        // 1. Borrar registros de la base de datos
        await db.Document.destroy({ where: {} });

        // 2. Borrar archivos físicos
        const docsDir = path.join(__dirname, '../../uploads/documentos');
        if (fs.existsSync(docsDir)) {
            fs.rmSync(docsDir, { recursive: true, force: true });
        }

        // 3. Recrear la carpeta raíz
        fs.mkdirSync(docsDir, { recursive: true });

        res.json({ message: 'Todos los documentos físicos y registros han sido eliminados correctamente' });
    } catch (err) {
        console.error('Error al limpiar documentos:', err);
        res.status(500).json({ message: 'Error al limpiar documentos', error: err.message });
    }
};
