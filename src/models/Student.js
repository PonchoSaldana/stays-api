const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Student = sequelize.define('Student', {
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
            type: DataTypes.STRING
        },
        grade: {
            type: DataTypes.STRING
        },
        group: {
            type: DataTypes.STRING
        },
        shift: {
            type: DataTypes.STRING
        },
        generation: {
            type: DataTypes.STRING
        },
        director: {
            type: DataTypes.STRING
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'Pendiente'
        },
        companyId: {
            type: DataTypes.STRING, // Or Integer if related to Company model
            allowNull: true
        }
    });

    return Student;
};
