const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Multer configurado para subida de documentos de alumnos.
 *
 * Estructura de carpetas:
 *   /uploads/
 *     excel/                            ← Excels temporales del admin
 *     students/
 *       {matricula}/
 *         upload_1/                     ← Documentos iniciales
 *         upload_2/                     ← Documentos finales
 */

// ── Storage para documentos de alumnos ──────────────────────────────────────
const studentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { matricula, stage } = req.body;
        if (!matricula || !stage) {
            return cb(new Error('Se requiere matricula y stage en el cuerpo de la petición'));
        }
        const dir = path.join(__dirname, '../../uploads/students', matricula, stage);
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .substring(0, 40);
        cb(null, `${Date.now()}_${baseName}${ext}`);
    }
});

// ── Storage para archivos Excel del dashboard admin ──────────────────────────
const excelStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../uploads/excel');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `import_${Date.now()}_${file.originalname}`);
    }
});

// ── Filtros de archivo ───────────────────────────────────────────────────────
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

// ── Instancias de multer ─────────────────────────────────────────────────────
const uploadDocument = multer({
    storage: studentStorage,
    fileFilter: docFilter,
    limits: { fileSize: 10 * 1024 * 1024 }   // 10 MB máximo
});

const uploadExcel = multer({
    storage: excelStorage,
    fileFilter: excelFilter,
    limits: { fileSize: 20 * 1024 * 1024 }   // 20 MB máximo
});

module.exports = { uploadDocument, uploadExcel };
