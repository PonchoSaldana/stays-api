const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/company.controller');
const { verifyToken, verifyAdmin } = require('../utils/jwt');

// ── Listar empresas (cualquier usuario autenticado puede ver el catálogo) ──────
router.get('/', verifyToken, ctrl.findAll);

// ── Ver una empresa ────────────────────────────────────────────────────────────
router.get('/:id', verifyToken, ctrl.findOne);

// ── Crear empresa (solo admin) ─────────────────────────────────────────────────
router.post('/', verifyAdmin, ctrl.create);

// ── Actualizar empresa (solo admin) ───────────────────────────────────────────
router.put('/:id', verifyAdmin, ctrl.update);

// ── Eliminar empresa (solo admin) ─────────────────────────────────────────────
router.delete('/:id', verifyAdmin, ctrl.remove);

module.exports = router;
