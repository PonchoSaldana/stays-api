const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// modelo de administradores del sistema
// el usuario 'root' se hardcodea en .env y no se guarda aquí;
// solo los admins creados por root aparecen en esta tabla
module.exports = (sequelize) => {
    const Admin = sequelize.define('Admin', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        // nombre de usuario único para iniciar sesión
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        // contraseña almacenada como hash bcrypt
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        // correo opcional del admin
        email: {
            type: DataTypes.STRING,
            allowNull: true
        },
        // rol: ADMIN puede gestionar datos; ROOT puede además modificar procesos
        role: {
            type: DataTypes.ENUM('ADMIN', 'ROOT'),
            defaultValue: 'ADMIN'
        },
        // permite desactivar un admin sin borrarlo
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        // número de intentos fallidos de login
        loginAttempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        // fecha hasta la cual la cuenta está bloqueada por intentos fallidos
        lockUntil: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        }
    }, {
        tableName: 'Admins',
        timestamps: true,
        hooks: {
            // hashear contraseña antes de crear el admin
            beforeCreate: async (admin) => {
                if (admin.password) {
                    admin.password = await bcrypt.hash(admin.password, 10);
                }
            },
            // hashear contraseña solo si fue modificada
            beforeUpdate: async (admin) => {
                if (admin.changed('password')) {
                    admin.password = await bcrypt.hash(admin.password, 10);
                }
            }
        }
    });

    // método para comparar contraseña en texto plano con el hash guardado
    Admin.prototype.validPassword = function (password) {
        return bcrypt.compare(password, this.password);
    };

    return Admin;
};
