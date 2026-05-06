const CompactInput = ({ label, value, onChange, type = 'text', className = '', inputClass = '', ...props }) => (
  <div className={`flex flex-col gap-0.5 ${className}`}>
    {label && <label className="text-[10px] font-semibold uppercase tracking-wider text-secondary">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      className={`w-full px-2.5 py-1.5 bg-background border border-white/10 rounded-lg text-white text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-tertiary ${inputClass}`}
      {...props}
    />
  </div>
);

export default CompactInput;
