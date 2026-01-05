import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';

const MultiSelect = ({ options, value, onChange, label, placeholder = "Select..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (optionValue) => {
    const updated = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(updated);
  };

  const selectedLabels = options
    .filter(o => value.includes(o.value))
    .map(o => o.label);

  return (
    <div className="relative pt-3" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-3 pb-2 pt-2 bg-background border border-white/10 rounded-xl outline-none text-white text-sm min-h-[42px] relative flex justify-between items-center"
      >
        <span className="block truncate pr-6">
          {selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder}
        </span>
        <div className="text-secondary">
          <ChevronDown size={16} />
        </div>
      </button>
      {label && (
        <label className="absolute left-3 top-0 -translate-y-1/2 bg-surface px-1 text-primary text-xs pointer-events-none">
          {label}
        </label>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-surface rounded-xl shadow-xl border border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="max-h-60 overflow-y-auto p-1">
            {options.length > 0 ? options.map(option => (
              <div
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className={`
                  flex items-center justify-between px-4 py-3 cursor-pointer rounded-lg transition-colors
                  ${value.includes(option.value) ? 'bg-primary/20 text-primary' : 'text-white hover:bg-white/5'}
                `}
              >
                <span className="text-sm font-medium">{option.label}</span>
                {value.includes(option.value) && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
            )) : (
                <div className="p-3 text-center text-secondary text-sm italic">No options available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
