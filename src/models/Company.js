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
            allowNull: true,
            defaultValue: ''
        },
        // nombre del contacto en el área de rh o vinculación
        contact: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        // gerente de recursos humanos (específico para el excel de importación)
        managerRH: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        // giro empresarial o sector
        sector: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        // apoyo económico mensual
        economicSupport: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        // giro empresarial (heredado, se mantendrá sector arriba)
        businessLine: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        // correo de la empresa
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        // teléfono
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        // con cupo disponible
        available: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        // capacidad máxima de alumnos
        maxStudents: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 5
        },
        // Carrera o carreras solicitadas (ID o texto descriptivo)
        careerId: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        numero_empresa: { type: DataTypes.STRING, allowNull: true },
        empresa: { type: DataTypes.STRING, allowNull: true },
        direccion: { type: DataTypes.STRING, allowNull: true },
        estado: { type: DataTypes.STRING, allowNull: true },
        telefono: { type: DataTypes.STRING, allowNull: true },
        nombre_dirigido: { type: DataTypes.STRING, allowNull: true },
        cargo: { type: DataTypes.STRING, allowNull: true },
        giro: { type: DataTypes.STRING, allowNull: true },
        correo: { type: DataTypes.STRING, allowNull: true },
        empresa_contactada: { type: DataTypes.STRING, allowNull: true },
        apoyo_economico: { type: DataTypes.STRING, allowNull: true },
        nombre_director: { type: DataTypes.STRING, allowNull: true },
        aprendientes_requeridos: { type: DataTypes.STRING, allowNull: true },
        aprendientes_asignados: { type: DataTypes.STRING, allowNull: true },
        hombre_mujer: { type: DataTypes.STRING, allowNull: true },
        nombre_proyecto: { type: DataTypes.STRING, allowNull: true },
        area_colaboracion: { type: DataTypes.STRING, allowNull: true },
        numero_memo: { type: DataTypes.STRING, allowNull: true },
        fecha: { type: DataTypes.STRING, allowNull: true },
        gestionada_por: { type: DataTypes.STRING, allowNull: true }
    }, {
        tableName: 'companies',
        timestamps: true
    });

    return Company;
};
