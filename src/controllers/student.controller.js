const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const db = require('../models');
const Student = db.Student;

// ─── GET /api/students — lista paginada (solo admin) ─────────────────────────
// Query params: ?page=1&limit=20&search=juan&careerName=Ingeniería
exports.findAll = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const search = (req.query.search || '').trim();
        const careerName = (req.query.careerName || '').trim();
        const offset = (page - 1) * limit;

        // Construir cláusula WHERE
        const where = {};

        if (search) {
            where[Op.or] = [
                db.sequelize.where(
                    db.sequelize.fn('LOWER', db.sequelize.col('name')),
                    { [Op.like]: `%${search.toLowerCase()}%` }
                ),
                db.sequelize.where(
                    db.sequelize.fn('LOWER', db.sequelize.col('matricula')),
                    { [Op.like]: `%${search.toLowerCase()}%` }
                )
            ];
        }

        if (careerName) {
            // Búsqueda flexible: la BD tiene nombres completos de carrera
            where.careerName = {
                [Op.like]: `%${careerName}%`
            };
        }

        const { count, rows } = await Student.findAndCountAll({
            where,
            attributes: {
                include: [
                    [
                        db.sequelize.literal('(SELECT COUNT(*) FROM Documents WHERE Documents.studentMatricula = Student.matricula)'),
                        'docsCount'
                    ]
                ],
                exclude: ['password', 'verificationCode', 'verificationCodeExpires']
            },
            order: [['name', 'ASC']],
            limit,
            offset
        });

        res.json({
            data: rows,
            total: count,
            page,
            totalPages: Math.ceil(count / limit),
            limit
        });
    } catch (err) {
        res.status(500).json({ message: err.message || 'Error al obtener alumnos' });
    }
};


// ─── GET /api/students/:matricula — busca uno (alumno propio o admin) ─────────
exports.findByMatricula = async (req, res) => {
    try {
        const inputMatricula = String(req.params.matricula).trim().toLowerCase();

        const student = await Student.findOne({
            where: db.sequelize.where(
                db.sequelize.fn('LOWER', db.sequelize.col('matricula')),
                inputMatricula
            ),
            attributes: { exclude: ['password', 'verificationCode', 'verificationCodeExpires'] }
        });

        if (!student) {
            return res.status(404).json({ message: 'Alumno no encontrado' });
        }

        res.json(student);
    } catch (err) {
        res.status(500).json({ message: 'Error al buscar alumno', error: err.message });
    }
};

// ─── PUT /api/students/:matricula/select-company — alumno elige empresa ───────
exports.selectCompany = async (req, res) => {
    try {
        const inputMatricula = String(req.params.matricula).trim().toLowerCase();
        const { companyId } = req.body;

        if (!companyId) return res.status(400).json({ message: 'companyId requerido' });

        // Sólo el propio alumno puede hacer esto
        if (req.user.role === 'student' && req.user.matricula.toLowerCase() !== inputMatricula) {
            return res.status(403).json({ message: 'No puedes modificar otro alumno' });
        }

        const student = await Student.findOne({
            where: db.sequelize.where(
                db.sequelize.fn('LOWER', db.sequelize.col('matricula')),
                inputMatricula
            )
        });

        if (!student) return res.status(404).json({ message: 'Alumno no encontrado' });

        // Bloquear si ya tiene empresa asignada (sólo root puede reasignar)
        if (student.companyId && req.user.role !== 'ROOT') {
            return res.status(400).json({ message: 'Ya tienes una empresa asignada. Contacta al administrador para reasignación.' });
        }

        // ── Transacción con bloqueo pesimista para evitar race condition ──────────
        // SELECT FOR UPDATE garantiza que ninguna otra transacción concurrente pueda
        // leer la misma empresa hasta que ésta finalice, eliminando el TOCTOU.
        await db.sequelize.transaction(async (t) => {
            const company = await db.Company.findByPk(companyId, {
                lock: t.LOCK.UPDATE,
                transaction: t
            });
            if (!company) {
                const err = new Error('Empresa no encontrada');
                err.status = 404;
                throw err;
            }

            const studentsAssigned = await db.Student.count({
                where: { companyId },
                transaction: t
            });
            const maxSpots = company.maxStudents ?? 5;
            if (studentsAssigned >= maxSpots) {
                const err = new Error(`Esta empresa ya no tiene vacantes disponibles (${maxSpots}/${maxSpots} ocupadas).`);
                err.status = 400;
                throw err;
            }

            await student.update({
                companyId,
                status: 'Empresa Seleccionada',
                currentStage: 'documentos-iniciales'
            }, { transaction: t });
        });

        res.json({ message: 'Empresa seleccionada correctamente', companyId, status: 'Empresa Seleccionada' });
    } catch (err) {
        const status = err.status || 500;
        const message = err.status ? err.message : 'Error al seleccionar empresa';
        res.status(status).json({ message });
    }
};

// ─── PUT /api/students/:matricula/advance-stage — avanza de etapa ─────────
exports.advanceStage = async (req, res) => {
    try {
        const inputMatricula = String(req.params.matricula).trim().toLowerCase();
        const { status, currentStage } = req.body;

        if (!status || !currentStage) {
            return res.status(400).json({ message: 'status y currentStage son requeridos' });
        }

        const student = await Student.findOne({
            where: db.sequelize.where(
                db.sequelize.fn('LOWER', db.sequelize.col('matricula')),
                inputMatricula
            )
        });

        if (!student) return res.status(404).json({ message: 'Alumno no encontrado' });

        await student.update({ status, currentStage });
        res.json({ message: 'Etapa actualizada', status, currentStage });
    } catch (err) {
        res.status(500).json({ message: 'Error al avanzar etapa', error: err.message });
    }
};

// ─── PUT /api/students/:matricula/change-password ─────────────────────────────
exports.changePassword = async (req, res) => {
    try {
        const inputMatricula = String(req.params.matricula).trim().toLowerCase();
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'currentPassword y newPassword son requeridos' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
        }

        // Sólo el propio alumno
        if (req.user.matricula.toLowerCase() !== inputMatricula) {
            return res.status(403).json({ message: 'No puedes cambiar la contraseña de otro alumno' });
        }

        const student = await Student.findOne({
            where: db.sequelize.where(
                db.sequelize.fn('LOWER', db.sequelize.col('matricula')),
                inputMatricula
            )
        });

        if (!student) return res.status(404).json({ message: 'Alumno no encontrado' });

        const match = await bcrypt.compare(currentPassword, student.password || '');
        if (!match) return res.status(401).json({ message: 'Contraseña actual incorrecta' });

        const hashed = await bcrypt.hash(newPassword, 10);
        await student.update({ password: hashed });

        res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error al cambiar contraseña', error: err.message });
    }
};
