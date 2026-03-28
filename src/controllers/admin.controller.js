const db = require('../models');
const bcrypt = require('bcryptjs');

const Admin = db.Admin;

// Crear un nuevo administrador/encargado de carrera (solo root)
exports.createAdmin = async (req, res) => {
    try {
        const { username, password, role, assignedCareers } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
        }

        const validRoles = ['ADMIN', 'ENCARGADO_CARRERA'];
        const assignRole = validRoles.includes(role) ? role : 'ADMIN';
        
        let assigned = [];
        if (assignRole === 'ENCARGADO_CARRERA' && Array.isArray(assignedCareers)) {
            assigned = assignedCareers;
        }

        const existing = await Admin.findOne({ where: { username } });
        if (existing) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        const admin = await Admin.create({
            username,
            password,
            role: assignRole,
            assignedCareers: assigned
        });

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            admin: {
                id: admin.id,
                username: admin.username,
                role: admin.role,
                assignedCareers: admin.assignedCareers
            }
        });
    } catch (error) {
        console.error('createAdmin:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Listar todos los administradores (solo root)
exports.getAdmins = async (req, res) => {
    try {
        const admins = await Admin.findAll({
            where: { isActive: true },
            attributes: ['id', 'username', 'role', 'createdAt', 'loginAttempts', 'lockUntil', 'assignedCareers']
        });
        res.json(admins);
    } catch (error) {
        console.error('getAdmins:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Eliminar un administrador (solo root)
exports.deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const admin = await Admin.findByPk(id);
        if (!admin) {
            return res.status(404).json({ message: 'Administrador no encontrado' });
        }
        
        await admin.destroy();
        res.json({ message: 'Administrador eliminado exitosamente' });
    } catch (error) {
        console.error('deleteAdmin:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Actualizar administrador (solo root, por ej. para asignación de carreras)
exports.updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { assignedCareers } = req.body;
        
        const admin = await Admin.findByPk(id);
        if (!admin) {
            return res.status(404).json({ message: 'Administrador no encontrado' });
        }
        
        if (assignedCareers !== undefined) {
            admin.assignedCareers = assignedCareers;
        }

        await admin.save();
        res.json({ message: 'Administrador actualizado exitosamente', admin });
    } catch (error) {
        console.error('updateAdmin:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
