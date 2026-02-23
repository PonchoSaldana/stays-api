const path = require('path');
const fs = require('fs');
const db = require('../models');
const { sendReviewNotification } = require('../utils/mailer');

const Document = db.Document;
const Student = db.Student;

// ─── Subir un documento ──────────────────────────────────────────────────────
exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se adjuntó ningún archivo' });
        }

        const { matricula, stage, documentName } = req.body;
        if (!matricula || !stage || !documentName) {
            return res.status(400).json({ message: 'Faltan campos: matricula, stage, documentName' });
        }

        const student = await Student.findByPk(matricula);
        if (!student) return res.status(404).json({ message: 'Estudiante no encontrado' });

        const relativePath = path.join('students', matricula, stage, req.file.filename)
            .replace(/\\/g, '/');

        const existing = await Document.findOne({
            where: { studentMatricula: matricula, stage, documentName }
        });

        let doc;
        if (existing) {
            // Borrar archivo anterior del disco
            const oldFilePath = path.join(__dirname, '../../uploads', existing.filePath);
            if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);

            await existing.update({
                filename: req.file.filename,
                filePath: relativePath,
                mimeType: req.file.mimetype,
                fileSize: req.file.size,
                status: 'Pendiente',
                reviewNote: null
            });
            doc = existing;
        } else {
            doc = await Document.create({
                studentMatricula: matricula,
                stage,
                documentName,
                filename: req.file.filename,
                filePath: relativePath,
                mimeType: req.file.mimetype,
                fileSize: req.file.size
            });
        }

        res.json({ message: 'Documento subido correctamente', document: doc });

    } catch (err) {
        res.status(500).json({ message: 'Error al subir documento', error: err.message });
    }
};

// ─── Obtener documentos de un alumno ────────────────────────────────────────
exports.getByStudent = async (req, res) => {
    try {
        const { matricula } = req.params;
        const { stage } = req.query;

        const where = { studentMatricula: matricula };
        if (stage) where.stage = stage;

        const docs = await Document.findAll({
            where,
            order: [['stage', 'ASC'], ['documentName', 'ASC']]
        });
        res.json(docs);

    } catch (err) {
        res.status(500).json({ message: 'Error al obtener documentos', error: err.message });
    }
};

// ─── El admin revisa un documento (aprueba o rechaza) ───────────────────────
exports.reviewDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reviewNote } = req.body;

        if (!['Aprobado', 'Rechazado'].includes(status)) {
            return res.status(400).json({ message: 'Status debe ser "Aprobado" o "Rechazado"' });
        }

        const doc = await Document.findByPk(id, {
            include: [{ model: Student, as: 'student', attributes: ['name', 'email', 'matricula'] }]
        });
        if (!doc) return res.status(404).json({ message: 'Documento no encontrado' });

        await doc.update({ status, reviewNote: reviewNote || null });

        // Notificar al alumno por correo si tiene email registrado
        const student = doc.student;
        if (student && student.email) {
            try {
                await sendReviewNotification(
                    student.email,
                    student.name,
                    doc.documentName,
                    status,
                    reviewNote || null
                );
            } catch (mailErr) {
                // No fallar la petición si el correo falla
                console.warn('⚠️ No se pudo enviar notificación de revisión:', mailErr.message);
            }
        }

        res.json({ message: `Documento ${status.toLowerCase()} correctamente`, document: doc });

    } catch (err) {
        res.status(500).json({ message: 'Error al revisar documento', error: err.message });
    }
};

// ─── Descargar / ver un documento ───────────────────────────────────────────
exports.downloadDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Document.findByPk(id);
        if (!doc) return res.status(404).json({ message: 'Documento no encontrado' });

        const fullPath = path.join(__dirname, '../../uploads', doc.filePath);
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ message: 'Archivo físico no encontrado' });
        }

        res.download(fullPath, doc.filename);

    } catch (err) {
        res.status(500).json({ message: 'Error al descargar documento', error: err.message });
    }
};
