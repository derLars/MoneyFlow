import React from 'react';

const Switch = ({ checked, onChange, label, className = '' }) => {
  return (
    <label className={`flex items-center cursor-pointer gap-3 ${className}`}>
      <div className="relative">
        <input 
          type="checkbox" 
          className="sr-only" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${checked ? 'bg-primary' : 'bg-surface border border-white/10'}`}></div>
        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out shadow-sm ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
      </div>
      {label && <span className="text-sm font-medium text-white">{label}</span>}
    </label>
  );
};

export default Switch;
