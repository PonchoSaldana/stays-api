const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); // I need to create this middleware
const controller = require('../controllers/import.controller');

router.post('/students', upload.single("file"), controller.importStudents);
router.post('/companies', upload.single("file"), controller.importCompanies);
router.delete('/students', controller.clearStudents);
router.delete('/companies', controller.clearCompanies);

module.exports = router;
