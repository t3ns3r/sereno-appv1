export interface DiaryEmotion {
  id: string;
  label: string;
  emoji: string;
  serenitoExpression: 'happy' | 'sad' | 'concerned' | 'encouraging' | 'calm' | 'supportive';
  color: string;
  description: string;
}

export const diaryEmotions: DiaryEmotion[] = [
  {
    id: 'sad',
    label: 'Triste',
    emoji: '😢',
    serenitoExpression: 'supportive',
    color: 'text-blue-500',
    description: 'Me siento melancólico o con ganas de llorar'
  },
  {
    id: 'determined',
    label: 'Determinado/a',
    emoji: '💪',
    serenitoExpression: 'encouraging',
    color: 'text-orange-600',
    description: 'Me siento fuerte y decidido a lograr mis metas'
  },
  {
    id: 'angry',
    label: 'Enojado/a',
    emoji: '😠',
    serenitoExpression: 'calm',
    color: 'text-red-500',
    description: 'Siento irritación o frustración'
  },
  {
    id: 'hungry',
    label: 'Hambriento/a',
    emoji: '🤤',
    serenitoExpression: 'supportive',
    color: 'text-yellow-600',
    description: 'Tengo apetito o antojos'
  },
  {
    id: 'calm',
    label: 'Calmado/a',
    emoji: '😌',
    serenitoExpression: 'calm',
    color: 'text-green-500',
    description: 'Me siento en paz y relajado'
  },
  {
    id: 'indifferent',
    label: 'Indiferente',
    emoji: '😐',
    serenitoExpression: 'concerned',
    color: 'text-gray-500',
    description: 'No siento emociones fuertes, estoy neutral'
  },
  {
    id: 'depressed',
    label: 'Deprimido/a',
    emoji: '😞',
    serenitoExpression: 'supportive',
    color: 'text-indigo-600',
    description: 'Me siento muy bajo de ánimo y sin energía'
  },
  {
    id: 'overwhelmed',
    label: 'Abrumado/a',
    emoji: '😵‍💫',
    serenitoExpression: 'supportive',
    color: 'text-purple-500',
    description: 'Siento que hay demasiadas cosas que manejar'
  },
  {
    id: 'excited',
    label: 'Emocionado/a',
    emoji: '🤩',
    serenitoExpression: 'happy',
    color: 'text-pink-500',
    description: 'Me siento lleno de energía y entusiasmo'
  },
  {
    id: 'anxious',
    label: 'Ansioso/a',
    emoji: '😰',
    serenitoExpression: 'supportive',
    color: 'text-orange-500',
    description: 'Siento nervios o preocupación'
  },
  {
    id: 'grateful',
    label: 'Agradecido/a',
    emoji: '🙏',
    serenitoExpression: 'happy',
    color: 'text-emerald-500',
    description: 'Siento aprecio y gratitud'
  },
  {
    id: 'hopeful',
    label: 'Esperanzado/a',
    emoji: '🌟',
    serenitoExpression: 'encouraging',
    color: 'text-yellow-500',
    description: 'Tengo expectativas positivas sobre el futuro'
  },
  {
    id: 'confused',
    label: 'Confundido/a',
    emoji: '🤔',
    serenitoExpression: 'supportive',
    color: 'text-amber-600',
    description: 'No tengo claridad sobre algo'
  },
  {
    id: 'proud',
    label: 'Orgulloso/a',
    emoji: '😊',
    serenitoExpression: 'happy',
    color: 'text-blue-600',
    description: 'Me siento satisfecho con mis logros'
  },
  {
    id: 'lonely',
    label: 'Solo/a',
    emoji: '😔',
    serenitoExpression: 'supportive',
    color: 'text-slate-500',
    description: 'Siento falta de compañía o conexión'
  },
  {
    id: 'energetic',
    label: 'Energético/a',
    emoji: '⚡',
    serenitoExpression: 'encouraging',
    color: 'text-lime-500',
    description: 'Me siento lleno de vitalidad'
  },
  {
    id: 'peaceful',
    label: 'En paz',
    emoji: '🕊️',
    serenitoExpression: 'calm',
    color: 'text-teal-500',
    description: 'Siento tranquilidad interior'
  },
  {
    id: 'motivated',
    label: 'Motivado/a',
    emoji: '🚀',
    serenitoExpression: 'encouraging',
    color: 'text-cyan-500',
    description: 'Tengo ganas de hacer cosas y avanzar'
  }
];

export const achievementTypes = [
  {
    id: 'big',
    label: 'Grande',
    emoji: '🏆',
    color: 'text-yellow-500',
    description: 'Un logro importante que me llena de orgullo'
  },
  {
    id: 'medium',
    label: 'Mediano',
    emoji: '🎯',
    color: 'text-blue-500',
    description: 'Un paso significativo hacia mis metas'
  },
  {
    id: 'small',
    label: 'Pequeño',
    emoji: '⭐',
    color: 'text-green-500',
    description: 'Una pequeña victoria que vale la pena celebrar'
  }
];

export const getSerenitoResponseForEmotion = (emotionId: string) => {
  const emotion = diaryEmotions.find(e => e.id === emotionId);
  if (!emotion) return { message: 'Te acompaño en lo que sientes.', expression: 'supportive' as const };

  const responses = {
    sad: 'Veo que te sientes triste. Está bien sentir así a veces. Estoy aquí contigo.',
    determined: '¡Me encanta verte tan determinado! Esa actitud te llevará lejos.',
    angry: 'Noto que estás enojado. Respiremos juntos para encontrar calma.',
    hungry: '¡Parece que tienes hambre! Cuidar tu alimentación es importante.',
    calm: 'Qué hermoso verte tan calmado. Disfruta esta sensación de paz.',
    indifferent: 'A veces nos sentimos así. ¿Quieres explorar qué hay detrás de esta sensación?',
    depressed: 'Siento que estás pasando por un momento difícil. No estás solo en esto.',
    overwhelmed: 'Entiendo que te sientes abrumado. Vamos paso a paso, sin prisa.',
    excited: '¡Tu emoción es contagiosa! Me alegra verte tan entusiasmado.',
    anxious: 'Percibo tu ansiedad. Hagamos algunos ejercicios de respiración juntos.',
    grateful: 'La gratitud es un regalo hermoso. Me alegra que la sientas.',
    hopeful: '¡La esperanza es poderosa! Me encanta ver tu optimismo.',
    confused: 'Es normal sentirse confundido a veces. Podemos reflexionar juntos.',
    proud: '¡Tienes razones para sentirte orgulloso! Celebremos tus logros.',
    lonely: 'Aunque te sientas solo, recuerda que yo siempre estoy aquí contigo.',
    energetic: '¡Qué energía tan maravillosa! Aprovechemos este impulso positivo.',
    peaceful: 'La paz interior es un tesoro. Disfruta este momento de serenidad.',
    motivated: '¡Tu motivación es inspiradora! Vamos a canalizar esa energía.'
  };

  return {
    message: responses[emotionId as keyof typeof responses] || 'Te acompaño en lo que sientes.',
    expression: emotion.serenitoExpression
  };
};