const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { S3Client } = require('@aws-sdk/client-s3');

/**
 * Multer configurado para subida de archivos a Amazon S3.
 *
 * Estructura de keys en S3:
 *   documentos/{carrera}/{nombre_matricula}/{stage}/{timestamp_archivo}
 *   excel/import_{timestamp}_{nombre_original}
 */

// ── Cliente S3 ───────────────────────────────────────────────────────────────
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const BUCKET = process.env.S3_BUCKET_NAME;

// ── Filtros de archivo ────────────────────────────────────────────────────────
const docFilter = (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten PDF, Word e imágenes (JPG, PNG)'));
    }
};

const excelFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls'].includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
    }
};

// ── Storage para documentos de alumnos → S3 ──────────────────────────────────
// Key en S3: documentos/{carrera}/{nombre_matricula}/{stage}/{timestamp_archivo}
const studentS3Storage = multerS3({
    s3,
    bucket: BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: async (req, file, cb) => {
        try {
            const { matricula, stage } = req.body;
            if (!matricula || !stage) {
                return cb(new Error('Se requiere matricula y stage en el cuerpo de la petición'));
            }

            const db = require('../models');
            const student = await db.Student.findByPk(matricula);

            const careerFolder = (student?.careerName || 'General')
                .replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
            const studentNameFolder = (student?.name || matricula)
                .replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);

            const ext = path.extname(file.originalname);
            const baseName = path.basename(file.originalname, ext)
                .replace(/[^a-zA-Z0-9_-]/g, '_')
                .substring(0, 40);
            const filename = `${Date.now()}_${baseName}${ext}`;

            const key = `documentos/${careerFolder}/${studentNameFolder}/${stage}/${filename}`;
            cb(null, key);
        } catch (err) {
            cb(err);
        }
    }
});

// ── Storage para archivos Excel del admin → Memory (no se guarda en disco ni S3) ─
// El Excel solo se usa para parsear su contenido y actualizar la BD.
// multer.memoryStorage() expone req.file.buffer para que xlsx pueda leerlo directamente.
const excelMemoryStorage = multer.memoryStorage();

// ── Instancias de multer ──────────────────────────────────────────────────────
const uploadDocument = multer({
    storage: studentS3Storage,
    fileFilter: docFilter,
    limits: { fileSize: 10 * 1024 * 1024 }   // 10 MB máximo
});

const uploadExcel = multer({
    storage: excelMemoryStorage,
    fileFilter: excelFilter,
    limits: { fileSize: 20 * 1024 * 1024 }   // 20 MB máximo
});

module.exports = { uploadDocument, uploadExcel, s3Client: s3, S3_BUCKET: BUCKET };
