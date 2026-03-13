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

        const processedRecords = [];
        let insertedCount = 0;
        let omittedCount = 0;

        // Eliminar fila de encabezado si llegara a tener nombre de columnas como valores
        for (const row of rows) {
            const numero_empresa = clean(getValue(row, ['No. de Empresa', 'numero_empresa', 'No de empresa']));
            const empresa = clean(getValue(row, ['EMPRESA', 'nombre_empresa', 'Razon Social'])); // No buscar "Nombre" para evitar nombre de alumno
            
            // Requisito 6 y Regla 3: Validar que el campo empresa y numero_empresa existan y no estén vacíos.
            // Regla 2: Ignorar resúmenes asumiendo que un "resumen" no tiene número de empresa o nombre válido.
            if (!empresa || !numero_empresa || String(empresa).toLowerCase().includes('total') || String(empresa).toLowerCase().includes('asignado')) {
                omittedCount++;
                continue;
            }

            // Regla 4: Validaciones y limpieza
            let telefono = clean(getValue(row, ['TELEFONO', 'telefono', 'Tel']));
            // limpiar para guardar solo números o formato de teléfono básico
            telefono = telefono ? telefono.replace(/[^\d+ ]/g, '').trim() : '';

            let correo = clean(getValue(row, ['CORREO', 'correo', 'Email']));
            // Validar si es correo correcto, si no lo vaciamos
            if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
                correo = '';
            }

            // Mapeo estricto según instrucciones:
            const record = {
                numero_empresa: numero_empresa,
                empresa: empresa,
                direccion: clean(getValue(row, ['DIRECCIÓN', 'direccion', 'Domicilio'])),
                estado: clean(getValue(row, ['ESTADO', 'estado'])),
                telefono: telefono,
                nombre_contacto: clean(getValue(row, ['Nom_Dirigidas las Cartas', 'Dirigidas', 'Nombre dirigido'])),
                cargo: clean(getValue(row, ['CARGO', 'cargo'])),
                giro_empresa: clean(getValue(row, ['GIRO', 'giro', 'SECTOR'])),
                correo: correo,
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

            // "vuelve a como reconocia por carreras el archivo": conservamos la detección de carrera silenciosamente 
            // de las columnas base para que el frontend siga filtrando y dibujando logos aunque no esté en la tabla estricta
            const carreraExtraida = clean(getValue(row, ['Carrera', 'Carreras', 'Programa', 'Especialidad'])) || record.giro_empresa;

            processedRecords.push(record);

            // Preparando los datos para la DB fusionando los alias que usa la aplicación en Producción (retrocompatibilidad)
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
                careerId: carreraExtraida // requerido por react
            };

            // Upsert / Inserción
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

        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        // Requisito 7: Devolver un arreglo JSON limpio con los registros procesados antes de guardarlos 
        // (Los devolveremos en la respuesta para que el usuario pueda validarlos directamente)
        res.json({
            message: 'Importación procesada con éxito',
            empresas_nuevas: insertedCount,
            empresas_omitidas_o_actualizadas: omittedCount,
            total_procesado: processedRecords.length,
            registros_procesados: processedRecords // Devolver el arreglo limpio
        });

    } catch (error) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
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
