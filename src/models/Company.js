const { DataTypes } = require('sequelize');

// modelo de empresas con convenio para estadías profesionales
module.exports = (sequelize) => {
    const Company = sequelize.define('Company', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        // nombre oficial de la empresa
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        // dirección física de las instalaciones
        address: {
            type: DataTypes.STRING,
            allowNull: true
        },
        // nombre del contacto en el área de rh o vinculación
        contact: {
            type: DataTypes.STRING,
            allowNull: true
        },
        // correo del contacto para comunicación
        email: {
            type: DataTypes.STRING,
            allowNull: true
        },
        // carrera a la que aplica preferentemente esta empresa
        careerId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        // cuántos alumnos puede recibir simultáneamente
        spots: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        // indica si la empresa ofrece apoyo económico al alumno
        hasFinancialSupport: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        // nombre del archivo del convenio firmado (guardado en servidor)
        fileName: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'Companies',
        timestamps: true
    });

    return Company;
};
