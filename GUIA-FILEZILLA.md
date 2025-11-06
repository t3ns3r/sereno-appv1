# 📁 Despliegue con FileZilla + SSH en Hostinger VPS

## PASO 1: Configurar FileZilla

### 1.1 Obtener datos de conexión de Hostinger:
1. Ve a tu panel de Hostinger
2. Busca tu VPS
3. Anota estos datos:
   - **Host/IP**: `XXX.XXX.XXX.XXX`
   - **Usuario**: `root` (o el que te dieron)
   - **Contraseña**: tu contraseña del VPS
   - **Puerto**: `22` (SSH/SFTP)

### 1.2 Configurar conexión en FileZilla:
1. Abre FileZilla
2. Ve a **Archivo > Gestor de sitios**
3. Clic en **Nuevo sitio**
4. Configura:
   - **Protocolo**: `SFTP - SSH File Transfer Protocol`
   - **Servidor**: `TU-IP-DEL-VPS`
   - **Puerto**: `22`
   - **Tipo de acceso**: `Normal`
   - **Usuario**: `root`
   - **Contraseña**: `tu-contraseña-vps`
5. Clic en **Conectar**

## PASO 2: Preparar archivos en tu computadora

### 2.1 Crear carpeta de despliegue:
```
📁 sereno-deploy/
├── 📄 Dockerfile
├── 📄 docker-compose.yml
├── 📄 .env.docker
├── 📄 deploy-docker.sh
├── 📄 init-db.sql
├── 📄 package.json
├── 📄 tsconfig.json
├── 📁 src/
├── 📁 frontend/
├── 📁 prisma/
├── 📁 nginx/
│   ├── 📄 nginx.conf
│   └── 📄 default.conf
└── 📄 .dockerignore
```

### 2.2 Verificar que tienes todos los archivos Docker:
- ✅ Dockerfile
- ✅ docker-compose.yml  
- ✅ .env.docker
- ✅ deploy-docker.sh
- ✅ nginx/default.conf
- ✅ nginx/nginx.conf
- ✅ init-db.sql

## PASO 3: Subir archivos con FileZilla

### 3.1 Crear directorio en el servidor:
1. En FileZilla, lado derecho (servidor), navega a `/var/www/`
2. Clic derecho > **Crear directorio** > `sereno`
3. Entra al directorio `sereno`

### 3.2 Subir todos los archivos:
1. En el lado izquierdo (local), navega a tu carpeta del proyecto
2. Selecciona TODOS los archivos y carpetas
3. Arrastra al lado derecho (servidor) en `/var/www/sereno/`
4. Espera a que termine la transferencia

## PASO 4: Conectar por SSH para ejecutar comandos

### 4.1 Usar PuTTY (Windows):
1. Descarga PuTTY si no lo tienes
2. Abre PuTTY
3. Configura:
   - **Host Name**: `TU-IP-DEL-VPS`
   - **Port**: `22`
   - **Connection type**: `SSH`
4. Clic **Open**
5. Login: `root`
6. Password: `tu-contraseña-vps`

### 4.2 O usar Git Bash (si lo tienes):
```bash
ssh root@TU-IP-DEL-VPS
```

## PASO 5: Instalar Docker en el VPS

### 5.1 Una vez conectado por SSH, ejecutar:
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

## PASO 6: Configurar y desplegar

### 6.1 Ir al directorio del proyecto:
```bash
cd /var/www/sereno
```

### 6.2 Verificar que los archivos están ahí:
```bash
ls -la
# Deberías ver todos tus archivos
```

### 6.3 Configurar variables de entorno:
```bash
# Copiar plantilla
cp .env.docker .env

# Editar configuración (usar nano o vi)
nano .env
```

### 6.4 Configurar .env (presiona las teclas como se indica):
```env
# CAMBIAR ESTOS VALORES:
DB_PASSWORD=MiPasswordSeguro123!
REDIS_PASSWORD=MiRedisPassword123!
JWT_SECRET=mi-jwt-secret-super-seguro-de-64-caracteres-minimo-para-produccion-2024

# Tu dominio o IP
FRONTEND_URL=http://TU-IP-DEL-VPS
```

**Para guardar en nano:**
- Presiona `Ctrl + X`
- Presiona `Y` (Yes)
- Presiona `Enter`

### 6.5 Hacer ejecutable el script y desplegar:
```bash
# Hacer ejecutable
chmod +x deploy-docker.sh

# Ejecutar despliegue
./deploy-docker.sh
```

## PASO 7: Verificar que funciona

### 7.1 Ver estado de servicios:
```bash
docker-compose ps
```

### 7.2 Ver logs si hay problemas:
```bash
docker-compose logs -f
```

### 7.3 Acceder a tu aplicación:
- Abre navegador: `http://TU-IP-DEL-VPS`

## COMANDOS ÚTILES

### Ver logs en tiempo real:
```bash
cd /var/www/sereno
docker-compose logs -f app
```

### Reiniciar servicios:
```bash
docker-compose restart
```

### Parar servicios:
```bash
docker-compose down
```

### Actualizar aplicación (después de subir nuevos archivos):
```bash
docker-compose up -d --build
```

## SOLUCIÓN DE PROBLEMAS

### Si FileZilla no conecta:
1. Verifica IP, usuario y contraseña
2. Asegúrate de usar protocolo SFTP
3. Verifica que el puerto 22 esté abierto

### Si Docker no instala:
```bash
# Intentar con snap
apt install snapd
snap install docker

# O instalar manualmente
apt install docker.io docker-compose
```

### Si la aplicación no carga:
```bash
# Verificar puertos
netstat -tlnp | grep :80
netstat -tlnp | grep :3001

# Verificar firewall
ufw status
ufw allow 80
ufw allow 443
```

## CONFIGURAR DOMINIO (OPCIONAL)

### Si tienes un dominio:
```bash
# Instalar Certbot para SSL
apt install certbot python3-certbot-nginx -y

# Obtener certificado
certbot --nginx -d tu-dominio.com

# Actualizar .env con tu dominio
nano .env
# Cambiar: FRONTEND_URL=https://tu-dominio.com
```

## ACCESO FINAL

Una vez completado:
- **Tu aplicación**: http://TU-IP-DEL-VPS
- **API**: http://TU-IP-DEL-VPS/api/v1
- **Con dominio**: https://tu-dominio.com