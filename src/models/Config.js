const { DataTypes } = require('sequelize');

// modelo de configuración global del sistema (pares clave-valor)
// permite guardar ajustes como el proceso activo sin hardcodear valores
module.exports = (sequelize) => {
    const Config = sequelize.define('Config', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        // nombre único de la configuración (ej: 'activeProcess')
        key: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        // valor en texto; null significa desactivado o sin valor
        value: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        // usuario que realizó el último cambio
        updatedBy: {
            type: DataTypes.STRING(100),
            allowNull: true
        }
    }, {
        tableName: 'Configs',
        timestamps: true // registra cuándo se creó y modificó cada fila
    });

    return Config;
};
