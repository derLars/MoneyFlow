import { useState, useRef, useEffect, useCallback } from 'react';
import { X, GripHorizontal } from 'lucide-react';

const SHEET_MARGIN = 64;

const BottomSheet = ({ isOpen, onClose, title, children, className = '' }) => {
  const sheetRef = useRef(null);
  const [startY, setStartY] = useState(null);
  const [offsetY, setOffsetY] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setOffsetY(0);
    } else {
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleTouchStart = useCallback((e) => {
    if (e.target.closest('.sheet-drag-handle') || e.target.closest('.sheet-scrollable')) {
      const scrollable = e.target.closest('.sheet-scrollable');
      if (scrollable && scrollable.scrollTop > 0) return;
    }
    setStartY(e.touches[0].clientY);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startY === null) return;
    const diff = e.touches[0].clientY - startY;
    if (diff > 0) setOffsetY(diff);
  }, [startY]);

  const handleTouchEnd = useCallback(() => {
    if (offsetY > 120) {
      onClose();
    }
    setOffsetY(0);
    setStartY(null);
  }, [offsetY, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        style={{ opacity: isOpen ? 1 : 0 }}
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${offsetY}px)`,
          transition: offsetY > 0 ? 'none' : 'transform 0.2s ease-out',
          maxHeight: `calc(100vh - ${SHEET_MARGIN}px)`,
        }}
        className={`relative bg-surface rounded-t-2xl shadow-2xl flex flex-col transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        } ${className}`}
      >
        <div className="sheet-drag-handle flex items-center justify-between px-4 pt-2 pb-1 sticky top-0 bg-surface z-10 rounded-t-2xl">
          <button onClick={onClose} className="p-1 -ml-1 text-secondary hover:text-white transition">
            <X size={20} />
          </button>
          <GripHorizontal size={20} className="text-secondary/40" />
          {title && <h3 className="text-base font-bold text-white absolute left-1/2 -translate-x-1/2">{title}</h3>}
          <div className="w-7" />
        </div>
        <div className="sheet-scrollable overflow-y-auto px-4 pb-6 pt-1 -webkit-overflow-scrolling:touch">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
