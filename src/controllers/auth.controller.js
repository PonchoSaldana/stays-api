const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../models');
const { sendVerificationCode } = require('../utils/mailer');
const { generateStudentToken, generateAdminToken } = require('../utils/jwt');

const Student = db.Student;
const Admin = db.Admin;

// ────────────────────────────────────────────────────────────────────────────
// PASO 1 — El alumno ingresa su matrícula
// Responde si es primer ingreso o ya tiene cuenta configurada
// ────────────────────────────────────────────────────────────────────────────
exports.checkMatricula = async (req, res) => {
    try {
        const { matricula } = req.body;
        if (!matricula) return res.status(400).json({ message: 'Matrícula requerida' });

        const student = await Student.findOne({
            where: db.sequelize.where(
                db.sequelize.fn('LOWER', db.sequelize.col('matricula')),
                String(matricula).trim().toLowerCase()
            )
        });

        if (!student) {
            return res.status(404).json({ message: 'Matrícula no encontrada. Contacta al administrador.' });
        }

        // Si ya tiene contraseña configurada → flujo de login normal
        if (!student.isFirstLogin && student.password) {
            return res.json({
                status: 'login',
                name: student.name,
                matricula: student.matricula
            });
        }

        // Si es primer ingreso → flujo de onboarding
        return res.json({
            status: 'onboarding',
            name: student.name,
            matricula: student.matricula,
            // Informamos si ya vinculó correo, pero NO lo enviamos para evitar que se pre-rellene por privacidad
            emailAlreadySet: !!student.email,
            email: null
        });

    } catch (err) {
        console.error('❌ checkMatricula:', err);
        res.status(500).json({ message: 'Error del servidor', error: err.message });
    }
};

// ────────────────────────────────────────────────────────────────────────────
// PASO 2 (onboarding) — Alumno ingresa su correo para recibir código
// ────────────────────────────────────────────────────────────────────────────
exports.sendCode = async (req, res) => {
    try {
        const { matricula, email } = req.body;
        if (!matricula || !email) {
            return res.status(400).json({ message: 'Matrícula y correo son requeridos' });
        }

        const student = await Student.findOne({
            where: db.sequelize.where(
                db.sequelize.fn('LOWER', db.sequelize.col('matricula')),
                String(matricula).trim().toLowerCase()
            )
        });

        if (!student) return res.status(404).json({ message: 'Alumno no encontrado' });

        // Generar código de 6 dígitos
        const code = String(Math.floor(100000 + Math.random() * 900000));
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

        await student.update({
            email,
            verificationCode: code,
            verificationCodeExpires: expires
        });

        // Enviar correo
        await sendVerificationCode(email, code, student.name);

        res.json({ message: 'Código enviado a ' + email });

    } catch (err) {
        console.error('❌ sendCode:', err);
        res.status(500).json({ message: 'Error al enviar el código', error: err.message });
    }
};

// ────────────────────────────────────────────────────────────────────────────
// PASO 3 (onboarding) — Verificar el código recibido por correo
// ────────────────────────────────────────────────────────────────────────────
exports.verifyCode = async (req, res) => {
    try {
        const { matricula, code } = req.body;

        const student = await Student.findOne({
            where: db.sequelize.where(
                db.sequelize.fn('LOWER', db.sequelize.col('matricula')),
                String(matricula).trim().toLowerCase()
            )
        });

        if (!student) return res.status(404).json({ message: 'Alumno no encontrado' });

        if (!student.verificationCode || student.verificationCode !== String(code).trim()) {
            return res.status(400).json({ message: 'Código incorrecto' });
        }

        if (new Date() > student.verificationCodeExpires) {
            return res.status(400).json({ message: 'El código ha expirado. Solicita uno nuevo.' });
        }

        // Marcar correo como verificado, limpiar código
        await student.update({
            emailVerified: true,
            verificationCode: null,
            verificationCodeExpires: null
        });

        res.json({ message: 'Correo verificado correctamente' });

    } catch (err) {
        console.error('❌ verifyCode:', err);
        res.status(500).json({ message: 'Error al verificar código', error: err.message });
    }
};

// ────────────────────────────────────────────────────────────────────────────
// PASO 4 (onboarding) — Guardar contraseña y completar registro
// ────────────────────────────────────────────────────────────────────────────
exports.setPassword = async (req, res) => {
    try {
        const { matricula, password } = req.body;
        if (!matricula || !password) {
            return res.status(400).json({ message: 'Matrícula y contraseña son requeridas' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
        }

        const student = await Student.findOne({
            where: db.sequelize.where(
                db.sequelize.fn('LOWER', db.sequelize.col('matricula')),
                String(matricula).trim().toLowerCase()
            )
        });

        if (!student) return res.status(404).json({ message: 'Alumno no encontrado' });
        if (!student.emailVerified) {
            return res.status(400).json({ message: 'Debes verificar tu correo antes de crear la contraseña' });
        }

        const hashed = await bcrypt.hash(password, 10);

        await student.update({
            password: hashed,
            isFirstLogin: false
        });

        // Generar token para que el alumno quede logueado de inmediato
        const token = generateStudentToken(student);

        res.json({
            message: 'Cuenta configurada exitosamente',
            token,
            user: {
                matricula: student.matricula,
                name: student.name,
                role: 'student',
                careerName: student.careerName
            }
        });

    } catch (err) {
        console.error('❌ setPassword:', err);
        res.status(500).json({ message: 'Error al guardar la contraseña', error: err.message });
    }
};

// ────────────────────────────────────────────────────────────────────────────
// LOGIN normal de alumno (ya tiene contraseña configurada)
// ────────────────────────────────────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 7;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutos

exports.loginStudent = async (req, res) => {
    try {
        const { matricula, password } = req.body;

        const student = await Student.findOne({
            where: db.sequelize.where(
                db.sequelize.fn('LOWER', db.sequelize.col('matricula')),
                String(matricula).trim().toLowerCase()
            )
        });

        if (!student || !student.password) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // ── Verificar si la cuenta está bloqueada ─────────────────────────────
        if (student.lockUntil && student.lockUntil > new Date()) {
            const minutos = Math.ceil((student.lockUntil - Date.now()) / 60000);
            return res.status(423).json({
                message: `Cuenta bloqueada por demasiados intentos fallidos. Intenta en ${minutos} minuto${minutos !== 1 ? 's' : ''}.`,
                lockedUntil: student.lockUntil
            });
        }

        const match = await bcrypt.compare(password, student.password);

        if (!match) {
            // Incrementar contador de intentos fallidos
            const attempts = (student.loginAttempts || 0) + 1;
            const updateData = { loginAttempts: attempts };

            if (attempts >= MAX_LOGIN_ATTEMPTS) {
                updateData.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
                updateData.loginAttempts = 0; // Reinicia para el siguiente ciclo
                await student.update(updateData);
                return res.status(423).json({
                    message: `Cuenta bloqueada 15 minutos por ${MAX_LOGIN_ATTEMPTS} intentos fallidos.`,
                    lockedFor: 15
                });
            }

            await student.update(updateData);
            const restantes = MAX_LOGIN_ATTEMPTS - attempts;
            return res.status(401).json({
                message: `Contraseña incorrecta. Te quedan ${restantes} intento${restantes !== 1 ? 's' : ''}.`,
                attemptsLeft: restantes
            });
        }

        // ── Éxito: limpiar contadores ─────────────────────────────────────────
        await student.update({ loginAttempts: 0, lockUntil: null });

        const token = generateStudentToken(student);

        res.json({
            token,
            user: {
                matricula: student.matricula,
                name: student.name,
                role: 'student',
                careerName: student.careerName,
                status: student.status
            }
        });

    } catch (err) {
        console.error('❌ loginStudent:', err);
        res.status(500).json({ message: 'Error en login', error: err.message });
    }
};

// ────────────────────────────────────────────────────────────────────────────
// LOGIN de administrador / root
// ────────────────────────────────────────────────────────────────────────────
exports.loginAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Verificar credenciales ROOT desde .env (root nunca se bloquea)
        const rootUser = process.env.ROOT_USERNAME || 'root';
        const rootPass = process.env.ROOT_PASSWORD || 'uttecam2026';

        if (username === rootUser && password === rootPass) {
            const token = generateAdminToken({ id: 0, username: 'root', role: 'ROOT' });
            return res.json({
                token,
                user: { username: 'root', role: 'ROOT' }
            });
        }

        // Buscar en la tabla de admins
        const admin = await Admin.findOne({ where: { username, isActive: true } });
        if (!admin) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        // ── Verificar si la cuenta admin está bloqueada ───────────────────────
        if (admin.lockUntil && admin.lockUntil > new Date()) {
            const minutos = Math.ceil((admin.lockUntil - Date.now()) / 60000);
            return res.status(423).json({
                message: `Cuenta bloqueada. Intenta en ${minutos} minuto${minutos !== 1 ? 's' : ''}.`,
                lockedUntil: admin.lockUntil
            });
        }

        const match = await admin.validPassword(password);

        if (!match) {
            const attempts = (admin.loginAttempts || 0) + 1;
            const updateData = { loginAttempts: attempts };

            if (attempts >= MAX_LOGIN_ATTEMPTS) {
                updateData.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
                updateData.loginAttempts = 0;
                await admin.update(updateData);
                return res.status(423).json({
                    message: `Cuenta bloqueada 15 minutos por ${MAX_LOGIN_ATTEMPTS} intentos fallidos.`,
                    lockedFor: 15
                });
            }

            await admin.update(updateData);
            const restantes = MAX_LOGIN_ATTEMPTS - attempts;
            return res.status(401).json({
                message: `Credenciales incorrectas. Te quedan ${restantes} intento${restantes !== 1 ? 's' : ''}.`,
                attemptsLeft: restantes
            });
        }

        // ── Éxito ─────────────────────────────────────────────────────────────
        await admin.update({ loginAttempts: 0, lockUntil: null });

        const token = generateAdminToken(admin);

        res.json({
            token,
            user: { id: admin.id, username: admin.username, role: admin.role }
        });

    } catch (err) {
        console.error('❌ loginAdmin:', err);
        res.status(500).json({ message: 'Error en login admin', error: err.message });
    }
};
