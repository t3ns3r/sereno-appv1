import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SerenitoCharacter from '../components/SERENITO/SerenitoCharacter';
import useSerenito from '../hooks/useSerenito';
import SeniorButton from '../components/UI/SeniorButton';

interface EducationalContent {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'audio' | 'exercise';
  category: 'anxiety' | 'depression' | 'stress' | 'general' | 'techniques';
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: string;
  tips: string[];
  isCompleted: boolean;
}

const educationalContent: EducationalContent[] = [
  {
    id: '1',
    title: 'Entendiendo la Ansiedad',
    description: 'Aprende qué es la ansiedad, sus síntomas y cómo manejarla de manera efectiva.',
    type: 'article',
    category: 'anxiety',
    duration: '5 min',
    difficulty: 'beginner',
    content: `La ansiedad es una respuesta natural del cuerpo ante situaciones que percibimos como amenazantes o estresantes. Es importante entender que sentir ansiedad ocasionalmente es completamente normal.

**¿Qué sucede en nuestro cuerpo?**
Cuando experimentamos ansiedad, nuestro sistema nervioso se activa, preparándonos para "luchar o huir". Esto puede causar síntomas físicos como:
- Corazón acelerado
- Respiración rápida
- Tensión muscular
- Sudoración

**Técnicas para manejar la ansiedad:**
1. **Respiración profunda**: Inhala por 4 segundos, mantén por 4, exhala por 6
2. **Técnica 5-4-3-2-1**: Identifica 5 cosas que ves, 4 que tocas, 3 que escuchas, 2 que hueles, 1 que saboreas
3. **Ejercicio regular**: Ayuda a liberar tensión y produce endorfinas
4. **Mindfulness**: Mantente presente en el momento actual

Recuerda: la ansiedad es tratable y puedes aprender a manejarla efectivamente.`,
    tips: [
      'Practica técnicas de respiración diariamente',
      'Mantén una rutina de ejercicio regular',
      'Limita el consumo de cafeína',
      'Busca apoyo cuando lo necesites'
    ],
    isCompleted: false
  },
  {
    id: '2',
    title: 'Técnicas de Relajación Muscular',
    description: 'Ejercicios prácticos para liberar la tensión física y mental.',
    type: 'exercise',
    category: 'techniques',
    duration: '10 min',
    difficulty: 'beginner',
    content: `La relajación muscular progresiva es una técnica efectiva para reducir el estrés y la ansiedad física.

**Preparación:**
- Encuentra un lugar cómodo y silencioso
- Usa ropa cómoda
- Puedes sentarte o acostarte

**Ejercicio paso a paso:**

1. **Pies y piernas**: Tensa los músculos de los pies por 5 segundos, luego relaja completamente. Siente la diferencia.

2. **Pantorrillas**: Contrae los músculos de las pantorrillas, mantén la tensión, luego relaja.

3. **Muslos**: Tensa los músculos de los muslos, mantén por 5 segundos, relaja.

4. **Abdomen**: Contrae los músculos abdominales, mantén, luego relaja completamente.

5. **Brazos**: Cierra los puños y tensa los brazos, mantén la tensión, luego relaja.

6. **Hombros**: Sube los hombros hacia las orejas, mantén, luego deja que caigan naturalmente.

7. **Cara**: Tensa todos los músculos faciales, mantén, luego relaja completamente.

**Finalización:**
Respira profundamente y disfruta de la sensación de relajación total.`,
    tips: [
      'Practica diariamente para mejores resultados',
      'No fuerces la tensión, debe ser cómoda',
      'Concéntrate en la diferencia entre tensión y relajación',
      'Combina con música relajante si lo deseas'
    ],
    isCompleted: false
  },
  {
    id: '3',
    title: 'Manejo del Estrés Diario',
    description: 'Estrategias prácticas para lidiar con el estrés del día a día.',
    type: 'article',
    category: 'stress',
    duration: '7 min',
    difficulty: 'intermediate',
    content: `El estrés es parte de la vida moderna, pero podemos aprender a manejarlo de manera saludable.

**Identificando el estrés:**
- Síntomas físicos: dolores de cabeza, tensión muscular, fatiga
- Síntomas emocionales: irritabilidad, ansiedad, tristeza
- Síntomas conductuales: cambios en el apetito, problemas de sueño

**Estrategias de manejo:**

**1. Organización y planificación**
- Haz listas de tareas prioritarias
- Divide grandes proyectos en pasos pequeños
- Establece límites realistas

**2. Técnicas de relajación**
- Meditación de 5-10 minutos diarios
- Ejercicios de respiración
- Yoga o estiramientos suaves

**3. Cuidado personal**
- Mantén una rutina de sueño regular
- Come alimentos nutritivos
- Dedica tiempo a actividades que disfrutas

**4. Apoyo social**
- Habla con amigos y familiares
- Únete a grupos de apoyo
- No dudes en buscar ayuda profesional

**Recuerda:** El manejo del estrés es una habilidad que se desarrolla con la práctica.`,
    tips: [
      'Identifica tus principales fuentes de estrés',
      'Desarrolla una rutina de autocuidado',
      'Aprende a decir "no" cuando sea necesario',
      'Celebra los pequeños logros'
    ],
    isCompleted: false
  },
  {
    id: '4',
    title: 'Mindfulness para Principiantes',
    description: 'Introducción a la práctica de la atención plena y sus beneficios.',
    type: 'video',
    category: 'techniques',
    duration: '8 min',
    difficulty: 'beginner',
    content: `El mindfulness o atención plena es la práctica de estar completamente presente en el momento actual.

**¿Qué es el mindfulness?**
Es la capacidad de prestar atención al momento presente con curiosidad y sin juicio. No se trata de vaciar la mente, sino de observar nuestros pensamientos y sensaciones.

**Beneficios del mindfulness:**
- Reduce el estrés y la ansiedad
- Mejora la concentración
- Aumenta la autoconciencia
- Mejora la regulación emocional
- Promueve el bienestar general

**Ejercicio básico de mindfulness:**

**1. Postura cómoda**
Siéntate en una silla con la espalda recta pero relajada.

**2. Respiración consciente**
Enfócate en tu respiración natural. No la cambies, solo obsérvala.

**3. Observa sin juzgar**
Cuando tu mente se distraiga (y lo hará), simplemente nota la distracción y vuelve gentilmente a la respiración.

**4. Practica la paciencia**
No hay una forma "correcta" de meditar. Cada experiencia es válida.

**Empezando tu práctica:**
- Comienza con 3-5 minutos diarios
- Aumenta gradualmente el tiempo
- Sé consistente, mejor poco tiempo diario que mucho tiempo ocasional
- Usa aplicaciones o audios guiados si te ayuda`,
    tips: [
      'La constancia es más importante que la duración',
      'No juzgues tu práctica, cada día es diferente',
      'Puedes practicar mindfulness en actividades diarias',
      'Sé paciente contigo mismo'
    ],
    isCompleted: false
  }
];

const EducationalContentPage: React.FC = () => {
  const navigate = useNavigate();
  const [contents] = useState(educationalContent);
  const [selectedContent, setSelectedContent] = useState<EducationalContent | null>(null);
  const [filter, setFilter] = useState<'all' | 'anxiety' | 'depression' | 'stress' | 'general' | 'techniques'>('all');
  const { interact } = useSerenito();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return '📖';
      case 'video': return '🎥';
      case 'audio': return '🎧';
      case 'exercise': return '🧘';
      default: return '📚';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'article': return 'Artículo';
      case 'video': return 'Video';
      case 'audio': return 'Audio';
      case 'exercise': return 'Ejercicio';
      default: return 'Contenido';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'anxiety': return 'Ansiedad';
      case 'depression': return 'Depresión';
      case 'stress': return 'Estrés';
      case 'general': return 'General';
      case 'techniques': return 'Técnicas';
      default: return 'General';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Principiante';
      case 'intermediate': return 'Intermedio';
      case 'advanced': return 'Avanzado';
      default: return 'Normal';
    }
  };

  const handleComplete = (contentId: string) => {
    setSelectedContent(null);
    interact('task-complete');
  };

  const filteredContents = contents.filter(content => 
    filter === 'all' || content.category === filter
  );

  if (selectedContent) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setSelectedContent(null)}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              ← Volver al contenido
            </button>
            <span className="text-2xl">{getTypeIcon(selectedContent.type)}</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {selectedContent.title}
            </h1>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <span>{getTypeLabel(selectedContent.type)}</span>
              <span>•</span>
              <span>{selectedContent.duration}</span>
              <span>•</span>
              <span className={`px-2 py-1 rounded-full ${getDifficultyColor(selectedContent.difficulty)}`}>
                {getDifficultyLabel(selectedContent.difficulty)}
              </span>
            </div>
          </div>

          <div className="prose max-w-none mb-8">
            <div className="whitespace-pre-line text-gray-700 leading-relaxed">
              {selectedContent.content}
            </div>
          </div>

          {selectedContent.tips.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-blue-800 mb-3">💡 Consejos importantes:</h3>
              <ul className="space-y-2">
                {selectedContent.tips.map((tip, index) => (
                  <li key={index} className="text-blue-700 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <SeniorButton
              variant="primary"
              fullWidth
              onClick={() => handleComplete(selectedContent.id)}
            >
              Marcar como completado
            </SeniorButton>
            
            <SeniorButton
              variant="outline"
              fullWidth
              onClick={() => setSelectedContent(null)}
            >
              Volver
            </SeniorButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <SerenitoCharacter
          expression="thinking"
          size="lg"
          message="El conocimiento es poder. Aprende sobre tu bienestar mental."
          showMessage={true}
          className="mb-6"
        />
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          📚 Contenido Educativo
        </h1>
        <p className="text-lg text-gray-600">
          Aprende sobre salud mental y técnicas de bienestar
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {[
          { key: 'all', label: 'Todo' },
          { key: 'anxiety', label: 'Ansiedad' },
          { key: 'stress', label: 'Estrés' },
          { key: 'techniques', label: 'Técnicas' },
          { key: 'general', label: 'General' }
        ].map((filterOption) => (
          <button
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key as any)}
            className={`
              px-4 py-2 rounded-xl font-medium transition-all duration-300
              ${filter === filterOption.key 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }
            `}
          >
            {filterOption.label}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {filteredContents.map((content) => (
          <div key={content.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getTypeIcon(content.type)}</span>
                <span className="text-sm text-gray-500">{getTypeLabel(content.type)}</span>
              </div>
              
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                {getCategoryLabel(content.category)}
              </span>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {content.title}
            </h3>
            
            <p className="text-gray-600 mb-4">
              {content.description}
            </p>

            <div className="flex items-center justify-between text-sm mb-4">
              <span className="text-gray-500">⏱️ {content.duration}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(content.difficulty)}`}>
                {getDifficultyLabel(content.difficulty)}
              </span>
            </div>

            <SeniorButton
              variant="primary"
              fullWidth
              onClick={() => setSelectedContent(content)}
            >
              Leer contenido
            </SeniorButton>
          </div>
        ))}
      </div>

      <div className="text-center">
        <SeniorButton
          variant="outline"
          onClick={() => navigate('/')}
        >
          Volver al inicio
        </SeniorButton>
      </div>
    </div>
  );
};

export default EducationalContentPage;