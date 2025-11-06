# 🚀 Guía de Despliegue en Hostinger

## Opción A: Hostinger VPS Cloud (Recomendado)

### 1. Conectar por SSH a tu VPS
```bash
ssh root@tu-ip-del-vps
# O usando el usuario que te proporcionó Hostinger
```

### 2. Instalar dependencias del sistema
```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Instalar PostgreSQL
apt install postgresql postgresql-contrib -y

# Instalar PM2 para gestión de procesos
npm install -g pm2

# Instalar Nginx
apt install nginx -y
```

### 3. Configurar PostgreSQL
```bash
# Cambiar a usuario postgres
sudo -u postgres psql

# Crear base de datos y usuario
CREATE DATABASE sereno_db;
CREATE USER sereno_user WITH ENCRYPTED PASSWORD 'password_seguro_123';
GRANT ALL PRIVILEGES ON DATABASE sereno_db TO sereno_user;
ALTER USER sereno_user CREATEDB;
\q
```

### 4. Subir archivos al servidor
```bash
# Crear directorio
mkdir -p /var/www/sereno

# Desde tu computadora local, subir archivos:
scp -r "SERENO v1.0"/* root@tu-ip:/var/www/sereno/
```

### 5. Configurar aplicación en el servidor
```bash
cd /var/www/sereno

# Instalar dependencias backend
npm install

# Instalar dependencias frontend
cd frontend
npm install
cd ..

# Copiar archivo de configuración
cp .env.production .env
nano .env  # Editar con datos reales

# Generar cliente Prisma
npx prisma generate

# Compilar TypeScript
npm run build

# Construir frontend
cd frontend && npm run build && cd ..

# Ejecutar migraciones
npx prisma migrate deploy
```

### 6. Configurar PM2
```bash
# Crear archivo de configuración PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'sereno-app',
    script: 'dist/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
EOF

# Iniciar aplicación
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 7. Configurar Nginx
```bash
# Crear configuración de Nginx
cat > /etc/nginx/sites-available/sereno << 'EOF'
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Servir archivos estáticos del frontend
    location / {
        root /var/www/sereno/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# Activar sitio
ln -s /etc/nginx/sites-available/sereno /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## Opción B: Hostinger Cloud Hosting (Más fácil)

Si tienes Cloud Hosting con soporte Node.js:

### 1. Preparar archivos localmente
```bash
# Construir frontend
cd frontend
npm run build
cd ..

# Compilar backend
npm run build

# Crear archivo ZIP con:
# - dist/ (backend compilado)
# - frontend/dist/ (frontend compilado)
# - package.json
# - .env (configurado)
# - prisma/
```

### 2. Subir por Panel de Control
1. Accede al panel de Hostinger
2. Ve a "File Manager" o "Administrador de archivos"
3. Sube el ZIP y extráelo
4. Configura las variables de entorno en el panel

### 3. Configurar Base de Datos
1. En el panel de Hostinger, crea una base de datos MySQL/PostgreSQL
2. Anota los datos de conexión
3. Actualiza el DATABASE_URL en .env

## Comandos útiles post-despliegue

```bash
# Ver logs
pm2 logs sereno-app

# Reiniciar aplicación
pm2 restart sereno-app

# Actualizar aplicación
cd /var/www/sereno
git pull  # Si usas Git
npm install
npm run build
cd frontend && npm run build && cd ..
npx prisma migrate deploy
pm2 restart sereno-app
```

## Configurar SSL (HTTPS)

```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Renovación automática
crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```