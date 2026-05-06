import { useState } from 'react';
import { X } from 'lucide-react';

const ChipSelect = ({ options, value = [], onChange, label, maxDisplay = 4 }) => {
  const [showAll, setShowAll] = useState(false);
  const selected = options.filter(o => value.includes(o.value));
  const visible = showAll ? selected : selected.slice(0, maxDisplay);
  const remainder = selected.length - maxDisplay;

  const toggle = (optValue) => {
    const updated = value.includes(optValue)
      ? value.filter(v => v !== optValue)
      : [...value, optValue];
    onChange(updated);
  };

  const isSelected = (optValue) => value.includes(optValue);

  return (
    <div>
      {label && <label className="text-[10px] font-semibold uppercase tracking-wider text-secondary mb-1 block">{label}</label>}
      <div className="flex flex-wrap gap-1.5">
        {visible.map(opt => (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/20 text-primary text-xs font-medium rounded-lg hover:bg-primary/30 transition"
          >
            {opt.label}
            <X size={12} />
          </button>
        ))}
        {!showAll && remainder > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center px-2.5 py-1 bg-background text-secondary text-xs font-medium rounded-lg border border-white/10 hover:border-white/20 transition"
          >
            +{remainder} more
          </button>
        )}
        {showAll && remainder > 0 && (
          <button
            onClick={() => setShowAll(false)}
            className="inline-flex items-center px-2.5 py-1 bg-background text-secondary text-xs font-medium rounded-lg border border-white/10 hover:border-white/20 transition"
          >
            Show less
          </button>
        )}
        <button
          onClick={() => {
            const unselected = options.filter(o => !value.includes(o.value));
            if (unselected.length > 0) toggle(unselected[0].value);
          }}
          className="inline-flex items-center px-2.5 py-1 bg-background text-secondary/60 text-xs font-medium rounded-lg border border-dashed border-white/10 hover:border-primary/40 hover:text-primary transition"
        >
          + Add
        </button>
      </div>
    </div>
  );
};

export default ChipSelect;
