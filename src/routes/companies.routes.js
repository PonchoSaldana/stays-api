const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/company.controller');
const { verifyToken, verifyAdmin } = require('../utils/jwt');
const v = require('../middleware/validate');

// ── Listar empresas (cualquier usuario autenticado puede ver el catálogo) ──────
router.get('/', verifyToken, v.validateCompanySearch, ctrl.findAll);

// ── Ver una empresa ────────────────────────────────────────────────────────────
router.get('/:id', verifyToken, v.validateIdParam, ctrl.findOne);

// ── Crear empresa (solo admin) ─────────────────────────────────────────────────
router.post('/', verifyAdmin, v.validateCreateCompany, ctrl.create);

// ── Actualizar empresa (solo admin) ───────────────────────────────────────────
router.put('/:id', verifyAdmin, v.validateIdParam, v.validateUpdateCompany, ctrl.update);

// ── Eliminar empresa (solo admin) ─────────────────────────────────────────────
router.delete('/:id', verifyAdmin, v.validateIdParam, ctrl.remove);

module.exports = router;
