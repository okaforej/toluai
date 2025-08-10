import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  text,
  className = '',
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'small':
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-12 w-12';
      case 'xl':
        return 'h-16 w-16';
      default:
        return 'h-8 w-8';
    }
  };

  const getColorClass = () => {
    switch (color) {
      case 'white':
        return 'border-white border-opacity-30 border-t-white';
      case 'gray':
        return 'border-gray-300 border-t-gray-600';
      default:
        return 'border-gray-300 border-t-primary-600';
    }
  };

  const getTextSizeClass = () => {
    switch (size) {
      case 'small':
      case 'sm':
        return 'text-xs';
      case 'lg':
      case 'xl':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  if (text) {
    return (
      <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
        <div
          className={`${getSizeClass()} ${getColorClass()} animate-spin rounded-full border-2`}
          role="status"
          aria-label={text}
        />
        <span className={`${getTextSizeClass()} text-gray-600 animate-pulse`}>{text}</span>
      </div>
    );
  }

  return (
    <div
      className={`${getSizeClass()} ${getColorClass()} animate-spin rounded-full border-2 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

export default LoadingSpinner;
