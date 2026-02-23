const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Student = sequelize.define('Student', {
        // ─── Datos del Excel ───────────────────────
        matricula: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        careerName: {
            type: DataTypes.STRING,
            defaultValue: ''
        },
        grade: {
            type: DataTypes.STRING,
            defaultValue: ''
        },
        group: {
            type: DataTypes.STRING,
            defaultValue: ''
        },
        shift: {
            type: DataTypes.STRING,
            defaultValue: ''
        },
        generation: {
            type: DataTypes.STRING,
            defaultValue: ''
        },
        director: {
            type: DataTypes.STRING,
            defaultValue: ''
        },

        // ─── Empresa asignada ───────────────────────
        companyId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Companies',
                key: 'id'
            }
        },

        // ─── Estado del proceso ─────────────────────
        status: {
            type: DataTypes.ENUM(
                'Pendiente',
                'Empresa Seleccionada',
                'Documentos Iniciales Enviados',
                'En Revisión Inicial',
                'Documentos Generados',
                'Documentos Finales Enviados',
                'En Revisión Final',
                'Finalizado',
                'Rechazado'
            ),
            defaultValue: 'Pendiente'
        },
        currentStage: {
            type: DataTypes.STRING,
            defaultValue: 'catalogo-empresas'
        },

        // ─── Autenticación / Onboarding ─────────────
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: { isEmail: true }
        },
        password: {
            type: DataTypes.STRING,    // Hash bcrypt
            allowNull: true
        },
        isFirstLogin: {
            type: DataTypes.BOOLEAN,
            defaultValue: true         // true = aún no ha configurado contraseña
        },
        emailVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },

        // ─── Código de verificación temporal ────────
        verificationCode: {
            type: DataTypes.STRING,
            allowNull: true
        },
        verificationCodeExpires: {
            type: DataTypes.DATE,
            allowNull: true
        },

        // ─── Comentarios del admin ───────────────────
        adminNotes: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        // ─── Seguridad: bloqueo por intentos ────────
        loginAttempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        lockUntil: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        }
    }, {
        tableName: 'Students',
        timestamps: true   // createdAt, updatedAt
    });

    return Student;
};
