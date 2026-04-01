#!/bin/bash
# Script de configuración para Amazon EC2 (Ubuntu 22.04 LTS o 24.04 LTS)

echo "--- Actualizando sistema ---"
sudo apt update && sudo apt upgrade -y

echo "--- Instalando Node.js 20 ---"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "--- Instalando Nginx ---"
sudo apt install -y nginx

echo "--- Instalando PM2 globalmente ---"
sudo npm install -y pm2 -g

echo "--- Configuración de firewall ufw (abriendo puertos 80, 443, 22) ---"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "--- Clonando repositorio ---"
# Deberás cambiar la URL a la de tu proyecto real o usar rsync/scp
git clone https://github.com/PonchoSaldana/stays-api.git /home/ubuntu/stays-api || echo "Ya clonado u omitiendo"

cd /home/ubuntu/stays-api

echo "--- Instalando dependencias de la API ---"
npm ci

echo "--- Configurando archivo .env (¡Debes editarlo manualmente tras esta ejecución!) ---"
cp .env.example .env

echo "--- Iniciando PM2 ---"
pm2 start ecosystem.config.js
pm2 save
# Generar el script de autoarranque al reiniciar el servidor
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo "--- Copiando configuración de Nginx ---"
sudo cp /home/ubuntu/stays-api/aws-setup/nginx.conf /etc/nginx/sites-available/stays-api
sudo ln -sf /etc/nginx/sites-available/stays-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "--- ✅ Configuración completada ---"
echo "Por favor, edita /home/ubuntu/stays-api/.env con tus credenciales de RDS y S3."
echo "Comando: nano /home/ubuntu/stays-api/.env"
echo "Luego, reinicia PM2 con: pm2 restart stays-api"
