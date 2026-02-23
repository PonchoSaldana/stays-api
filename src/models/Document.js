const { DataTypes } = require('sequelize');

/**
 * Modelo Document — registra cada archivo subido por un alumno.
 * Los archivos físicos se guardan en:
 *   /uploads/students/{matricula}/{stage}/{filename}
 */
module.exports = (sequelize) => {
    const Document = sequelize.define('Document', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        studentMatricula: {
            type: DataTypes.STRING,
            allowNull: false,
            references: { model: 'Students', key: 'matricula' }
        },
        // Etapa del proceso: 'upload_1', 'upload_2', etc.
        stage: {
            type: DataTypes.STRING,
            allowNull: false
        },
        // Nombre lógico del documento: 'Documento 1', 'Carta', etc.
        documentName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        // Nombre del archivo físico guardado en disco
        filename: {
            type: DataTypes.STRING,
            allowNull: false
        },
        // Ruta relativa desde /uploads
        filePath: {
            type: DataTypes.STRING,
            allowNull: false
        },
        // Tipo MIME
        mimeType: {
            type: DataTypes.STRING,
            defaultValue: 'application/octet-stream'
        },
        // Tamaño en bytes
        fileSize: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        // Estado: 'Pendiente', 'Aprobado', 'Rechazado'
        status: {
            type: DataTypes.ENUM('Pendiente', 'Aprobado', 'Rechazado'),
            defaultValue: 'Pendiente'
        },
        // Comentario del revisor
        reviewNote: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'Documents',
        timestamps: true
    });

    return Document;
};
