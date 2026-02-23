const { Op } = require('sequelize');
const db = require('../models');
const Company = db.Company;

// ─── GET /api/companies ─────────────────────────────────────────────────────
exports.findAll = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const search = (req.query.search || '').trim();
        const offset = (page - 1) * limit;

        const where = {};
        if (search) {
            where.name = { [Op.like]: `%${search}%` };
        }

        const { count, rows } = await Company.findAndCountAll({
            where,
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
        res.status(500).json({ message: err.message || 'Error al obtener empresas' });
    }
};

// ─── GET /api/companies/:id ─────────────────────────────────────────────────
exports.findOne = async (req, res) => {
    try {
        const company = await Company.findByPk(req.params.id);
        if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });
        res.json(company);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener empresa', error: err.message });
    }
};

// ─── POST /api/companies — crear empresa (admin) ────────────────────────────
exports.create = async (req, res) => {
    try {
        const { name, address, contact, businessLine, email, phone, available, maxStudents } = req.body;
        if (!name) return res.status(400).json({ message: 'El nombre de la empresa es requerido' });

        const company = await Company.create({
            name: name.trim(),
            address: address || '',
            contact: contact || '',
            businessLine: businessLine || '',
            email: email || '',
            phone: phone || '',
            available: available !== undefined ? available : true,
            maxStudents: maxStudents || 5
        });

        res.status(201).json({ message: 'Empresa creada correctamente', company });
    } catch (err) {
        res.status(500).json({ message: 'Error al crear empresa', error: err.message });
    }
};

// ─── PUT /api/companies/:id — actualizar empresa (admin) ────────────────────
exports.update = async (req, res) => {
    try {
        const company = await Company.findByPk(req.params.id);
        if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });

        const { name, address, contact, businessLine, email, phone, available, maxStudents } = req.body;

        await company.update({
            name: name ?? company.name,
            address: address ?? company.address,
            contact: contact ?? company.contact,
            businessLine: businessLine ?? company.businessLine,
            email: email ?? company.email,
            phone: phone ?? company.phone,
            available: available !== undefined ? available : company.available,
            maxStudents: maxStudents ?? company.maxStudents
        });

        res.json({ message: 'Empresa actualizada correctamente', company });
    } catch (err) {
        res.status(500).json({ message: 'Error al actualizar empresa', error: err.message });
    }
};

// ─── DELETE /api/companies/:id — eliminar empresa (admin) ───────────────────
exports.remove = async (req, res) => {
    try {
        const company = await Company.findByPk(req.params.id);
        if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });

        // Verificar si tiene alumnos asignados
        const studentsCount = await db.Student.count({ where: { companyId: req.params.id } });
        if (studentsCount > 0) {
            return res.status(400).json({
                message: `No se puede eliminar: ${studentsCount} alumno(s) tienen esta empresa asignada`
            });
        }

        await company.destroy();
        res.json({ message: 'Empresa eliminada correctamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error al eliminar empresa', error: err.message });
    }
};
