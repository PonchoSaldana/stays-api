const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/document.controller');
const { uploadDocument } = require('../middleware/upload');
const { verifyToken } = require('../utils/jwt');

// Subir un documento (alumno autenticado)
router.post('/upload', verifyToken, uploadDocument.single('file'), ctrl.uploadDocument);

// Listar documentos de un alumno (por etapa opcional)
// GET /api/documents/student/20230001?stage=upload_1
router.get('/student/:matricula', verifyToken, ctrl.getByStudent);

// Admin: aprobar o rechazar un documento
router.patch('/:id/review', verifyToken, ctrl.reviewDocument);

// Descargar un documento
router.get('/:id/download', verifyToken, ctrl.downloadDocument);

module.exports = router;
