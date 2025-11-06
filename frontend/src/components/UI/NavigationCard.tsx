import React from 'react';
import { motion } from 'framer-motion';

interface NavigationCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  disabled?: boolean;
  badge?: string | number;
  className?: string;
}

const NavigationCard: React.FC<NavigationCardProps> = ({
  title,
  subtitle,
  icon,
  color,
  onClick,
  disabled = false,
  badge,
  className = ''
}) => {
  const cardVariants = {
    idle: { 
      scale: 1,
      y: 0
    },
    hover: { 
      scale: 1.02,
      y: -2,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    tap: { 
      scale: 0.98,
      y: 0
    }
  };

  return (
    <motion.button
      className={`
        relative
        w-full
        h-24
        ${color}
        text-white
        rounded-senior
        shadow-senior
        hover:shadow-senior-hover
        transition-all
        duration-300
        ease-in-out
        focus:outline-none
        focus:ring-4
        focus:ring-primary-200
        disabled:opacity-50
        disabled:cursor-not-allowed
        overflow-hidden
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
      variants={cardVariants}
      initial="idle"
      whileHover={!disabled ? "hover" : "idle"}
      whileTap={!disabled ? "tap" : "idle"}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      
      {/* Content */}
      <div className="relative flex items-center justify-center h-full p-4">
        <div className="flex flex-col items-center space-y-2 text-center">
          {/* Icon */}
          <div className="w-8 h-8 flex items-center justify-center">
            {icon}
          </div>
          
          {/* Text */}
          <div>
            <div className="font-semibold text-base leading-tight">
              {title}
            </div>
            <div className="text-sm opacity-90 leading-tight">
              {subtitle}
            </div>
          </div>
        </div>
      </div>

      {/* Badge */}
      {badge && (
        <div className="
          absolute 
          -top-2 
          -right-2 
          bg-emergency-400 
          text-white 
          text-xs 
          font-bold 
          rounded-full 
          w-6 
          h-6 
          flex 
          items-center 
          justify-center
          shadow-lg
        ">
          {badge}
        </div>
      )}

      {/* Ripple effect on click */}
      <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-senior" />
    </motion.button>
  );
};

export default NavigationCard;