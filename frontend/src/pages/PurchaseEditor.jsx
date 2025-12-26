import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, GripVertical, Info, Save, X, ChevronRight, Receipt, History, AlertTriangle, Loader2, ChevronDown, Search, Maximize2, MoreHorizontal } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useAuthStore from '../store/authStore';
import api, { getCategoriesByLevel, createCategory } from '../api/axios';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Switch from '../components/ui/Switch';
import FloatingInput from '../components/ui/FloatingInput';
import ModernSelect from '../components/ui/ModernSelect';
import CreatableSelect from '../components/ui/CreatableSelect';
import TaxRateInput from '../components/ui/TaxRateInput';

// --- Subcomponents ---

const ContributorSelector = ({ allUsers, selectedIds, onChange, label = "Contributors" }) => {
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

  const toggleUser = (userId) => {
    const updated = selectedIds.includes(userId)
      ? selectedIds.filter(id => id !== userId)
      : [...selectedIds, userId];
    onChange(updated);
  };

  const selectedNames = allUsers
    .filter(u => selectedIds.includes(u.user_id))
    .map(u => u.name)
    .join(', ');

  return (
    <div className="relative pt-3" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-3 pb-2 pt-2 bg-background border border-white/10 rounded-xl outline-none text-white text-sm min-h-[42px] relative"
      >
        <span className="block truncate pr-6">
          {selectedIds.length > 0 ? selectedNames : 'Select...'}
        </span>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary">
          <ChevronDown size={16} />
        </div>
      </button>
      <label className="absolute left-3 top-0 -translate-y-1/2 bg-surface px-1 text-primary text-xs pointer-events-none">
        {label}
      </label>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-surface rounded-xl shadow-xl border border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="max-h-60 overflow-y-auto p-1">
            {allUsers.map(u => (
              <div
                key={u.user_id}
                onClick={() => toggleUser(u.user_id)}
                className={`
                  flex items-center justify-between px-4 py-3 cursor-pointer rounded-lg transition-colors
                  ${selectedIds.includes(u.user_id) ? 'bg-primary/20 text-primary' : 'text-white hover:bg-white/5'}
                `}
              >
                <span className="text-sm font-medium">{u.name}</span>
                {selectedIds.includes(u.user_id) && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SortableItem = ({ 
  item, 
  purchase, 
  updateItem, 
  deleteItem, 
  allUsers, 
  categoriesLevel1, 
  categoriesLevel2, 
  categoriesLevel3,
  user
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  const [expanded, setExpanded] = useState(false);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-surface rounded-3xl p-4 shadow-sm border border-white/5 transition-all ${isDragging ? 'ring-2 ring-primary shadow-2xl scale-105' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners}
          className="mt-3 text-secondary/50 touch-none"
        >
          <GripVertical size={20} />
        </div>

        <div className="flex-grow space-y-4">
          {/* Header Row: Name & Delete */}
          <div className="flex gap-2">
            <div className="flex-grow">
                <FloatingInput
                    label="Item Name"
                    value={item.friendly_name}
                    onChange={(e) => updateItem(item.id, 'friendly_name', e.target.value)}
                />
            </div>
            <button 
                onClick={() => deleteItem(item.id)}
                className="mt-2 p-2 text-secondary hover:text-error transition"
            >
                <Trash2 size={20} />
            </button>
          </div>

          {/* Primary Details Row */}
          <div className="grid grid-cols-2 gap-3">
            <FloatingInput
                label="Qty"
                type="number"
                value={item.quantity}
                onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
            />
            <FloatingInput
                label="Price"
                type="number"
                step="0.01"
                value={item.price}
                onChange={(e) => updateItem(item.id, 'price', e.target.value)}
            />
          </div>

          {/* Advanced Details (Tax/Discount) - Conditional */}
          {(purchase.tax_is_added || purchase.discount_is_applied) && (
            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                {purchase.tax_is_added && (
                    <TaxRateInput
                        label="Tax %"
                        value={item.tax_rate}
                        onChange={(val) => updateItem(item.id, 'tax_rate', val)}
                        commonRates={(user?.common_tax_rates || "0,20").split(',')}
                    />
                )}
                {purchase.discount_is_applied && (
                    <FloatingInput
                        label="Discount"
                        type="number"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
                    />
                )}
            </div>
          )}

          {/* Contributors */}
          <ContributorSelector
            label="Split Among"
            allUsers={allUsers}
            selectedIds={item.contributors || []}
            onChange={(updated) => updateItem(item.id, 'contributors', updated)}
          />

          {/* Categories - Expandable */}
          <div>
            <button 
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-bold text-primary flex items-center gap-1 mb-2"
            >
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                Categories
            </button>
            
            {expanded && (
                <div className="space-y-3 p-3 bg-background/50 rounded-2xl animate-in fade-in slide-in-from-top-2">
                    <CreatableSelect
                        label="Category 1"
                        value={item.category_level_1}
                        onChange={(val) => updateItem(item.id, 'category_level_1', val)}
                        options={categoriesLevel1.map(c => ({ value: c.category_name, label: c.category_name }))}
                    />
                    {item.category_level_1 && (
                        <CreatableSelect
                            label="Category 2"
                            value={item.category_level_2}
                            onChange={(val) => updateItem(item.id, 'category_level_2', val)}
                            options={categoriesLevel2.map(c => ({ value: c.category_name, label: c.category_name }))}
                        />
                    )}
                    {item.category_level_2 && (
                        <CreatableSelect
                            label="Category 3"
                            value={item.category_level_3}
                            onChange={(val) => updateItem(item.id, 'category_level_3', val)}
                            options={categoriesLevel3.map(c => ({ value: c.category_name, label: c.category_name }))}
                        />
                    )}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Editor Component ---

const PurchaseEditor = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [purchase, setPurchase] = useState({
    purchase_name: '',
    purchase_date: new Date().toISOString().split('T')[0],
    payer_user_id: user?.user_id || '',
    tax_is_added: false,
    discount_is_applied: false,
  });

  const [globalContributors, setGlobalContributors] = useState(user?.user_id ? [user.user_id] : []);
  const [items, setItems] = useState([]);
  const [receiptImages, setReceiptImages] = useState([]);
  const [viewImage, setViewImage] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [categoriesLevel1, setCategoriesLevel1] = useState([]);
  const [categoriesLevel2, setCategoriesLevel2] = useState([]);
  const [categoriesLevel3, setCategoriesLevel3] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- Effects & Data Fetching (Same as before) ---
  useEffect(() => {
    if (!user?.user_id) return;
    const fetchCategories = async (level, setter) => {
      try {
        const data = await getCategoriesByLevel(level);
        setter(data);
      } catch (error) {}
    };
    fetchCategories(1, setCategoriesLevel1);
    fetchCategories(2, setCategoriesLevel2);
    fetchCategories(3, setCategoriesLevel3);
  }, [user?.user_id]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/purchases/users/all');
        setAllUsers(response.data);
      } catch (err) {}
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!user?.user_id || id) return;
    if (location.state?.extractedData && items.length === 0) {
      const { extractedData, receiptImages: images } = location.state;
      const itemsArray = Array.isArray(extractedData) ? extractedData : (extractedData.items || []);
      const mappedItems = itemsArray.map((item, index) => ({
        id: Date.now() + index,
        original_name: item.extracted_name || item.original_name || '',
        friendly_name: item.friendly_name || item.extracted_name || '',
        quantity: item.quantity || 1,
        price: item.price || 0,
        discount: item.discount || 0,
        tax_rate: item.tax_rate || user.default_tax_rate || 0,
        category_level_1: item.category_level_1 || '',
        category_level_2: item.category_level_2 || '',
        category_level_3: item.category_level_3 || '',
        contributors: globalContributors,
      }));
      setItems(mappedItems);
      if (images) setReceiptImages(images);
      const hasDiscount = mappedItems.some(i => (i.discount || 0) > 0);
      setPurchase(p => ({ 
        ...p, 
        payer_user_id: user.user_id,
        purchase_name: `Scan ${new Date().toLocaleDateString()}`,
        discount_is_applied: hasDiscount
      }));
    } else if (items.length === 0) {
      addItem();
    }
  }, [user, id, location.state]);

  useEffect(() => {
    if (id) {
      const fetchPurchase = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/purchases/${id}`);
          const p = response.data;
          setPurchase({
            purchase_name: p.purchase_name,
            purchase_date: p.purchase_date,
            payer_user_id: p.payer_user_id,
            tax_is_added: p.tax_is_added,
            discount_is_applied: p.discount_is_applied,
          });
          if (p.images) {
            setReceiptImages(p.images.map(img => ({ url: img.url, blob: null })));
          }
          const mappedItems = p.items.map(item => ({
            id: item.item_id,
            original_name: item.original_name || '',
            friendly_name: item.friendly_name || '',
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0,
            tax_rate: item.tax_rate || 0,
            category_level_1: item.category_level_1 || '',
            category_level_2: item.category_level_2 || '',
            category_level_3: item.category_level_3 || '',
            contributors: item.contributors
          }));
          setItems(mappedItems);
        } catch (err) {} finally {
          setLoading(false);
        }
      };
      fetchPurchase();
    }
  }, [id]);

  // --- Handlers ---

  const addItem = () => {
    if (!user?.user_id) return;
    setItems([{
      id: Date.now(),
      friendly_name: '',
      original_name: '',
      quantity: 1,
      price: 0,
      discount: 0,
      tax_rate: user.default_tax_rate || 0,
      category_level_1: '',
      category_level_2: '',
      category_level_3: '',
      contributors: globalContributors,
    }, ...items]);
  };

  const applyGlobalContributors = () => {
    setItems(items.map(item => ({ ...item, contributors: globalContributors })));
  };

  const deleteItem = (id) => setItems(items.filter(item => item.id !== id));

  const updateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'category_level_1' && !value) {
          updated.category_level_2 = '';
          updated.category_level_3 = '';
        }
        if (field === 'category_level_2' && !value) updated.category_level_3 = '';
        return updated;
      }
      return item;
    }));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleConfirm = async () => {
    if (!purchase.purchase_name) {
      alert("Please provide a purchase name");
      return;
    }
    setLoading(true);
    try {
      const allExistingCategoryNames = new Set([
        ...categoriesLevel1.map(c => c.category_name),
        ...categoriesLevel2.map(c => c.category_name),
        ...categoriesLevel3.map(c => c.category_name),
      ]);

      for (const item of items) {
        for (let i = 1; i <= 3; i++) {
          const categoryName = item[`category_level_${i}`];
          if (categoryName && !allExistingCategoryNames.has(categoryName)) {
            await createCategory(categoryName, i);
            allExistingCategoryNames.add(categoryName);
          }
        }
      }

      const purchaseData = {
        ...purchase,
        payer_user_id: parseInt(purchase.payer_user_id),
        items: items.map((item) => ({
          original_name: item.original_name || item.friendly_name || '',
          friendly_name: item.friendly_name || '',
          price: parseFloat(item.price) || 0,
          quantity: parseInt(item.quantity) || 1,
          discount: parseFloat(item.discount) || 0,
          tax_rate: parseFloat(item.tax_rate) || 0,
          category_level_1: item.category_level_1 || '',
          category_level_2: item.category_level_2 || '',
          category_level_3: item.category_level_3 || '',
          contributors: (item.contributors || []).map(c => parseInt(c)).filter(c => !isNaN(c))
        }))
      };

      if (id) {
        await api.put(`/purchases/${id}`, purchaseData);
      } else {
        const formData = new FormData();
        formData.append('purchase_data', JSON.stringify(purchaseData));
        receiptImages.forEach(img => {
          if (img.blob) formData.append('files', img.blob, img.blob.name);
        });
        const response = await api.post('/purchases', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        const newId = response.data.purchase_id;
        await api.post(`/purchases/${newId}/logs`, { message: `Purchase created by user ${user.user_id}` });
      }
      navigate('/');
    } catch (err) {
      alert("Failed to save purchase");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePurchase = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/purchases/${id}`);
      navigate('/');
    } catch (err) {
      alert("Failed to delete purchase");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchLogs = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/purchases/${id}/logs`);
      setLogs(response.data);
      setShowLogs(true);
    } catch (err) {}
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => {
        const base = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
        const withTax = base * (1 + (parseFloat(item.tax_rate) || 0) / 100);
        return acc + withTax - (parseFloat(item.discount) || 0);
    }, 0).toFixed(2);
  };

  return (
    <div className="max-w-3xl mx-auto pb-40 px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">
            {id ? 'Edit Purchase' : 'New Purchase'}
        </h1>
        {id && (
            <button onClick={() => setShowDeleteConfirm(true)} className="p-2 bg-error/10 text-error rounded-xl">
                <Trash2 size={20} />
            </button>
        )}
      </div>

      {/* Metadata Card */}
      <div className="bg-surface rounded-3xl p-5 mb-6 space-y-4 shadow-lg border border-white/5">
        <FloatingInput 
            label="Purchase Name"
            value={purchase.purchase_name}
            onChange={(e) => setPurchase({...purchase, purchase_name: e.target.value})}
        />
        <div className="grid grid-cols-2 gap-4">
            <FloatingInput 
                label="Date"
                type="date"
                value={purchase.purchase_date}
                onChange={(e) => setPurchase({...purchase, purchase_date: e.target.value})}
            />
            <ModernSelect 
                label="Payer"
                value={purchase.payer_user_id}
                onChange={(e) => setPurchase({...purchase, payer_user_id: parseInt(e.target.value)})}
                options={allUsers.map(u => ({ value: u.user_id, label: u.name + (u.user_id === user?.user_id ? ' (You)' : '') }))}
            />
        </div>

        {/* Global Contributors with Integrated Apply Button */}
        <div className="bg-background/50 p-4 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Defaults</span>
                <button 
                    onClick={applyGlobalContributors}
                    className="text-xs font-bold text-primary hover:text-white transition flex items-center gap-1"
                >
                    Apply to all items <ChevronRight size={12} />
                </button>
            </div>
            <ContributorSelector 
                label="Default Contributors"
                allUsers={allUsers}
                selectedIds={globalContributors}
                onChange={setGlobalContributors}
            />
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 gap-4 pt-2">
            <Switch 
                label="Add Tax"
                checked={purchase.tax_is_added}
                onChange={(checked) => setPurchase({...purchase, tax_is_added: checked})}
                className="justify-center bg-background py-3 rounded-xl border border-white/5"
            />
            <Switch 
                label="Discount"
                checked={purchase.discount_is_applied}
                onChange={(checked) => setPurchase({...purchase, discount_is_applied: checked})}
                className="justify-center bg-background py-3 rounded-xl border border-white/5"
            />
        </div>

        {/* Receipt Images */}
        {receiptImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto py-2">
                {receiptImages.map((img, i) => (
                    <div key={i} className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/10" onClick={() => setViewImage(img.url)}>
                        <img src={img.url} className="w-full h-full object-cover" />
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Items List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Items ({items.length})
            </h2>
            <span className="text-lg font-bold text-primary">
                Total: {calculateTotal()}
            </span>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                {items.map((item) => (
                    <SortableItem
                        key={item.id}
                        item={item}
                        purchase={purchase}
                        updateItem={updateItem}
                        deleteItem={deleteItem}
                        allUsers={allUsers}
                        categoriesLevel1={categoriesLevel1}
                        categoriesLevel2={categoriesLevel2}
                        categoriesLevel3={categoriesLevel3}
                        user={user}
                    />
                ))}
            </SortableContext>
        </DndContext>

        <button
            onClick={addItem}
            className="w-full py-4 bg-surface border-2 border-dashed border-white/10 rounded-3xl text-secondary hover:text-white hover:border-white/20 transition flex items-center justify-center gap-2 font-bold"
        >
            <Plus size={20} />
            Add New Item
        </button>
      </div>

      {/* Sticky Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-white/5 p-4 z-50 pb-safe-bottom">
        <div className="max-w-3xl mx-auto flex gap-3">
            <button 
                onClick={() => navigate(-1)}
                className="flex-1 py-3 bg-background text-white font-bold rounded-2xl hover:bg-white/10 transition"
            >
                Cancel
            </button>
            <button 
                onClick={handleConfirm}
                disabled={loading}
                className="flex-[2] py-3 bg-primary text-white font-bold rounded-2xl hover:opacity-90 transition shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                Save Purchase
            </button>
        </div>
      </div>

      {/* Modals (Image Viewer, Logs, Delete Confirm) */}
      {viewImage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-4" onClick={() => setViewImage(null)}>
            <img src={viewImage} className="max-w-full max-h-full object-contain" />
            <button className="absolute top-4 right-4 text-white p-2 bg-white/10 rounded-full"><X /></button>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-surface w-full max-w-sm rounded-3xl p-6 text-center border border-white/10">
                <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Purchase?</h3>
                <p className="text-secondary text-sm mb-6">This cannot be undone.</p>
                <div className="flex gap-3">
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-background rounded-xl font-bold text-white">Cancel</button>
                    <button onClick={handleDeletePurchase} disabled={actionLoading} className="flex-1 py-3 bg-error rounded-xl font-bold text-white">Delete</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseEditor;
