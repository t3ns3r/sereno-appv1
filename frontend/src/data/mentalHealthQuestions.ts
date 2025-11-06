export interface QuestionOption {
  value: number;
  label: string;
  description: string;
}

export interface MentalHealthQuestion {
  id: string;
  text: string;
  category: 'anxiety' | 'depression';
  options: QuestionOption[];
}

// Opciones estándar para escalas de frecuencia
const frequencyOptions: QuestionOption[] = [
  { value: 0, label: 'Nunca', description: 'No he experimentado esto' },
  { value: 1, label: 'Algunas veces', description: 'Ocasionalmente, pero no me afecta mucho' },
  { value: 2, label: 'Frecuentemente', description: 'Varias veces, me causa molestias' },
  { value: 3, label: 'Casi siempre', description: 'Constantemente, afecta mi vida diaria' }
];

// Cuestionario de Ansiedad (basado en GAD-7 adaptado)
export const anxietyQuestions: MentalHealthQuestion[] = [
  {
    id: 'anxiety_1',
    text: 'Durante la última semana, ¿con qué frecuencia te has sentido nervioso/a, ansioso/a o muy alterado/a?',
    category: 'anxiety',
    options: frequencyOptions
  },
  {
    id: 'anxiety_2',
    text: '¿Con qué frecuencia no has podido parar o controlar tus preocupaciones?',
    category: 'anxiety',
    options: frequencyOptions
  },
  {
    id: 'anxiety_3',
    text: '¿Con qué frecuencia te has preocupado excesivamente por diferentes cosas?',
    category: 'anxiety',
    options: frequencyOptions
  },
  {
    id: 'anxiety_4',
    text: '¿Con qué frecuencia has tenido dificultades para relajarte?',
    category: 'anxiety',
    options: frequencyOptions
  },
  {
    id: 'anxiety_5',
    text: '¿Con qué frecuencia te has sentido tan inquieto/a que te ha sido difícil quedarte quieto/a?',
    category: 'anxiety',
    options: frequencyOptions
  },
  {
    id: 'anxiety_6',
    text: '¿Con qué frecuencia te has molestado o irritado fácilmente?',
    category: 'anxiety',
    options: frequencyOptions
  },
  {
    id: 'anxiety_7',
    text: '¿Con qué frecuencia has sentido miedo de que algo terrible pueda pasar?',
    category: 'anxiety',
    options: frequencyOptions
  },
  {
    id: 'anxiety_8',
    text: '¿Con qué frecuencia has experimentado síntomas físicos como palpitaciones, sudoración o temblores?',
    category: 'anxiety',
    options: frequencyOptions
  }
];

// Cuestionario de Depresión (basado en PHQ-8 adaptado)
export const depressionQuestions: MentalHealthQuestion[] = [
  {
    id: 'depression_1',
    text: 'Durante la última semana, ¿con qué frecuencia has tenido poco interés o placer en hacer cosas?',
    category: 'depression',
    options: frequencyOptions
  },
  {
    id: 'depression_2',
    text: '¿Con qué frecuencia te has sentido decaído/a, deprimido/a o sin esperanza?',
    category: 'depression',
    options: frequencyOptions
  },
  {
    id: 'depression_3',
    text: '¿Con qué frecuencia has tenido dificultades para dormir, mantenerte dormido/a o has dormido demasiado?',
    category: 'depression',
    options: frequencyOptions
  },
  {
    id: 'depression_4',
    text: '¿Con qué frecuencia te has sentido cansado/a o con poca energía?',
    category: 'depression',
    options: frequencyOptions
  },
  {
    id: 'depression_5',
    text: '¿Con qué frecuencia has tenido poco apetito o has comido en exceso?',
    category: 'depression',
    options: frequencyOptions
  },
  {
    id: 'depression_6',
    text: '¿Con qué frecuencia te has sentido mal contigo mismo/a o has pensado que eres un fracaso?',
    category: 'depression',
    options: frequencyOptions
  },
  {
    id: 'depression_7',
    text: '¿Con qué frecuencia has tenido dificultades para concentrarte en cosas como leer o ver televisión?',
    category: 'depression',
    options: frequencyOptions
  },
  {
    id: 'depression_8',
    text: '¿Con qué frecuencia te has movido o hablado tan lentamente que otros lo han notado, o has estado muy inquieto/a?',
    category: 'depression',
    options: frequencyOptions
  }
];

// Función para calcular el nivel basado en el puntaje
export const calculateLevel = (score: number, maxScore: number) => {
  const percentage = (score / maxScore) * 100;
  
  if (percentage <= 25) return { level: 'Mínimo', color: 'success', description: 'Síntomas mínimos o ausentes' };
  if (percentage <= 50) return { level: 'Leve', color: 'info', description: 'Síntomas leves que pueden requerir atención' };
  if (percentage <= 75) return { level: 'Moderado', color: 'warning', description: 'Síntomas moderados que requieren seguimiento' };
  return { level: 'Severo', color: 'error', description: 'Síntomas severos que requieren atención profesional' };
};

// Mensajes de SERENITO según el resultado
export const getSerenitoMessage = (anxietyLevel: string, depressionLevel: string) => {
  if (anxietyLevel === 'Mínimo' && depressionLevel === 'Mínimo') {
    return {
      message: '¡Excelente! Tus niveles están muy bien. Sigue cuidándote así.',
      expression: 'happy' as const
    };
  }
  
  if (anxietyLevel === 'Leve' || depressionLevel === 'Leve') {
    return {
      message: 'Veo algunos síntomas leves. Te acompañaré para que te sientas mejor.',
      expression: 'supportive' as const
    };
  }
  
  if (anxietyLevel === 'Moderado' || depressionLevel === 'Moderado') {
    return {
      message: 'Noto que has estado pasando por momentos difíciles. Estoy aquí para apoyarte.',
      expression: 'concerned' as const
    };
  }
  
  return {
    message: 'Me preocupo por ti. Considera hablar con un profesional. Mientras tanto, estaré contigo.',
    expression: 'concerned' as const
  };
};