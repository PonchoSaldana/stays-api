const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Stays API — UT Tecamachalco',
            version: '2.5.0',
            description: 'API para la gestión de estadías profesionales universitarias. Incluye gestión de alumnos, empresas y documentos en S3.',
            contact: {
                name: 'Soporte TI - UT Tecamachalco',
            },
        },
        servers: [
            {
                url: process.env.BACKEND_URL || 'http://localhost:3001',
                description: 'Servidor de Producción/Desarrollo',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.js', './src/controllers/*.js'], // busca anotaciones en rutas y controladores
};

const specs = swaggerJsdoc(options);

module.exports = {
    swaggerUi,
    swaggerSpecs: specs,
};
