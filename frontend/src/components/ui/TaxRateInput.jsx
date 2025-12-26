import React, { useState } from 'react';
import { ChevronDown, X, Percent } from 'lucide-react';
import FloatingInput from './FloatingInput';

const TaxRateInput = ({ label, value, onChange, commonRates = [], className = '', disabled = false }) => {
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // If the current value is not in commonRates (and is not empty/0 if 0 is in commonRates), it's custom.
  // commonRates are usually strings "0", "20", etc.
  const isCustom = value !== '' && value !== null && !commonRates.includes(String(value));

  // Initialize typing state if value is custom on mount/update
  // logic: if value is custom, we show input.
  if (isCustom && !isTyping) {
    setIsTyping(true);
  }

  const handleSelectChange = (e) => {
    const selectedValue = e.target.value;
    if (selectedValue === "__custom__") {
      setIsTyping(true);
      // Don't clear value immediately, let user edit or type over. 
      // But maybe safer to clear or select all? Let's just switch mode.
    } else {
      setIsTyping(false);
      onChange(parseFloat(selectedValue));
    }
  };

  if (isTyping) {
    return (
      <div className={`relative ${className}`}>
        <FloatingInput
          label={label}
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoFocus
        />
        <button
          onClick={() => {
            setIsTyping(false);
            // If current value is not in list, it might be weird to switch back to select without a matching option.
            // But we can reset to first common rate or 0 if desired, or just let it be.
            // If we switch back, the select will show empty if value doesn't match options.
            // Let's reset to 0 or first option if current value is invalid for select?
            // Actually, if we switch off typing, we expect to pick from dropdown.
            onChange(''); 
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
        value={value}
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
        {commonRates.map((rate) => (
          <option key={rate} value={rate} className="bg-surface text-white">
            {rate}%
          </option>
        ))}
        <option value="__custom__" className="bg-surface text-primary font-bold">+ Custom Rate...</option>
      </select>
      <label
        className={`
          absolute left-3 transition-all duration-200 pointer-events-none text-xs
          ${(isFocused || value !== '') 
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

export default TaxRateInput;
