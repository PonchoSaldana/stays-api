const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/admin.controller');
const { verifyRoot } = require('../utils/jwt');
const v = require('../middleware/validate');

// Todas estas rutas son solo para ROOT
router.post('/', verifyRoot, v.validateCreateAdmin, ctrl.createAdmin);
router.get('/', verifyRoot, ctrl.getAdmins);
router.put('/:id', verifyRoot, v.validateIdParam, v.validateUpdateAdmin, ctrl.updateAdmin);
router.delete('/:id', verifyRoot, v.validateIdParam, ctrl.deleteAdmin);

module.exports = router;
