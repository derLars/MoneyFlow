import React, { useState, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import FloatingInput from './FloatingInput';

const CreatableSelect = ({ label, value, onChange, options, className = '', disabled = false }) => {
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Initialize state based on value
  useEffect(() => {
    // If value exists but isn't in options, we must be in typing mode (unless options haven't loaded yet, but usually safer to assume typing for arbitrary values)
    // However, for categories, options are fetched.
    // Logic from original: isTyping = !options.some(opt => opt.value === value) && value !== ''
    if (value && options.length > 0 && !options.some(opt => opt.value === value)) {
      setIsTyping(true);
    }
  }, [value, options]);

  const handleSelectChange = (e) => {
    const selectedValue = e.target.value;
    if (selectedValue === "__new__") {
      setIsTyping(true);
      onChange(''); // Clear value for typing
    } else {
      setIsTyping(false);
      onChange(selectedValue);
    }
  };

  if (isTyping) {
    return (
      <div className={`relative ${className}`}>
        <FloatingInput
          label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoFocus // Focus when switching to input
        />
        <button
          onClick={() => {
            setIsTyping(false);
            onChange(''); // Reset when going back to select
          }}
          className="absolute right-3 top-1/2 pt-1 -translate-y-1/2 text-secondary hover:text-white"
          type="button"
          title="Switch to selection"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className={`relative pt-3 ${className}`}>
      <select
        value={value || ''}
        onChange={handleSelectChange}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          block w-full px-3 pb-2 pt-2 bg-background border rounded-xl outline-none transition-all appearance-none
          ${isFocused ? 'border-primary ring-1 ring-primary' : 'border-white/10 hover:border-white/20'}
          text-white text-sm
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <option value="" disabled className="bg-surface text-secondary">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface text-white">
            {opt.label}
          </option>
        ))}
        <option value="__new__" className="bg-surface text-primary font-bold">+ Create new "{label}"</option>
      </select>
      <label
        className={`
          absolute left-3 transition-all duration-200 pointer-events-none text-xs
          ${(isFocused || value) 
            ? 'top-0 -translate-y-1/2 bg-surface px-1 text-primary' 
            : 'top-1/2 -translate-y-1 text-secondary'
          }
        `}
      >
        {label}
      </label>
      <div className="absolute right-3 top-1/2 pt-1.5 -translate-y-1/2 pointer-events-none text-secondary">
        <ChevronDown size={16} />
      </div>
    </div>
  );
};

export default CreatableSelect;
