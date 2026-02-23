const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const db = require('../models');

// ── Flujo de Login / Onboarding ───────────────────────────────────────────

// Paso 1: Verificar matrícula
router.post('/check-matricula', ctrl.checkMatricula);

// Paso 2: Enviar código de verificación al correo
router.post('/send-code', ctrl.sendCode);

// Paso 3: Verificar el código OTP
router.post('/verify-code', ctrl.verifyCode);

// Paso 4: Guardar contraseña y completar onboarding
router.post('/set-password', ctrl.setPassword);

// Login normal (matrícula + contraseña)
router.post('/login/student', ctrl.loginStudent);

// Login administrador
router.post('/login/admin', ctrl.loginAdmin);

// ── Endpoint público para live-recognition en login (solo devuelve nombre) ──
router.get('/hint/:matricula', async (req, res) => {
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
