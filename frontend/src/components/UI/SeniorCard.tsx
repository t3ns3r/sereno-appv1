import React from 'react';
import { motion } from 'framer-motion';

interface SeniorCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
  padding?: 'small' | 'medium' | 'large';
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
}

const SeniorCard: React.FC<SeniorCardProps> = ({
  children,
  title,
  subtitle,
  icon,
  variant = 'default',
  padding = 'medium',
  clickable = false,
  onClick,
  className = ''
}) => {
  const baseClasses = `
    bg-white
    rounded-senior
    transition-all
    duration-300
    ease-in-out
    ${clickable ? 'cursor-pointer hover:shadow-senior-hover' : ''}
    ${onClick ? 'focus:outline-none focus:ring-4 focus:ring-primary-200' : ''}
  `;

  const variantClasses = {
    default: 'shadow-senior border border-gray-200',
    elevated: 'shadow-senior-hover border border-gray-100',
    outlined: 'border-2 border-gray-300 shadow-sm',
    gradient: 'bg-gradient-to-br from-white to-gray-50 shadow-senior border border-gray-200'
  };

  const paddingClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  const cardVariants = {
    idle: { scale: 1, y: 0 },
    hover: clickable ? { scale: 1.01, y: -1 } : { scale: 1, y: 0 },
    tap: clickable ? { scale: 0.99, y: 0 } : { scale: 1, y: 0 }
  };

  const CardComponent = onClick ? motion.button : motion.div;

  return (
    <CardComponent
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${className}
      `}
      onClick={onClick}
      variants={cardVariants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
    >
      {/* Header */}
      {(title || subtitle || icon) && (
        <div className="flex items-start space-x-3 mb-4">
          {icon && (
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="text-gray-700">
        {children}
      </div>
    </CardComponent>
  );
};

export default SeniorCard;