const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const db = require('../models');
const v = require('../middleware/validate');

// ── Flujo de Login / Onboarding ───────────────────────────────────────────

// Paso 1: Verificar matrícula
router.post('/check-matricula', v.validateCheckMatricula, ctrl.checkMatricula);

// Paso 2: Enviar código de verificación al correo
router.post('/send-code', v.validateSendCode, ctrl.sendCode);

// Paso 3: Verificar el código OTP
router.post('/verify-code', v.validateVerifyCode, ctrl.verifyCode);

// Paso 4: Guardar contraseña y completar onboarding / reset
router.post('/set-password', v.validateSetPassword, ctrl.setPassword);

// Recuperación de contraseña (envía código al correo registrado)
router.post('/forgot-password', v.validateForgotPassword, ctrl.forgotPassword);

// Login normal (matrícula + contraseña)
router.post('/login/student', v.validateLoginStudent, ctrl.loginStudent);

// Login administrador
router.post('/login/admin', v.validateLoginAdmin, ctrl.loginAdmin);

// ── Endpoint público para live-recognition en login (solo devuelve nombre) ──
router.get('/hint/:matricula', v.validateMatriculaParam, async (req, res) => {
    try {
        const mat = String(req.params.matricula).trim().toLowerCase();
        if (mat.length < 3) return res.json({ name: null });

        const student = await db.Student.findOne({
            where: db.sequelize.where(
                db.sequelize.fn('LOWER', db.sequelize.col('matricula')),
                mat
            ),
            attributes: ['name']   // Solo el nombre, nada más
        });
        res.json({ name: student ? student.name : null });
    } catch {
        res.json({ name: null });
    }
});

module.exports = router;
