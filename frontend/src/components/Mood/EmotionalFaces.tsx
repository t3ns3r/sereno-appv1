import React from 'react';
import { motion } from 'framer-motion';

export interface EmotionalFace {
  id: string;
  emoji: string;
  label: string;
  description: string;
  color: string;
  intensity: number; // 1-5 scale
}

interface EmotionalFacesProps {
  selectedFace?: string;
  onFaceSelect: (face: EmotionalFace) => void;
  size?: 'small' | 'medium' | 'large';
  layout?: 'grid' | 'row';
  disabled?: boolean;
}

const emotionalFaces: EmotionalFace[] = [
  {
    id: 'very-sad',
    emoji: '😢',
    label: 'Muy triste',
    description: 'Me siento muy mal, con mucha tristeza',
    color: 'border-blue-400 bg-blue-50',
    intensity: 1
  },
  {
    id: 'sad',
    emoji: '😔',
    label: 'Triste',
    description: 'Me siento un poco triste o desanimado',
    color: 'border-blue-300 bg-blue-25',
    intensity: 2
  },
  {
    id: 'neutral',
    emoji: '😐',
    label: 'Neutral',
    description: 'Me siento normal, ni bien ni mal',
    color: 'border-gray-400 bg-gray-50',
    intensity: 3
  },
  {
    id: 'happy',
    emoji: '😊',
    label: 'Contento',
    description: 'Me siento bien y positivo',
    color: 'border-green-400 bg-green-50',
    intensity: 4
  },
  {
    id: 'very-happy',
    emoji: '😄',
    label: 'Muy feliz',
    description: 'Me siento excelente y lleno de energía',
    color: 'border-green-500 bg-green-100',
    intensity: 5
  },
  {
    id: 'anxious',
    emoji: '😰',
    label: 'Ansioso',
    description: 'Me siento nervioso o preocupado',
    color: 'border-yellow-400 bg-yellow-50',
    intensity: 2
  },
  {
    id: 'angry',
    emoji: '😠',
    label: 'Enojado',
    description: 'Me siento frustrado o molesto',
    color: 'border-red-400 bg-red-50',
    intensity: 2
  },
  {
    id: 'confused',
    emoji: '😕',
    label: 'Confundido',
    description: 'No estoy seguro de cómo me siento',
    color: 'border-purple-400 bg-purple-50',
    intensity: 3
  },
  {
    id: 'excited',
    emoji: '🤗',
    label: 'Emocionado',
    description: 'Me siento entusiasmado y con ganas',
    color: 'border-orange-400 bg-orange-50',
    intensity: 4
  },
  {
    id: 'tired',
    emoji: '😴',
    label: 'Cansado',
    description: 'Me siento agotado o sin energía',
    color: 'border-indigo-400 bg-indigo-50',
    intensity: 2
  }
];

const EmotionalFaces: React.FC<EmotionalFacesProps> = ({
  selectedFace,
  onFaceSelect,
  size = 'medium',
  layout = 'grid',
  disabled = false
}) => {
  const sizeClasses = {
    small: 'w-12 h-12 text-2xl',
    medium: 'w-16 h-16 text-3xl',
    large: 'w-20 h-20 text-4xl'
  };

  const containerClasses = {
    grid: 'grid grid-cols-3 sm:grid-cols-5 gap-3',
    row: 'flex flex-wrap justify-center gap-3'
  };

  const faceVariants = {
    idle: { scale: 1, rotate: 0 },
    hover: { scale: 1.1, rotate: 2 },
    selected: { scale: 1.15, rotate: 0 },
    tap: { scale: 0.95 }
  };

  return (
    <div className={containerClasses[layout]}>
      {emotionalFaces.map((face, index) => {
        const isSelected = selectedFace === face.id;
        
        return (
          <motion.button
            key={face.id}
            className={`
              ${sizeClasses[size]}
              rounded-full
              border-3
              flex items-center justify-center
              transition-all duration-300 ease-in-out
              focus:outline-none focus:ring-4 focus:ring-primary-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isSelected 
                ? `${face.color} border-4 shadow-lg` 
                : 'border-gray-300 bg-white hover:border-gray-400 shadow-senior'
              }
            `}
            onClick={() => !disabled && onFaceSelect(face)}
            disabled={disabled}
            title={`${face.label}: ${face.description}`}
            aria-label={`Seleccionar estado de ánimo: ${face.label}`}
            variants={faceVariants}
            initial="idle"
            animate={isSelected ? "selected" : "idle"}
            whileHover={!disabled && !isSelected ? "hover" : undefined}
            whileTap={!disabled ? "tap" : undefined}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span className="select-none">
              {face.emoji}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

export { emotionalFaces };
export default EmotionalFaces;