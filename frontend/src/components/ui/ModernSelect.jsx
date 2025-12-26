import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const ModernSelect = ({ label, value, onChange, options, className = '', disabled = false }) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== '' && value !== undefined && value !== null;

  return (
    <div className={`relative pt-3 ${className}`}>
      <select
        value={value}
        onChange={onChange}
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
      </select>
      <label
        className={`
          absolute left-3 transition-all duration-200 pointer-events-none text-xs
          ${(isFocused || hasValue) 
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

export default ModernSelect;
