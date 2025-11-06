# 🌐 Despliegue en Hosting Compartido de Hostinger

## ¿Qué puedes hacer con hosting compartido?

En hosting compartido **NO puedes**:
- ❌ Ejecutar Node.js backend
- ❌ Usar Docker
- ❌ Instalar dependencias del servidor
- ❌ Usar bases de datos PostgreSQL

En hosting compartido **SÍ puedes**:
- ✅ Subir archivos HTML, CSS, JavaScript estáticos
- ✅ Usar MySQL (si está incluido en tu plan)
- ✅ Usar PHP (si está incluido)

## 🎯 Solución Recomendada: Frontend Estático

Tu aplicación SERENO funciona perfectamente como frontend estático porque:
- ✅ Todas las funcionalidades principales están en el frontend
- ✅ SERENITO funciona completamente
- ✅ Evaluaciones, respiración, seguimiento funcionan
- ✅ No necesita backend para las funciones principales

## 📋 Pasos para Desplegar

### PASO 1: Construir versión estática

En tu computadora:

```cmd
# Ir al directorio frontend
cd frontend

# Instalar dependencias si no están
npm install

# Construir para producción (versión estática)
npm run build
```

### PASO 2: Subir archivos por FileZilla

1. **Conectar FileZilla** a tu hosting compartido
2. **Ir a la carpeta public_html** (o www, o htdocs)
3. **Subir TODO el contenido** de la carpeta `frontend/dist/`
4. **NO subir la carpeta dist**, sino su CONTENIDO

### PASO 3: Configurar dominio

1. En el panel de Hostinger, configura tu dominio
2. Apunta el dominio a la carpeta donde subiste los archivos
3. ¡Listo! Tu aplicación estará en https://tu-dominio.com

## 🎉 Resultado

Tendrás una aplicación completamente funcional con:
- 🤖 SERENITO interactivo
- 🧠 Evaluación de estado de ánimo
- 🫁 Ejercicios de respiración
- 📊 Seguimiento diario
- 👥 Actividades comunitarias (simuladas)
- 📚 Contenido educativo
- 🎨 Interfaz para personas mayores

## 🔄 Limitaciones y Soluciones

### Limitaciones:
- Los datos no se guardan permanentemente (se pierden al recargar)
- No hay usuarios reales (usa usuario simulado)
- No hay backend real

### Soluciones futuras:
1. **Upgrade a VPS**: Para tener backend completo
2. **Usar servicios externos**: Firebase, Supabase para base de datos
3. **Versión híbrida**: Frontend estático + servicios cloud

## 📞 Alternativas si quieres backend

### Opción 1: Upgrade a VPS Hostinger
- Cuesta un poco más
- Tienes control total
- Puedes usar Docker y Node.js

### Opción 2: Servicios gratuitos
- **Frontend**: Netlify, Vercel (gratis)
- **Backend**: Railway, Render (gratis con límites)
- **Base de datos**: Supabase, PlanetScale (gratis)

### Opción 3: Todo en uno
- **Vercel**: Frontend + backend serverless
- **Netlify**: Frontend + funciones serverless

## 🎯 Recomendación

Para empezar: **Usa hosting compartido con frontend estático**
- Es la opción más simple
- Funciona perfectamente para mostrar la aplicación
- Puedes migrar a VPS después si necesitas más funcionalidades