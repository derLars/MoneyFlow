const CompactCard = ({ children, className = '', onClick, hover = true, active = false }) => (
  <div
    onClick={onClick}
    className={`bg-surface rounded-xl border border-white/5 p-2.5 ${
      onClick ? 'cursor-pointer' : ''
    } ${hover && onClick ? 'active:scale-[0.99] hover:border-primary/30' : ''} ${
      active ? 'ring-1 ring-primary' : ''
    } transition-all ${className}`}
  >
    {children}
  </div>
);

export default CompactCard;
