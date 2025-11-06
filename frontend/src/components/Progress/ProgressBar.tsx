import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  label: string;
  color?: 'primary' | 'success' | 'warning' | 'info';
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  color = 'primary',
  showPercentage = true,
  size = 'md'
}) => {
  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className="w-full">
      <div className={`flex justify-between items-center mb-2 ${textSizeClasses[size]}`}>
        <span className="font-medium text-gray-700">{label}</span>
        {showPercentage && (
          <span className="text-gray-600">{Math.round(progress)}%</span>
        )}
      </div>
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;