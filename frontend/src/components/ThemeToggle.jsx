import React from 'react';
import { Sun, Moon } from 'lucide-react';
import useThemeStore from '../store/themeStore';

const ThemeToggle = ({ showLabel = true, size = 'default' }) => {
  const { theme, toggleTheme } = useThemeStore();
  
  const sizeClasses = {
    small: 'w-12 h-6',
    default: 'w-14 h-7',
    large: 'w-16 h-8'
  };
  
  const iconSizes = {
    small: 14,
    default: 16,
    large: 18
  };

  return (
    <div className="flex items-center gap-3">
      {showLabel && (
        <span className="text-sm font-medium text-charcoal-gray dark:text-dark-text">
          {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
      <button
        onClick={toggleTheme}
        className={`${sizeClasses[size]} relative rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-deep-blue dark:focus:ring-dark-primary focus:ring-offset-2 dark:focus:ring-offset-dark-bg ${
          theme === 'dark' ? 'bg-dark-primary' : 'bg-gray-300'
        }`}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <span
          className={`absolute top-0.5 left-0.5 bg-white rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${
            theme === 'dark' ? 'translate-x-full' : 'translate-x-0'
          } ${size === 'small' ? 'w-5 h-5' : size === 'large' ? 'w-7 h-7' : 'w-6 h-6'}`}
        >
          {theme === 'light' ? (
            <Sun size={iconSizes[size]} className="text-yellow-500" />
          ) : (
            <Moon size={iconSizes[size]} className="text-dark-primary" />
          )}
        </span>
      </button>
    </div>
  );
};

export default ThemeToggle;
