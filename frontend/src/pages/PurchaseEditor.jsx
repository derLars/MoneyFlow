import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, GripVertical, Save, X, ChevronRight, Receipt, History, AlertTriangle, Loader2, MoveVertical, Check, Camera } from 'lucide-react';
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
import CompactInput from '../components/ui/CompactInput';
import ChipSelect from '../components/ui/ChipSelect';
import CompactCard from '../components/ui/CompactCard';
import ItemDetailSheet from './ItemDetailSheet';

const SortableRow = ({
  item, allUsers, index, onEdit, isReorderMode
}) => {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.7 : 1,
  };

  const itemTotal = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);

  return (
    <div ref={setNodeRef} style={style}>
      <CompactCard
        onClick={isReorderMode ? undefined : () => onEdit(index)}
        className={`flex items-center gap-2 ${isDragging ? 'ring-2 ring-primary shadow-xl scale-105' : ''}`}
      >
        {isReorderMode && (
          <div {...attributes} {...listeners} className="text-secondary/40 touch-none p-1">
            <GripVertical size={18} />
          </div>
        )}
        {!isReorderMode && (
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Receipt size={14} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate leading-tight">
            {item.friendly_name || <span className="text-tertiary italic">Unnamed item</span>}
          </div>
          <div className="text-[10px] text-secondary mt-0.5 truncate">
            {item.quantity} × €{parseFloat(item.price || 0).toFixed(2)}
            {item.contributors?.length > 0 && (
              <>
                <span className="mx-1 text-tertiary">·</span>
                {item.contributors.map((userId, i) => {
                  const u = allUsers.find(u => u.user_id === userId);
                  return u ? (
                    <span key={userId} className="text-[8px] px-1 py-0.5 bg-primary/10 text-primary/80 rounded-full">
                      {u.name}
                    </span>
                  ) : null;
                })}
              </>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-bold text-white">€{itemTotal.toFixed(2)}</div>
        </div>
        {!isReorderMode && (
          <ChevronRight size={14} className="text-secondary/30 flex-shrink-0" />
        )}
      </CompactCard>
    </div>
  );
};

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
    project_id: null,
    tax_is_added: true,
    discount_is_applied: true,
  });

  const [globalContributors, setGlobalContributors] = useState(user?.user_id ? [user.user_id] : []);
  const [items, setItems] = useState([]);
  const [receiptImages, setReceiptImages] = useState([]);
  const [viewImage, setViewImage] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);

  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [detailSheetIndex, setDetailSheetIndex] = useState(0);

  const [categoriesLevel1, setCategoriesLevel1] = useState([]);
  const [categoriesLevel2, setCategoriesLevel2] = useState([]);
  const [categoriesLevel3, setCategoriesLevel3] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
    if (!purchase.project_id) return;
    const fetchProjectParticipants = async () => {
      try {
        const response = await api.get(`/projects/${purchase.project_id}`);
        const participants = response.data.participants.map(p => ({
          user_id: p.user_id,
          name: p.user_name + (!p.is_active ? ' (removed)' : ''),
          is_active: p.is_active
        }));
        setAllUsers(participants);
      } catch (err) {
        console.error("Failed to fetch project participants", err);
      }
    };
    fetchProjectParticipants();
  }, [purchase.project_id]);

  useEffect(() => {
    if (!user?.user_id || id) return;
    const queryParams = new URLSearchParams(location.search);
    const projectId = queryParams.get('project_id');
    if (projectId) {
        setPurchase(p => ({ ...p, project_id: parseInt(projectId) }));
    }
    if (location.state?.extractedData && items.length === 0) {
      const { extractedData, receiptImages: images, project_id } = location.state;
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
      setPurchase(p => ({
        ...p,
        payer_user_id: user.user_id,
        purchase_name: `Scan ${new Date().toLocaleDateString()}`,
        project_id: project_id ? parseInt(project_id) : (projectId ? parseInt(projectId) : null)
      }));
    } else if (items.length === 0) {
      addItem();
    }
  }, [user, id, location.state, location.search]);

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
            project_id: p.project_id,
            tax_is_added: p.tax_is_added,
            discount_is_applied: p.discount_is_applied,
          });
          if (p.images) {
            setReceiptImages(p.images.map(img => ({ url: img.url, blob: null })));
          }
          if (p.involved_users) {
            const involved = p.involved_users.map(u => ({ user_id: u.user_id, name: u.name }));
            setAllUsers(prev => {
                const map = new Map(prev.map(u => [u.user_id, u]));
                involved.forEach(u => {
                    if (!map.has(u.user_id)) map.set(u.user_id, u);
                });
                return Array.from(map.values());
            });
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

  const addItem = (index = null) => {
    if (!user?.user_id) return;
    const newItem = {
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
    };
    if (index !== null) {
      const newItems = [...items];
      newItems.splice(index, 0, newItem);
      setItems(newItems);
    } else {
      setItems([...items, newItem]);
    }
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

  const openDetailSheet = (index) => {
    setDetailSheetIndex(index);
    setDetailSheetOpen(true);
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

      if (!purchase.project_id && !id) {
        alert("Project ID is missing. Please create purchase from a project page.");
        return;
      }

      const purchaseData = {
        ...purchase,
        payer_user_id: parseInt(purchase.payer_user_id),
        project_id: parseInt(purchase.project_id),
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

      if (location.state?.fromAdmin) {
        navigate('/admin');
      } else if (purchase.project_id) {
        navigate(`/projects/${purchase.project_id}`);
      } else {
        navigate('/');
      }
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
      if (location.state?.fromAdmin) {
        navigate('/admin');
      } else if (purchase.project_id) {
        navigate(`/projects/${purchase.project_id}`);
      } else {
        navigate('/');
      }
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

  const calculateBreakdown = () => {
    const breakdown = { total: 0, byUser: {} };
    items.forEach(item => {
      const base = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
      const withTax = base * (1 + (parseFloat(item.tax_rate) || 0) / 100);
      const itemTotal = withTax - (parseFloat(item.discount) || 0);
      breakdown.total += itemTotal;
      const contributors = item.contributors || [];
      if (contributors.length > 0) {
        const share = itemTotal / contributors.length;
        contributors.forEach(userId => {
          breakdown.byUser[userId] = (breakdown.byUser[userId] || 0) + share;
        });
      }
    });
    return breakdown;
  };

  const { total, byUser } = calculateBreakdown();

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-32">
      {/* Compact Header */}
      <div className="bg-surface rounded-xl border border-white/5 p-3 mb-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={purchase.purchase_name}
              onChange={(e) => setPurchase({...purchase, purchase_name: e.target.value})}
              placeholder="Purchase name"
              className="w-full bg-transparent text-base font-bold text-white outline-none placeholder:text-tertiary"
            />
          </div>
          {id && (
            <button onClick={() => setShowDeleteConfirm(true)} className="p-1.5 text-error/60 hover:text-error transition">
              <Trash2 size={16} />
            </button>
          )}
          {id && (
            <button onClick={fetchLogs} className="p-1.5 text-secondary/40 hover:text-secondary transition">
              <History size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="w-28">
            <CompactInput
              label="Date"
              type="date"
              value={purchase.purchase_date}
              onChange={(e) => setPurchase({...purchase, purchase_date: e.target.value})}
            />
          </div>
          <div className="flex-1 min-w-[100px]">
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Payer</label>
              <select
                value={purchase.payer_user_id}
                onChange={(e) => setPurchase({...purchase, payer_user_id: parseInt(e.target.value)})}
                className="w-full px-2.5 py-1.5 bg-background border border-white/10 rounded-lg text-white text-sm outline-none focus:border-primary"
              >
                <option value="" disabled>Select...</option>
                {allUsers.map(u => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.name}{u.user_id === user?.user_id ? ' (You)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>


        </div>

        {/* Default split */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <ChipSelect
              label="Default split"
              options={allUsers.map(u => ({ value: u.user_id, label: u.name }))}
              value={globalContributors}
              onChange={setGlobalContributors}
              maxDisplay={3}
            />
          </div>
          {items.length > 0 && (
            <button
              onClick={applyGlobalContributors}
              className="flex-shrink-0 text-[10px] font-bold text-primary/70 hover:text-primary transition mt-4 uppercase tracking-wider"
            >
              Apply all
            </button>
          )}
        </div>

        {/* Receipt thumbnails */}
        {receiptImages.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto">
            {receiptImages.map((img, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 cursor-pointer"
                onClick={() => setViewImage(img.url)}
              >
                <img src={img.url} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Items Header */}
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white">Items</h2>
          <span className="text-[10px] font-medium text-secondary bg-white/5 px-2 py-0.5 rounded-full">{items.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-sm font-bold text-primary">€{total.toFixed(2)}</span>
            {Object.keys(byUser).length > 1 && (
              <div className="text-[9px] text-secondary leading-tight">
                {Object.entries(byUser).slice(0, 3).map(([userId, amount]) => {
                  const userName = allUsers.find(u => u.user_id === parseInt(userId))?.name || '?';
                  return `${userName}: €${amount.toFixed(2)}`;
                }).join(', ')}
                {Object.keys(byUser).length > 3 && ' ...'}
              </div>
            )}
          </div>
          {items.length > 1 && (
            <button
              onClick={() => setReorderMode(!reorderMode)}
              className={`p-1.5 rounded-lg transition ${reorderMode ? 'bg-primary/20 text-primary' : 'text-secondary/40 hover:text-secondary'}`}
              title={reorderMode ? 'Done reordering' : 'Reorder items'}
            >
              {reorderMode ? <Check size={16} /> : <MoveVertical size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-1.5">
        {items.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {items.map((item, index) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  allUsers={allUsers}
                  index={index}
                  onEdit={openDetailSheet}
                  isReorderMode={reorderMode}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-10 bg-surface rounded-xl border border-dashed border-white/10">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-background text-secondary rounded-xl mb-3">
              <Receipt size={24} />
            </div>
            <p className="text-white text-sm font-medium">No items yet</p>
            <p className="text-[11px] text-secondary mt-1">Add items from a receipt scan or manually</p>
          </div>
        )}

        <button
          onClick={() => addItem(items.length)}
          className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-dashed border-white/10 rounded-xl text-secondary hover:text-white transition flex items-center justify-center gap-1.5 font-medium text-xs"
        >
          <Plus size={14} />
          Add Item
        </button>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-white/5 p-3 z-50 pb-safe-bottom">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <button
            onClick={() => addItem(items.length)}
            className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-secondary hover:text-white rounded-xl transition flex items-center gap-1.5 font-medium text-xs flex-shrink-0"
          >
            <Plus size={14} />
            Item
          </button>
          <div className="flex-1 text-center">
            <span className="text-sm font-bold text-primary">€{total.toFixed(2)}</span>
            {Object.keys(byUser).length > 1 && (
              <div className="text-[9px] text-secondary leading-tight">
                {Object.entries(byUser).slice(0, 2).map(([userId, amount]) => {
                  const userName = allUsers.find(u => u.user_id === parseInt(userId))?.name || '?';
                  return `${userName}: €${amount.toFixed(2)}`;
                }).join(', ')}
                {Object.keys(byUser).length > 2 && ` +${Object.keys(byUser).length - 2}`}
              </div>
            )}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 bg-background text-white font-bold rounded-xl hover:bg-white/10 transition text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-primary/20 flex items-center justify-center gap-1.5 text-xs disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
            Save
          </button>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {viewImage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-4" onClick={() => setViewImage(null)}>
          <img src={viewImage} className="max-w-full max-h-full object-contain" />
          <button className="absolute top-4 right-4 text-white p-2 bg-white/10 rounded-full"><X /></button>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-sm rounded-2xl p-5 text-center border border-white/10">
            <div className="w-12 h-12 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Delete Purchase?</h3>
            <p className="text-secondary text-xs mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 bg-background rounded-xl font-bold text-white text-xs">Cancel</button>
              <button onClick={handleDeletePurchase} disabled={actionLoading} className="flex-1 py-2.5 bg-error rounded-xl font-bold text-white text-xs">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowLogs(false)}>
          <div className="bg-surface w-full max-w-md rounded-2xl p-5 border border-white/10 max-h-[60vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">History</h3>
              <button onClick={() => setShowLogs(false)} className="text-secondary hover:text-white"><X size={20} /></button>
            </div>
            {logs.length > 0 ? (
              <div className="space-y-2">
                {logs.map((log, i) => (
                  <div key={i} className="text-xs text-secondary bg-background rounded-lg p-2.5">
                    <span className="text-white font-medium">{log.message}</span>
                    <div className="text-[10px] text-tertiary mt-0.5">{log.timestamp}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary text-xs text-center py-6">No history recorded.</p>
            )}
          </div>
        </div>
      )}

      {/* Item Detail Sheet */}
      <ItemDetailSheet
        isOpen={detailSheetOpen}
        onClose={() => setDetailSheetOpen(false)}
        items={items}
        currentIndex={detailSheetIndex}
        onUpdateItem={updateItem}
        onDeleteItem={deleteItem}
        allUsers={allUsers}
        categoriesLevel1={categoriesLevel1}
        categoriesLevel2={categoriesLevel2}
        categoriesLevel3={categoriesLevel3}
        user={user}
      />
    </div>
  );
};

export default PurchaseEditor;
