const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Company = sequelize.define('Company', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        address: {
            type: DataTypes.STRING,
            defaultValue: ''
        },
        contact: {
            type: DataTypes.STRING,
            defaultValue: ''
        },
        businessLine: {   // Giro empresarial
            type: DataTypes.STRING,
            defaultValue: ''
        },
        email: {
            type: DataTypes.STRING,
            defaultValue: ''
        },
        phone: {
            type: DataTypes.STRING,
            defaultValue: ''
        },
        available: {      // Si tiene cupo disponible
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        maxStudents: {    // Máximo de estudiantes que acepta
            type: DataTypes.INTEGER,
            defaultValue: 5
        }
    }, {
        tableName: 'Companies',
        timestamps: true
    });

    return Company;
};
