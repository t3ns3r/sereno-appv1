import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleContent = [
  {
    title: "Entendiendo la Ansiedad: Una Guía Básica",
    description: "Aprende qué es la ansiedad, sus síntomas y cómo reconocerla en tu vida diaria.",
    content: `La ansiedad es una respuesta natural del cuerpo ante situaciones de estrés o peligro percibido. Es normal sentir ansiedad ocasionalmente, pero cuando se vuelve persistente e interfiere con las actividades diarias, puede ser un trastorno de ansiedad.

## Síntomas Comunes de la Ansiedad

### Síntomas Físicos:
- Palpitaciones o ritmo cardíaco acelerado
- Sudoración excesiva
- Temblores o sacudidas
- Sensación de falta de aire
- Dolor en el pecho
- Náuseas o malestar estomacal
- Mareos o sensación de desmayo
- Escalofríos o sofocos

### Síntomas Emocionales:
- Preocupación excesiva
- Miedo intenso
- Sensación de peligro inminente
- Irritabilidad
- Dificultad para concentrarse
- Sensación de estar "en el límite"

### Síntomas Conductuales:
- Evitar situaciones que causan ansiedad
- Inquietud o agitación
- Dificultad para relajarse
- Problemas para dormir

## Tipos de Trastornos de Ansiedad

1. **Trastorno de Ansiedad Generalizada (TAG)**: Preocupación excesiva sobre múltiples aspectos de la vida.
2. **Trastorno de Pánico**: Ataques de pánico recurrentes e inesperados.
3. **Fobias Específicas**: Miedo intenso a objetos o situaciones específicas.
4. **Trastorno de Ansiedad Social**: Miedo intenso a situaciones sociales.
5. **Agorafobia**: Miedo a lugares o situaciones donde escapar podría ser difícil.

## Estrategias de Manejo

### Técnicas de Respiración:
- Respiración profunda y lenta
- Técnica 4-7-8: inhala 4, mantén 7, exhala 8
- Respiración diafragmática

### Técnicas de Relajación:
- Relajación muscular progresiva
- Meditación mindfulness
- Visualización guiada

### Cambios en el Estilo de Vida:
- Ejercicio regular
- Dieta equilibrada
- Sueño adecuado
- Limitar cafeína y alcohol
- Técnicas de manejo del estrés

## Cuándo Buscar Ayuda Profesional

Es importante buscar ayuda cuando:
- La ansiedad interfiere con el trabajo, escuela o relaciones
- Evitas actividades importantes debido a la ansiedad
- Experimentas ataques de pánico frecuentes
- Usas alcohol o drogas para lidiar con la ansiedad
- Tienes pensamientos de autolesión

Recuerda que la ansiedad es tratable y hay muchas opciones efectivas disponibles, incluyendo terapia, medicación y técnicas de autoayuda.`,
    category: 'ARTICLE',
    mentalHealthConditions: ['ansiedad', 'estres'],
    difficulty: 'BEGINNER',
    duration: 15,
    tags: ['ansiedad', 'síntomas', 'manejo', 'respiración']
  },
  {
    title: "Ejercicio de Respiración 4-7-8 para la Calma",
    description: "Una técnica simple pero poderosa para reducir la ansiedad y promover la relajación.",
    content: `El ejercicio de respiración 4-7-8 es una técnica desarrollada por el Dr. Andrew Weil que puede ayudar a reducir la ansiedad y promover la relajación.

## Cómo Realizar el Ejercicio 4-7-8

### Preparación:
1. Siéntate cómodamente con la espalda recta
2. Coloca la punta de tu lengua contra el tejido detrás de tus dientes frontales superiores
3. Exhala completamente por la boca, haciendo un sonido "whoosh"

### El Ejercicio:
1. **Inhala por la nariz durante 4 segundos**
   - Cierra la boca e inhala silenciosamente por la nariz
   - Cuenta mentalmente hasta 4

2. **Mantén la respiración durante 7 segundos**
   - Retén el aire en tus pulmones
   - Cuenta mentalmente hasta 7

3. **Exhala por la boca durante 8 segundos**
   - Exhala completamente por la boca haciendo el sonido "whoosh"
   - Cuenta mentalmente hasta 8

### Repetición:
- Repite el ciclo 3-4 veces inicialmente
- Con la práctica, puedes aumentar hasta 8 ciclos
- Practica al menos dos veces al día

## Beneficios del Ejercicio 4-7-8

- **Reduce la ansiedad**: Activa el sistema nervioso parasimpático
- **Mejora el sueño**: Ayuda a conciliar el sueño más rápidamente
- **Controla los antojos**: Puede ayudar a manejar los impulsos
- **Maneja la ira**: Proporciona una pausa para calmarse
- **Reduce la presión arterial**: Promueve la relajación cardiovascular

## Consejos para la Práctica

### Para Principiantes:
- Comienza con 3-4 ciclos
- No te preocupes si te sientes un poco mareado al principio
- La práctica regular mejora los resultados
- Mantén la proporción 4:7:8 incluso si necesitas ir más lento

### Cuándo Practicar:
- **Mañana**: Para comenzar el día con calma
- **Antes de dormir**: Para mejorar la calidad del sueño
- **Momentos de estrés**: Para manejar situaciones difíciles
- **Antes de eventos importantes**: Para reducir la ansiedad anticipatoria

## Precauciones

- No practiques más de 8 ciclos seguidos inicialmente
- Si tienes problemas respiratorios, consulta con un médico
- Detente si sientes mareos excesivos
- La práctica regular es más importante que la duración

## Variaciones

### Para Niños:
- Usa conteos más cortos: 2-3-4
- Hazlo divertido con visualizaciones
- Practica juntos como familia

### Para Situaciones de Emergencia:
- Incluso 1-2 ciclos pueden ayudar
- Enfócate en la exhalación larga
- Combina con afirmaciones positivas

Recuerda que como cualquier habilidad, la respiración 4-7-8 mejora con la práctica. Sé paciente contigo mismo y practica regularmente para obtener los mejores resultados.`,
    category: 'EXERCISE',
    mentalHealthConditions: ['ansiedad', 'estres', 'mindfulness'],
    difficulty: 'BEGINNER',
    duration: 10,
    tags: ['respiración', 'relajación', 'técnica', 'calma']
  },
  {
    title: "Mindfulness: Vivir en el Presente",
    description: "Descubre cómo la práctica del mindfulness puede transformar tu relación con los pensamientos y emociones.",
    content: `El mindfulness, o atención plena, es la práctica de prestar atención al momento presente de manera intencional y sin juicio. Esta antigua práctica, respaldada por la ciencia moderna, puede transformar significativamente tu bienestar mental.

## ¿Qué es el Mindfulness?

El mindfulness implica:
- **Atención consciente**: Dirigir la atención al momento presente
- **Observación sin juicio**: Notar pensamientos y emociones sin etiquetarlos como "buenos" o "malos"
- **Aceptación**: Permitir que las experiencias sean como son
- **Presencia**: Estar completamente aquí y ahora

## Beneficios Científicamente Comprobados

### Beneficios Mentales:
- Reducción del estrés y la ansiedad
- Mejora del estado de ánimo
- Mayor capacidad de concentración
- Reducción de pensamientos rumiativos
- Mejor regulación emocional

### Beneficios Físicos:
- Reducción de la presión arterial
- Mejora del sistema inmunológico
- Mejor calidad del sueño
- Reducción del dolor crónico
- Menor inflamación

### Beneficios Sociales:
- Mayor empatía y compasión
- Mejores relaciones interpersonales
- Comunicación más efectiva
- Reducción de la reactividad

## Prácticas Básicas de Mindfulness

### 1. Meditación de Respiración
- Siéntate cómodamente
- Enfócate en tu respiración natural
- Cuando la mente divague, regresa gentilmente a la respiración
- Comienza con 5-10 minutos diarios

### 2. Escaneo Corporal
- Acuéstate cómodamente
- Dirige la atención a diferentes partes del cuerpo
- Nota sensaciones sin tratar de cambiarlas
- Practica por 15-30 minutos

### 3. Mindfulness en Actividades Diarias
- **Comer consciente**: Presta atención a sabores, texturas y olores
- **Caminar consciente**: Nota cada paso y las sensaciones del movimiento
- **Escuchar consciente**: Enfócate completamente en los sonidos

### 4. Observación de Pensamientos
- Siéntate en silencio
- Observa tus pensamientos como nubes que pasan
- No te enganches con el contenido
- Simplemente nota y deja ir

## Técnicas para Principiantes

### La Técnica STOP:
- **S**top (Para): Detén lo que estás haciendo
- **T**ake a breath (Respira): Toma una respiración consciente
- **O**bserve (Observa): Nota qué está pasando en tu mente y cuerpo
- **P**roceed (Continúa): Sigue con intención renovada

### Anclas de Mindfulness:
- **Respiración**: Siempre disponible como punto de enfoque
- **Sensaciones físicas**: Pies en el suelo, manos en el regazo
- **Sonidos**: Usa sonidos ambientales como ancla
- **Visuales**: Enfócate en un objeto específico

## Superando Obstáculos Comunes

### "No puedo parar de pensar"
- Es normal que la mente piense
- El objetivo no es detener los pensamientos
- Simplemente nota cuando la mente divaga y regresa

### "No tengo tiempo"
- Comienza con 2-3 minutos
- Integra mindfulness en actividades existentes
- La consistencia es más importante que la duración

### "Me siento inquieto"
- Prueba mindfulness en movimiento
- Usa técnicas de respiración
- Acepta la inquietud como parte de la experiencia

## Integrando Mindfulness en la Vida Diaria

### Rutinas Matutinas:
- Despierta con 5 minutos de respiración consciente
- Practica mindfulness mientras te preparas
- Establece intenciones para el día

### Durante el Trabajo:
- Toma pausas conscientes cada hora
- Practica respiración antes de reuniones
- Come el almuerzo sin distracciones

### Rutinas Nocturnas:
- Reflexiona sobre el día con compasión
- Practica gratitud consciente
- Usa técnicas de relajación para dormir

## Desarrollando una Práctica Sostenible

### Semana 1-2: Establecer el Hábito
- 5 minutos diarios de meditación
- Una actividad diaria consciente
- Usar recordatorios o aplicaciones

### Semana 3-4: Expandir la Práctica
- Aumentar a 10-15 minutos
- Agregar escaneo corporal
- Practicar mindfulness en situaciones desafiantes

### Mes 2 en adelante: Profundizar
- Explorar diferentes técnicas
- Unirse a grupos de práctica
- Considerar retiros o cursos

El mindfulness es un viaje, no un destino. Cada momento de práctica es valioso, sin importar cuán "exitoso" te sientas. La clave está en la gentileza contigo mismo y la práctica consistente.`,
    category: 'ARTICLE',
    mentalHealthConditions: ['mindfulness', 'ansiedad', 'estres', 'depresion'],
    difficulty: 'INTERMEDIATE',
    duration: 25,
    tags: ['mindfulness', 'meditación', 'presente', 'consciencia']
  },
  {
    title: "Construyendo Autoestima Saludable",
    description: "Estrategias prácticas para desarrollar una autoestima sólida y duradera.",
    content: `La autoestima es la valoración que tenemos de nosotros mismos. Una autoestima saludable es fundamental para el bienestar mental y emocional, influyendo en nuestras decisiones, relaciones y calidad de vida.

## Entendiendo la Autoestima

### ¿Qué es la Autoestima?
La autoestima incluye:
- **Autoaceptación**: Aceptar tanto fortalezas como debilidades
- **Autorespeto**: Tratarse con dignidad y consideración
- **Autoconfianza**: Creer en las propias capacidades
- **Autovalía**: Sentirse merecedor de amor y respeto

### Signos de Autoestima Saludable:
- Aceptar cumplidos genuinamente
- Expresar necesidades y opiniones
- Manejar críticas constructivamente
- Tomar decisiones independientes
- Mantener límites saludables
- Aprender de los errores sin autocastigo

### Signos de Baja Autoestima:
- Autocrítica excesiva
- Miedo al rechazo o fracaso
- Dificultad para tomar decisiones
- Comparación constante con otros
- Buscar aprobación externa constantemente
- Evitar desafíos o nuevas experiencias

## Factores que Influyen en la Autoestima

### Factores Internos:
- **Diálogo interno**: Los pensamientos sobre uno mismo
- **Perfeccionismo**: Estándares irrealmente altos
- **Comparaciones**: Medirse constantemente contra otros
- **Experiencias pasadas**: Traumas o críticas recibidas

### Factores Externos:
- **Relaciones**: Apoyo o crítica de otros significativos
- **Logros**: Éxitos y fracasos percibidos
- **Medios de comunicación**: Imágenes idealizadas
- **Cultura**: Valores y expectativas sociales

## Estrategias para Construir Autoestima

### 1. Desarrollar Autoconciencia

#### Identificar Pensamientos Negativos:
- Nota patrones de autocrítica
- Cuestiona pensamientos automáticos
- Identifica distorsiones cognitivas
- Lleva un diario de pensamientos

#### Reconocer Fortalezas:
- Haz una lista de tus cualidades positivas
- Pide feedback a personas de confianza
- Celebra pequeños logros diarios
- Recuerda éxitos pasados

### 2. Cambiar el Diálogo Interno

#### Técnicas de Reestructuración Cognitiva:
- **Cuestionar evidencia**: ¿Es este pensamiento realmente cierto?
- **Buscar alternativas**: ¿Hay otras formas de ver esto?
- **Usar compasión**: ¿Qué le dirías a un amigo en esta situación?
- **Enfocarse en hechos**: Separar hechos de interpretaciones

#### Afirmaciones Positivas Efectivas:
- Basadas en realidad, no fantasía
- Específicas y personales
- En presente, no futuro
- Enfocadas en el proceso, no solo resultados

### 3. Establecer y Lograr Metas

#### Metas SMART para Autoestima:
- **Específicas**: Claramente definidas
- **Medibles**: Con criterios de éxito
- **Alcanzables**: Realistas y posibles
- **Relevantes**: Importantes para ti
- **Temporales**: Con plazos definidos

#### Pasos para el Éxito:
1. Comienza con metas pequeñas
2. Divide metas grandes en pasos manejables
3. Celebra el progreso, no solo el resultado final
4. Aprende de los contratiempos sin autocastigo
5. Ajusta metas según sea necesario

### 4. Cuidado Personal y Autocuidado

#### Cuidado Físico:
- Ejercicio regular adaptado a tus capacidades
- Alimentación nutritiva y equilibrada
- Sueño adecuado y reparador
- Higiene personal como acto de autorrespeto

#### Cuidado Emocional:
- Practicar mindfulness y meditación
- Expresar emociones de manera saludable
- Buscar apoyo cuando sea necesario
- Establecer límites en relaciones

#### Cuidado Mental:
- Aprender nuevas habilidades
- Leer y educarse continuamente
- Practicar creatividad y hobbies
- Desafiar la mente con nuevas experiencias

### 5. Construir Relaciones Saludables

#### Identificar Relaciones Tóxicas:
- Personas que constantemente critican
- Relaciones unidireccionales
- Manipulación o control excesivo
- Falta de respeto por límites

#### Cultivar Relaciones Positivas:
- Buscar personas que te apoyen
- Practicar comunicación asertiva
- Ofrecer apoyo a otros
- Establecer límites claros y saludables

## Ejercicios Prácticos para la Autoestima

### Ejercicio 1: Diario de Logros
- Escribe 3 cosas que hiciste bien cada día
- Incluye tanto grandes como pequeños logros
- Nota cómo te sentiste al lograrlos
- Revisa semanalmente para ver patrones

### Ejercicio 2: Carta de Compasión
- Escribe una carta a ti mismo desde la perspectiva de un amigo amoroso
- Incluye reconocimiento de luchas y fortalezas
- Ofrece palabras de aliento y apoyo
- Lee la carta cuando necesites recordar tu valor

### Ejercicio 3: Desafío de Comparaciones
- Nota cuando te comparas con otros
- Pregúntate: "¿Esta comparación me ayuda o me lastima?"
- Redirige la atención a tu propio progreso
- Practica gratitud por tu situación única

### Ejercicio 4: Círculo de Fortalezas
- Dibuja un círculo y divídelo en secciones
- En cada sección, escribe una fortaleza personal
- Incluye habilidades, cualidades y logros
- Agrega nuevas fortalezas según las descubras

## Manteniendo la Autoestima a Largo Plazo

### Práctica Diaria:
- Momentos de autorreflexión positiva
- Celebración de pequeños éxitos
- Práctica de autocompasión
- Cuidado personal consistente

### Revisión Regular:
- Evalúa el progreso mensualmente
- Ajusta estrategias según sea necesario
- Busca apoyo profesional si es necesario
- Mantén un enfoque de crecimiento continuo

### Enfrentando Recaídas:
- Reconoce que los altibajos son normales
- Usa herramientas aprendidas durante momentos difíciles
- Busca apoyo de tu red de personas de confianza
- Recuerda que el progreso no siempre es lineal

Construir autoestima saludable es un proceso continuo que requiere paciencia, práctica y autocompasión. Cada pequeño paso cuenta y contribuye a una base sólida de autovalía y confianza.`,
    category: 'ARTICLE',
    mentalHealthConditions: ['autoestima', 'depresion', 'ansiedad'],
    difficulty: 'INTERMEDIATE',
    duration: 30,
    tags: ['autoestima', 'confianza', 'autocuidado', 'crecimiento personal']
  }
];

async function seedEducationalContent() {
  try {
    console.log('Starting to seed educational content...');

    // First, we need to find or create an admin user to be the author
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      // Create a default admin user for content authoring
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@sereno.app',
          username: 'admin_sereno',
          password: 'hashed_password_placeholder', // In real app, this would be properly hashed
          country: 'ES',
          role: 'ADMIN',
          profile: {
            create: {
              firstName: 'Equipo',
              lastName: 'SERENO',
              preferences: {}
            }
          }
        }
      });
    }

    // Create educational content
    for (const content of sampleContent) {
      const createdContent = await prisma.educationalContent.create({
        data: {
          ...content,
          authorId: adminUser.id,
          isPublished: true
        }
      });
      console.log(`Created content: ${createdContent.title}`);
    }

    console.log('Educational content seeded successfully!');
  } catch (error) {
    console.error('Error seeding educational content:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedEducationalContent();
}

export { seedEducationalContent };