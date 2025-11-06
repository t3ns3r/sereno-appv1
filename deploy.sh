#!/bin/bash

# Script de despliegue para Hostinger
echo "🚀 Iniciando despliegue de SERENO..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

log "Instalando dependencias del backend..."
npm install

log "Instalando dependencias del frontend..."
cd frontend
npm install
cd ..

log "Compilando TypeScript..."
npm run build

log "Construyendo frontend..."
cd frontend
npm run build
cd ..

log "Generando cliente Prisma..."
npx prisma generate

log "Creando archivo de configuración para producción..."
cp .env.production .env.example

log "Creando paquete para despliegue..."
mkdir -p deploy-package

# Copiar archivos necesarios
cp -r dist deploy-package/
cp -r frontend/dist deploy-package/frontend-dist
cp -r prisma deploy-package/
cp package.json deploy-package/
cp .env.example deploy-package/
cp ecosystem.config.js deploy-package/ 2>/dev/null || true

# Crear archivo de instrucciones
cat > deploy-package/INSTRUCCIONES.md << 'EOF'
# Instrucciones de Despliegue

## En tu servidor Hostinger:

1. Sube esta carpeta a /var/www/sereno/
2. Copia .env.example a .env y configura tus datos
3. Ejecuta: npm install --production
4. Ejecuta: npx prisma migrate deploy
5. Ejecuta: pm2 start ecosystem.config.js

## Variables importantes a configurar en .env:
- DATABASE_URL (datos de tu base de datos Hostinger)
- JWT_SECRET (clave secreta segura)
- FRONTEND_URL (tu dominio)
EOF

log "Paquete de despliegue creado en: deploy-package/"
log "Sube esta carpeta a tu servidor Hostinger"

warn "No olvides:"
warn "1. Configurar la base de datos en Hostinger"
warn "2. Actualizar las variables de entorno en .env"
warn "3. Configurar tu dominio para apuntar al servidor"

log "✅ Preparación completada!"