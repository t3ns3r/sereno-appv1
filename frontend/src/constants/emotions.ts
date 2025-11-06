export interface EmotionOption {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

export const EMOTIONAL_STATES: EmotionOption[] = [
  {
    id: 'muy_feliz',
    name: 'Muy Feliz',
    emoji: '😄',
    color: 'bg-green-500',
    description: 'Me siento excelente y lleno de energía'
  },
  {
    id: 'feliz',
    name: 'Feliz',
    emoji: '😊',
    color: 'bg-green-400',
    description: 'Me siento bien y positivo'
  },
  {
    id: 'tranquilo',
    name: 'Tranquilo',
    emoji: '😌',
    color: 'bg-blue-400',
    description: 'Me siento en paz y relajado'
  },
  {
    id: 'neutral',
    name: 'Neutral',
    emoji: '😐',
    color: 'bg-gray-400',
    description: 'No me siento ni bien ni mal'
  },
  {
    id: 'preocupado',
    name: 'Preocupado',
    emoji: '😟',
    color: 'bg-yellow-500',
    description: 'Tengo algunas preocupaciones en mente'
  },
  {
    id: 'triste',
    name: 'Triste',
    emoji: '😢',
    color: 'bg-blue-600',
    description: 'Me siento desanimado o melancólico'
  },
  {
    id: 'ansioso',
    name: 'Ansioso',
    emoji: '😰',
    color: 'bg-orange-500',
    description: 'Me siento nervioso o inquieto'
  },
  {
    id: 'muy_triste',
    name: 'Muy Triste',
    emoji: '😭',
    color: 'bg-blue-700',
    description: 'Me siento muy desanimado'
  },
  {
    id: 'enojado',
    name: 'Enojado',
    emoji: '😠',
    color: 'bg-red-500',
    description: 'Me siento frustrado o irritado'
  }
];

export const CONFIDENCE_LEVELS = [
  { value: 1, label: 'Muy Baja', color: 'bg-red-600' },
  { value: 2, label: 'Baja', color: 'bg-red-400' },
  { value: 3, label: 'Algo Baja', color: 'bg-orange-500' },
  { value: 4, label: 'Regular', color: 'bg-yellow-500' },
  { value: 5, label: 'Normal', color: 'bg-yellow-400' },
  { value: 6, label: 'Algo Buena', color: 'bg-lime-400' },
  { value: 7, label: 'Buena', color: 'bg-green-400' },
  { value: 8, label: 'Muy Buena', color: 'bg-green-500' },
  { value: 9, label: 'Excelente', color: 'bg-green-600' },
  { value: 10, label: 'Perfecta', color: 'bg-emerald-600' }
];

export const getEmotionById = (id: string): EmotionOption | undefined => {
  return EMOTIONAL_STATES.find(emotion => emotion.id === id);
};

export const getConfidenceLevelInfo = (level: number) => {
  return CONFIDENCE_LEVELS.find(cl => cl.value === level) || CONFIDENCE_LEVELS[4];
};