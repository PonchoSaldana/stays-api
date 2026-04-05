const db = require('../models');
const { s3Client, S3_BUCKET } = require('../middleware/upload');
const { GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { sendReviewNotification } = require('../utils/mailer');

const Document = db.Document;
const Student = db.Student;

// ─── Subir un documento ───────────────────────────────────────────────────────
// req.file.key      = key asignada en S3 por multer-s3
// req.file.location = URL pública en S3 (no usar; los docs son privados)
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

        // La key S3 la asigna multer-s3 automáticamente en req.file.key
        const s3Key = req.file.key;

        const existing = await Document.findOne({
            where: { studentMatricula: matricula, stage, documentName }
        });

        let doc;
        if (existing) {
            // Eliminar el archivo anterior de S3 antes de reemplazarlo
            if (existing.filePath) {
                try {
                    await s3Client.send(new DeleteObjectCommand({
                        Bucket: S3_BUCKET,
                        Key: existing.filePath
                    }));
                } catch (s3Err) {
                    console.warn('No se pudo borrar archivo anterior de S3:', s3Err.message);
                }
            }

            await existing.update({
                filename: req.file.originalname,
                filePath: s3Key,           // guardamos la KEY de S3 (no la URL)
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
                filename: req.file.originalname,
                filePath: s3Key,           // guardamos la KEY de S3 (no la URL)
                mimeType: req.file.mimetype,
                fileSize: req.file.size
            });
        }

        res.json({ message: 'Documento subido correctamente', document: doc });

    } catch (err) {
        res.status(500).json({ message: 'Error al subir documento', error: err.message });
    }
};

// ─── Obtener documentos de un alumno ─────────────────────────────────────────
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

// ─── El admin revisa un documento (aprueba o rechaza) ─────────────────────────
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

        const student = doc.student;
        if (student?.email) {
            try {
                await sendReviewNotification(
                    student.email, student.name,
                    doc.documentName, status, reviewNote || null
                );
            } catch (mailErr) {
                console.warn('No se pudo enviar notificación de revisión:', mailErr.message);
            }
        }

        res.json({ message: `Documento ${status.toLowerCase()} correctamente`, document: doc });

    } catch (err) {
        res.status(500).json({ message: 'Error al revisar documento', error: err.message });
    }
};

// ─── Descargar / ver un documento ────────────────────────────────────────────
// Genera una URL prefirmada de S3 que expira en 15 minutos.
// El archivo NO pasa por el servidor; el cliente descarga directo desde S3.
exports.downloadDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Document.findByPk(id);
        if (!doc) return res.status(404).json({ message: 'Documento no encontrado' });

        const command = new GetObjectCommand({
            Bucket: S3_BUCKET,
            Key: doc.filePath,                      // key S3 guardada en BD
            ResponseContentDisposition: `attachment; filename="${doc.filename}"`
        });

        // URL temporal segura (expira en 15 minutos)
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

        // Redirigir al cliente directo a S3
        res.redirect(signedUrl);

    } catch (err) {
        res.status(500).json({ message: 'Error al generar link de descarga', error: err.message });
    }
};
