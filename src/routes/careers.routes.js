const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/career.controller');
const { verifyRoot } = require('../utils/jwt');
const v = require('../middleware/validate');

router.get('/', ctrl.getCareers); // público: alumnos y admins obtienen el catálogo
router.post('/', verifyRoot, v.validateCreateCareer, ctrl.createCareer);
router.put('/:id', verifyRoot, v.validateCareerIdParam, v.validateUpdateCareer, ctrl.updateCareer);
router.delete('/:id', verifyRoot, v.validateCareerIdParam, ctrl.deleteCareer);

module.exports = router;
