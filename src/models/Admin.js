const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

/**
 * Modelo Admin — usuarios administrativos del sistema.
 * El usuario 'root' es hardcodeado en .env y NO se guarda aquí.
 * Sólo los admins creados por root van en esta tabla.
 */
module.exports = (sequelize) => {
    const Admin = sequelize.define('Admin', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,    // Hash bcrypt
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true
        },
        role: {
            type: DataTypes.ENUM('ADMIN', 'ROOT'),
            defaultValue: 'ADMIN'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
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
        tableName: 'Admins',
        timestamps: true,
        hooks: {
            beforeCreate: async (admin) => {
                if (admin.password) {
                    admin.password = await bcrypt.hash(admin.password, 10);
                }
            },
            beforeUpdate: async (admin) => {
                if (admin.changed('password')) {
                    admin.password = await bcrypt.hash(admin.password, 10);
                }
            }
        }
    });

    // Método de instancia para verificar contraseña
    Admin.prototype.validPassword = function (password) {
        return bcrypt.compare(password, this.password);
    };

    return Admin;
};
