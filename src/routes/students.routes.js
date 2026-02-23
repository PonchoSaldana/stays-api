const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/student.controller');
const { verifyToken, verifyAdmin } = require('../utils/jwt');

// ── Listar todos los alumnos (solo admin) ─────────────────────────────────────
router.get('/', verifyAdmin, ctrl.findAll);

// ── Buscar alumno por matrícula (alumno propio o admin) ───────────────────────
router.get('/:matricula', verifyToken, ctrl.findByMatricula);

// ── Alumno selecciona empresa ──────────────────────────────────────────────────
router.put('/:matricula/select-company', verifyToken, ctrl.selectCompany);

// ── Avanzar etapa del proceso (alumno o admin) ────────────────────────────────
router.put('/:matricula/advance-stage', verifyToken, ctrl.advanceStage);

// ── Cambiar contraseña (alumno autenticado) ───────────────────────────────────
router.put('/:matricula/change-password', verifyToken, ctrl.changePassword);

module.exports = router;
