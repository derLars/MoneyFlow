import React, { useState } from 'react';

const FloatingInput = ({ label, value, onChange, type = 'text', className = '', ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== '' && value !== undefined && value !== null;

  return (
    <div className={`relative pt-3 ${className}`}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          block w-full px-3 pb-2 pt-2 bg-background border rounded-xl outline-none transition-all
          ${isFocused ? 'border-primary ring-1 ring-primary' : 'border-white/10 hover:border-white/20'}
          text-white text-sm placeholder-transparent
        `}
        placeholder={label}
        {...props}
      />
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
    </div>
  );
};

export default FloatingInput;
