const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/import.controller');
const { uploadExcel } = require('../middleware/upload');
const { verifyAdmin } = require('../utils/jwt');

// Todas las rutas de importación son exclusivas de administrador
router.post('/students', verifyAdmin, uploadExcel.single('file'), ctrl.importStudents);
router.post('/companies', verifyAdmin, uploadExcel.single('file'), ctrl.importCompanies);
router.delete('/students', verifyAdmin, ctrl.clearStudents);
router.delete('/companies', verifyAdmin, ctrl.clearCompanies);

module.exports = router;
