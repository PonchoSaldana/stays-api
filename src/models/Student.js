const { DataTypes } = require('sequelize');

// modelo de alumnos importados desde el excel del sistem escolar
module.exports = (sequelize) => {
    const Student = sequelize.define('Student', {

        // ─── datos académicos (vienen del excel) ──────────────────────────────
        matricula: {
            type: DataTypes.STRING,
            primaryKey: true,   // la matrícula es el identificador único del alumno
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
            defaultValue: ''    // grado semestral del alumno
        },
        group: {
            type: DataTypes.STRING,
            defaultValue: ''    // grupo (ej: "A", "B")
        },
        shift: {
            type: DataTypes.STRING,
            defaultValue: ''    // turno: matutino, vespertino, etc.
        },
        generation: {
            type: DataTypes.STRING,
            defaultValue: ''
        },
        director: {
            type: DataTypes.STRING,
            defaultValue: ''    // director de carrera asignado
        },

        // ─── empresa donde realizará la estadía ───────────────────────────────
        companyId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'companies',
                key: 'id'
            }
        },

        // ─── estado general del proceso de estadía ────────────────────────────
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
        // etapa actual dentro del flujo de documentación
        currentStage: {
            type: DataTypes.STRING,
            defaultValue: 'catalogo-empresas'
        },

        // ─── autenticación y onboarding ───────────────────────────────────────
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: { isEmail: true }
        },
        // contraseña hasheada con bcrypt; null hasta que el alumno la configure
        password: {
            type: DataTypes.STRING,
            allowNull: true
        },
        // true = primer ingreso, aún no ha configurado contraseña
        isFirstLogin: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        emailVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },

        // ─── código otp temporal para verificar correo ────────────────────────
        verificationCode: {
            type: DataTypes.STRING,
            allowNull: true
        },
        verificationCodeExpires: {
            type: DataTypes.DATE,
            allowNull: true     // fecha de vencimiento del código (10 minutos)
        },

        // ─── notas internas del administrador ────────────────────────────────
        adminNotes: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        // ─── bloqueo de cuenta por intentos fallidos ─────────────────────────
        loginAttempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        lockUntil: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null  // null = cuenta no bloqueada
        }
    }, {
        tableName: 'Students',
        timestamps: true    // genera createdAt y updatedAt automáticamente
    });

    return Student;
};
