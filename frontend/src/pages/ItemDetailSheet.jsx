import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BottomSheet from '../components/ui/BottomSheet';
import CompactInput from '../components/ui/CompactInput';
import ChipSelect from '../components/ui/ChipSelect';
import CreatableSelect from '../components/ui/CreatableSelect';
import TaxRateInput from '../components/ui/TaxRateInput';

const SWIPE_THRESHOLD = 60;

const ItemDetailSheet = ({
  isOpen,
  onClose,
  items,
  currentIndex,
  onUpdateItem,
  purchase,
  allUsers,
  categoriesLevel1,
  categoriesLevel2,
  categoriesLevel3,
  user,
}) => {
  const [index, setIndex] = useState(currentIndex);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const [swiping, setSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const contentRef = useRef(null);

  useEffect(() => {
    setIndex(currentIndex);
  }, [currentIndex, isOpen]);

  const item = items[index];
  if (!item) return null;

  const update = (field, value) => onUpdateItem(item.id, field, value);

  const handleTouchStart = useCallback((e) => {
    const target = e.target;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.closest('input, select, textarea');
    if (isInput) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setSwipeOffset(0);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) * 1.5) {
      setSwiping(true);
      setSwipeOffset(dx);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!swiping) return;
    if (swipeOffset > SWIPE_THRESHOLD && index > 0) {
      setIndex(i => i - 1);
    } else if (swipeOffset < -SWIPE_THRESHOLD && index < items.length - 1) {
      setIndex(i => i + 1);
    }
    setSwiping(false);
    setSwipeOffset(0);
    touchStartX.current = null;
    touchStartY.current = null;
  }, [swiping, swipeOffset, index, items.length]);

  const canGoPrev = index > 0;
  const canGoNext = index < items.length - 1;

  const currentCat1 = categoriesLevel1.find(c => c.category_name === item.category_level_1);
  const cat2Options = currentCat1
    ? categoriesLevel2.filter(c => c.parent_name === currentCat1.category_name)
    : [];
  const currentCat2 = cat2Options.find(c => c.category_name === item.category_level_2);
  const cat3Options = currentCat2
    ? categoriesLevel3.filter(c => c.parent_name === currentCat2.category_name)
    : [];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        {/* Nav + Counter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIndex(i => Math.max(0, i - 1))}
              disabled={!canGoPrev}
              className="p-1 rounded-lg text-secondary hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-xs font-semibold text-secondary tabular-nums">
              {index + 1} / {items.length}
            </span>
            <button
              onClick={() => setIndex(i => Math.min(items.length - 1, i + 1))}
              disabled={!canGoNext}
              className="p-1 rounded-lg text-secondary hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-tertiary">
            Item {index + 1}
          </div>
        </div>

        {/* Swipeable content area */}
        <div
          ref={contentRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: swiping ? `translateX(${swipeOffset * 0.3}px)` : 'none',
            transition: swiping ? 'none' : 'transform 0.2s ease-out',
          }}
          className="space-y-4"
        >
          {/* Name */}
          <CompactInput
            label="Item Name"
            value={item.friendly_name}
            onChange={(e) => update('friendly_name', e.target.value)}
            inputClass="text-base font-medium"
          />

          {item.original_name && item.original_name !== item.friendly_name && (
            <div className="text-[10px] text-tertiary italic">
              Original: {item.original_name}
            </div>
          )}

          {/* Qty & Price */}
          <div className="grid grid-cols-2 gap-2">
            <CompactInput
              label="Quantity"
              type="number"
              value={item.quantity}
              onChange={(e) => update('quantity', e.target.value)}
            />
            <CompactInput
              label="Price"
              type="number"
              step="0.01"
              value={item.price}
              onChange={(e) => update('price', e.target.value)}
            />
          </div>

          {/* Tax & Discount (conditional) */}
          {(purchase.tax_is_added || purchase.discount_is_applied) && (
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-background rounded-xl border border-white/5">
              {purchase.tax_is_added && (
                <div className="[&_select]:py-1 [&_select]:text-xs [&_div>label]:text-[10px]">
                  <TaxRateInput
                    label="Tax %"
                    value={item.tax_rate}
                    onChange={(val) => update('tax_rate', val)}
                    commonRates={(user?.common_tax_rates || '0,20').split(',')}
                  />
                </div>
              )}
              {purchase.discount_is_applied && (
                <CompactInput
                  label="Discount"
                  type="number"
                  step="0.01"
                  value={item.discount}
                  onChange={(e) => update('discount', e.target.value)}
                />
              )}
            </div>
          )}

          {/* Contributors */}
          <div className="p-2.5 bg-background rounded-xl border border-white/5">
            <ChipSelect
              label="Split Among"
              options={allUsers.map(u => ({ value: u.user_id, label: u.name }))}
              value={item.contributors || []}
              onChange={(val) => update('contributors', val)}
            />
          </div>

          {/* Categories */}
          <div className="space-y-2 p-2.5 bg-background rounded-xl border border-white/5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Categories</span>
            <CreatableSelect
              label="Category 1"
              value={item.category_level_1}
              onChange={(val) => {
                update('category_level_1', val);
                if (!val) {
                  update('category_level_2', '');
                  update('category_level_3', '');
                }
              }}
              options={categoriesLevel1.map(c => ({ value: c.category_name, label: c.category_name }))}
            />
            {item.category_level_1 && (
              <CreatableSelect
                label="Category 2"
                value={item.category_level_2}
                onChange={(val) => {
                  update('category_level_2', val);
                  if (!val) update('category_level_3', '');
                }}
                options={cat2Options.map(c => ({ value: c.category_name, label: c.category_name }))}
              />
            )}
            {item.category_level_2 && (
              <CreatableSelect
                label="Category 3"
                value={item.category_level_3}
                onChange={(val) => update('category_level_3', val)}
                options={cat3Options.map(c => ({ value: c.category_name, label: c.category_name }))}
              />
            )}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};

export default ItemDetailSheet;
