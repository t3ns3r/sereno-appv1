import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type SerenitoExpression = 
  | 'happy' 
  | 'calm' 
  | 'encouraging' 
  | 'concerned' 
  | 'celebrating' 
  | 'thinking' 
  | 'welcoming'
  | 'breathing';

export type SerenitoSize = 'small' | 'medium' | 'large' | 'xl';

interface SerenitoCharacterProps {
  expression?: SerenitoExpression;
  size?: SerenitoSize;
  message?: string;
  showMessage?: boolean;
  animate?: boolean;
  onClick?: () => void;
  className?: string;
}

const expressions = {
  happy: '😊',
  calm: '🧘‍♀️',
  encouraging: '💪',
  concerned: '😟',
  celebrating: '🎉',
  thinking: '🤔',
  welcoming: '👋',
  breathing: '🫁'
};

const sizeClasses = {
  small: 'w-12 h-12 text-2xl',
  medium: 'w-16 h-16 text-3xl',
  large: 'w-24 h-24 text-4xl',
  xl: 'w-32 h-32 text-6xl'
};

const SerenitoCharacter: React.FC<SerenitoCharacterProps> = ({
  expression = 'calm',
  size = 'medium',
  message,
  showMessage = false,
  animate = true,
  onClick,
  className = ''
}) => {
  const [currentExpression, setCurrentExpression] = useState(expression);
  const [isBlinking, setIsBlinking] = useState(false);

  // Blinking animation effect
  useEffect(() => {
    if (!animate) return;

    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3000 + Math.random() * 2000); // Random blinking between 3-5 seconds

    return () => clearInterval(blinkInterval);
  }, [animate]);

  // Update expression when prop changes
  useEffect(() => {
    setCurrentExpression(expression);
  }, [expression]);

  const characterVariants = {
    idle: {
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.5,
        ease: "easeInOut"
      }
    },
    bounce: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.6,
        ease: "easeInOut"
      }
    },
    breathing: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    celebrating: {
      rotate: [0, -10, 10, -10, 10, 0],
      scale: [1, 1.1, 1],
      transition: {
        duration: 1,
        ease: "easeInOut"
      }
    },
    floating: {
      y: [0, -5, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const getAnimationVariant = () => {
    if (!animate) return 'idle';
    
    switch (currentExpression) {
      case 'breathing':
        return 'breathing';
      case 'celebrating':
        return 'celebrating';
      case 'happy':
      case 'encouraging':
        return 'bounce';
      case 'calm':
      case 'thinking':
      case 'welcoming':
        return 'floating';
      default:
        return 'idle';
    }
  };

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* SERENITO Character */}
      <motion.div
        className={`
          ${sizeClasses[size]} 
          bg-sereno-gradient 
          rounded-full 
          flex 
          items-center 
          justify-center 
          shadow-senior 
          cursor-pointer
          transition-all
          duration-300
          hover:shadow-senior-hover
          ${onClick ? 'hover:scale-105' : ''}
        `}
        variants={characterVariants}
        animate={getAnimationVariant()}
        onClick={onClick}
        whileHover={onClick ? { scale: 1.05 } : {}}
        whileTap={onClick ? { scale: 0.95 } : {}}
      >
        <span className={`${isBlinking ? 'opacity-50' : 'opacity-100'} transition-opacity duration-150`}>
          {expressions[currentExpression]}
        </span>
      </motion.div>

      {/* Message Bubble */}
      <AnimatePresence>
        {showMessage && message && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="
              absolute 
              top-full 
              mt-2 
              bg-white 
              rounded-senior 
              shadow-senior 
              p-3 
              max-w-xs 
              text-center
              border-2
              border-primary-200
            "
          >
            <div className="text-sm text-gray-700 font-medium">
              {message}
            </div>
            {/* Speech bubble arrow */}
            <div className="
              absolute 
              -top-2 
              left-1/2 
              transform 
              -translate-x-1/2 
              w-4 
              h-4 
              bg-white 
              border-l-2 
              border-t-2 
              border-primary-200 
              rotate-45
            "></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Name label for larger sizes */}
      {(size === 'large' || size === 'xl') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-2 text-center"
        >
          <p className="text-sm font-semibold text-gray-700">SERENITO</p>
          <p className="text-xs text-gray-500">Tu compañero de bienestar</p>
        </motion.div>
      )}
    </div>
  );
};

export default SerenitoCharacter;