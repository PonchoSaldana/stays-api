const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/admin.controller');
const { verifyRoot } = require('../utils/jwt');

// Todas estas rutas son solo para ROOT
router.post('/', verifyRoot, ctrl.createAdmin);
router.get('/', verifyRoot, ctrl.getAdmins);
router.put('/:id', verifyRoot, ctrl.updateAdmin);
router.delete('/:id', verifyRoot, ctrl.deleteAdmin);

module.exports = router;
