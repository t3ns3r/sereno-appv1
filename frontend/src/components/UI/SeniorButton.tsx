import React from 'react';
import { motion } from 'framer-motion';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'emergency' | 'outline' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large' | 'xl';

interface SeniorButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
}

const SeniorButton: React.FC<SeniorButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  onClick,
  className = '',
  type = 'button',
  ariaLabel
}) => {
  const baseClasses = `
    inline-flex items-center justify-center
    font-semibold rounded-senior
    transition-all duration-300 ease-in-out
    focus:outline-none focus:ring-4 focus:ring-primary-200
    disabled:opacity-50 disabled:cursor-not-allowed
    shadow-senior hover:shadow-senior-hover
    ${fullWidth ? 'w-full' : ''}
  `;

  const sizeClasses = {
    small: 'min-h-[50px] px-4 py-2 text-base min-w-[100px]',
    medium: 'min-h-[60px] px-6 py-3 text-lg min-w-[120px]',
    large: 'min-h-[70px] px-8 py-4 text-xl min-w-[140px]',
    xl: 'min-h-[80px] px-10 py-5 text-2xl min-w-[160px]'
  };

  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
    secondary: 'bg-secondary-400 text-white hover:bg-secondary-500 active:bg-secondary-600',
    accent: 'bg-accent-400 text-white hover:bg-accent-500 active:bg-accent-600',
    emergency: 'bg-emergency-400 text-white hover:bg-emergency-500 active:bg-emergency-600',
    outline: 'bg-transparent border-2 border-primary-500 text-primary-500 hover:bg-primary-50 active:bg-primary-100',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200'
  };

  const iconSizeClasses = {
    small: 'w-5 h-5',
    medium: 'w-6 h-6',
    large: 'w-7 h-7',
    xl: 'w-8 h-8'
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 }
  };

  return (
    <motion.button
      type={type}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      variants={buttonVariants}
      initial="idle"
      whileHover={!disabled && !loading ? "hover" : "idle"}
      whileTap={!disabled && !loading ? "tap" : "idle"}
    >
      {loading && (
        <div className={`animate-spin rounded-full border-2 border-white border-t-transparent ${iconSizeClasses[size]} mr-2`} />
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className={`${iconSizeClasses[size]} mr-2 flex-shrink-0`}>
          {icon}
        </span>
      )}
      
      <span className="flex-1 text-center">
        {children}
      </span>
      
      {!loading && icon && iconPosition === 'right' && (
        <span className={`${iconSizeClasses[size]} ml-2 flex-shrink-0`}>
          {icon}
        </span>
      )}
    </motion.button>
  );
};

export default SeniorButton;