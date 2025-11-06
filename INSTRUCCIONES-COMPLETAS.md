# 🚀 Guía Completa de Despliegue en Hostinger VPS

## PASO 1: En tu computadora (Windows)

### 1.1 Preparar archivos
```cmd
# Ir a la carpeta de tu proyecto
cd "C:\Users\ARodriguez\Desktop\ElMenteAlista\SERENO v1.0"

# Crear ZIP con todos los archivos
# Incluir: todos los archivos del proyecto + los nuevos archivos Docker
```

### 1.2 Archivos que debes tener:
- ✅ Dockerfile
- ✅ docker-compose.yml
- ✅ .env.docker
- ✅ deploy-docker.sh
- ✅ nginx/default.conf
- ✅ nginx/nginx.conf
- ✅ init-db.sql
- ✅ Todo tu código fuente

## PASO 2: Obtener datos de tu VPS Hostinger

### 2.1 En el panel de Hostinger:
1. Ve a "VPS" en tu panel
2. Busca los datos de conexión SSH:
   - IP del servidor: `XXX.XXX.XXX.XXX`
   - Usuario: `root` (o el que te dieron)
   - Contraseña: (la que configuraste)

## PASO 3: Conectar y configurar el VPS

### 3.1 Conectar por SSH
```bash
# Desde tu computadora (usar Git Bash, WSL, o PuTTY)
ssh root@TU-IP-DEL-VPS
```

### 3.2 Instalar Docker en el VPS
```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker --version
docker-compose --version
```

### 3.3 Subir archivos al VPS
```bash
# Opción A: Usar SCP desde tu computadora
scp -r "SERENO v1.0"/* root@TU-IP:/var/www/sereno/

# Opción B: Usar Git (si tienes repositorio)
cd /var/www
git clone https://github.com/tu-usuario/sereno.git

# Opción C: Subir ZIP y extraer
# 1. Sube el ZIP por SFTP/Panel de Hostinger
# 2. En el VPS:
cd /var/www
unzip sereno.zip
mv "SERENO v1.0" sereno
```

## PASO 4: Configurar y desplegar

### 4.1 Ir al directorio del proyecto
```bash
cd /var/www/sereno
```

### 4.2 Configurar variables de entorno
```bash
# Copiar plantilla
cp .env.docker .env

# Editar configuración
nano .env
```

### 4.3 Configurar .env con tus datos:
```env
# CAMBIAR ESTOS VALORES POR SEGUROS
DB_PASSWORD=TuPasswordSeguro123!
REDIS_PASSWORD=TuRedisPassword123!
JWT_SECRET=tu-jwt-secret-super-seguro-de-64-caracteres-minimo-para-produccion-2024

# Tu dominio
FRONTEND_URL=https://tu-dominio.com

# El resto se configura automáticamente
```

### 4.4 Ejecutar despliegue
```bash
# Hacer ejecutable el script
chmod +x deploy-docker.sh

# Ejecutar despliegue
./deploy-docker.sh
```

## PASO 5: Configurar dominio (opcional)

### 5.1 Si tienes dominio propio:
```bash
# Instalar Certbot para SSL
apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
certbot --nginx -d tu-dominio.com
```

### 5.2 Configurar DNS:
- En tu proveedor de dominio, apunta el DNS a la IP de tu VPS

## COMANDOS ÚTILES POST-DESPLIEGUE

### Ver estado de servicios:
```bash
cd /var/www/sereno
docker-compose ps
```

### Ver logs:
```bash
# Todos los servicios
docker-compose logs -f

# Solo la aplicación
docker-compose logs -f app

# Solo la base de datos
docker-compose logs -f postgres
```

### Reiniciar servicios:
```bash
# Reiniciar todo
docker-compose restart

# Solo la aplicación
docker-compose restart app
```

### Actualizar aplicación:
```bash
# Si usas Git
git pull
docker-compose up -d --build

# Si subes archivos manualmente
# 1. Sube nuevos archivos
# 2. Ejecuta:
docker-compose up -d --build
```

### Parar servicios:
```bash
docker-compose down
```

### Ver uso de recursos:
```bash
docker stats
```

## SOLUCIÓN DE PROBLEMAS

### Si algo no funciona:
```bash
# Ver logs detallados
docker-compose logs

# Verificar que los puertos estén abiertos
netstat -tlnp | grep :80
netstat -tlnp | grep :3001

# Reiniciar Docker
systemctl restart docker
```

### Si necesitas acceso a la base de datos:
```bash
# Conectar a PostgreSQL
docker-compose exec postgres psql -U sereno_user -d sereno_db
```

## ACCESO A TU APLICACIÓN

Una vez desplegado:
- **Frontend**: http://TU-IP-DEL-VPS
- **API**: http://TU-IP-DEL-VPS/api/v1
- **Con dominio**: https://tu-dominio.com

## SEGURIDAD ADICIONAL

### Configurar firewall:
```bash
# Instalar UFW
apt install ufw -y

# Configurar reglas
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw enable
```

### Cambiar puerto SSH (recomendado):
```bash
# Editar configuración SSH
nano /etc/ssh/sshd_config
# Cambiar: Port 22 por Port 2222
systemctl restart ssh

# Actualizar firewall
ufw allow 2222
ufw delete allow ssh
```