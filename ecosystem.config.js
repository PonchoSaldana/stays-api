// ecosystem.config.js — Configuración de PM2 para Amazon EC2
// Uso: pm2 start ecosystem.config.js
// Referencia: https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
    apps: [
        {
            name: 'stays-api',
            script: 'server.js',
            instances: 1,           // 1 instancia (ajustar a 'max' si hay más CPUs)
            exec_mode: 'fork',      // 'cluster' si se usa más de 1 instancia
            watch: false,           // no reiniciar en cada cambio de archivo
            autorestart: true,      // reiniciar si el proceso muere
            max_restarts: 10,
            restart_delay: 3000,    // esperar 3s antes de reintentar

            // Variables de entorno para producción
            // Las sensibles van en el .env del servidor, NO aquí
            env_production: {
                NODE_ENV: 'production',
                PORT: 3001
            },

            // Log
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            merge_logs: true,

            // Reinicio automático si el uso de memoria supera 500 MB
            max_memory_restart: '500M'
        }
    ]
};
