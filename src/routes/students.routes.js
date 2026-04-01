const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/student.controller');
const { verifyToken, verifyAdmin } = require('../utils/jwt');
const v = require('../middleware/validate');

// ── Listar todos los alumnos (solo admin) ─────────────────────────────────────
router.get('/', verifyAdmin, v.validateStudentSearch, ctrl.findAll);

// ── Buscar alumno por matrícula (alumno propio o admin) ───────────────────────
router.get('/:matricula', verifyToken, v.validateMatriculaParam, ctrl.findByMatricula);

// ── Alumno selecciona empresa ──────────────────────────────────────────────────
router.put('/:matricula/select-company', verifyToken, v.validateMatriculaParam, v.validateSelectCompany, ctrl.selectCompany);

// ── Avanzar etapa del proceso (alumno o admin) ────────────────────────────────
router.put('/:matricula/advance-stage', verifyToken, v.validateMatriculaParam, v.validateAdvanceStage, ctrl.advanceStage);

// ── Cambiar contraseña (alumno autenticado) ───────────────────────────────────
router.put('/:matricula/change-password', verifyToken, v.validateMatriculaParam, v.validateChangePassword, ctrl.changePassword);

module.exports = router;
