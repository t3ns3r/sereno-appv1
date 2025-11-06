#!/bin/bash

# Script de despliegue con Docker para Hostinger VPS
set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
info() { echo -e "${BLUE}[DEPLOY]${NC} $1"; }

info "🚀 Iniciando despliegue de SERENO con Docker..."

# Verificar que Docker está instalado
if ! command -v docker &> /dev/null; then
    error "Docker no está instalado. Instálalo primero."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose no está instalado. Instálalo primero."
    exit 1
fi

# Crear directorios necesarios
log "Creando directorios necesarios..."
mkdir -p logs ssl nginx

# Configurar variables de entorno
if [ ! -f .env ]; then
    log "Creando archivo .env desde plantilla..."
    cp .env.docker .env
    warn "⚠️  IMPORTANTE: Edita el archivo .env con tus configuraciones reales"
    warn "   - Cambia las contraseñas por valores seguros"
    warn "   - Configura tu dominio en FRONTEND_URL"
    warn "   - Actualiza JWT_SECRET con una clave segura"
fi

# Construir y levantar servicios
log "Construyendo imágenes Docker..."
docker-compose build --no-cache

log "Iniciando servicios..."
docker-compose up -d

# Esperar a que la base de datos esté lista
log "Esperando a que la base de datos esté lista..."
sleep 10

# Ejecutar migraciones
log "Ejecutando migraciones de base de datos..."
docker-compose exec -T app npx prisma migrate deploy

# Verificar que todo esté funcionando
log "Verificando servicios..."
sleep 5

if docker-compose ps | grep -q "Up"; then
    info "✅ Servicios iniciados correctamente!"
    
    log "Estado de los servicios:"
    docker-compose ps
    
    log ""
    log "🌐 Tu aplicación está disponible en:"
    log "   Frontend: http://tu-servidor-ip"
    log "   API: http://tu-servidor-ip/api/v1"
    log ""
    log "📊 Comandos útiles:"
    log "   Ver logs: docker-compose logs -f"
    log "   Reiniciar: docker-compose restart"
    log "   Parar: docker-compose down"
    log "   Actualizar: git pull && docker-compose up -d --build"
    
else
    error "❌ Algunos servicios no se iniciaron correctamente"
    log "Verificando logs..."
    docker-compose logs
    exit 1
fi

info "🎉 ¡Despliegue completado exitosamente!"