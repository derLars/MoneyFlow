import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, GripVertical, Info, Save, X, ChevronRight, CheckSquare, Square, Receipt, History, AlertTriangle, Loader2, ChevronDown, Search } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

const ContributorDropdown = ({ allUsers, selectedIds, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  const sortedUsers = [...allUsers]
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

  const toggleUser = (userId) => {
    const updated = selectedIds.includes(userId)
      ? selectedIds.filter(id => id !== userId)
      : [...selectedIds, userId];
    onChange(updated);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 bg-light-gray rounded text-sm text-charcoal-gray border border-transparent focus:border-deep-blue transition"
      >
        <span className="truncate">
          {selectedIds.length === 0 
            ? 'Select contributors...' 
            : `${selectedIds.length} contributor${selectedIds.length > 1 ? 's' : ''} selected`}
        </span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              className="bg-transparent text-xs outline-none w-full"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {sortedUsers.map(u => (
              <label
                key={u.user_id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-blue-50 cursor-pointer transition"
              >
                <div 
                    onClick={(e) => { e.preventDefault(); toggleUser(u.user_id); }}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                        selectedIds.includes(u.user_id) ? 'bg-deep-blue border-deep-blue text-white' : 'bg-white border-gray-300'
                    }`}
                >
                    {selectedIds.includes(u.user_id) && <CheckSquare size={12} />}
                </div>
                <span className="text-sm font-medium text-charcoal-gray">{u.name}</span>
              </label>
            ))}
            {sortedUsers.length === 0 && (
                <p className="p-4 text-xs text-gray-400 text-center italic">No users found</p>
            )}
          </div>
        </div>
      )}
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
    tax_is_added: false,
    discount_is_applied: false,
  });

  const [items, setItems] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Initialize items from location state (OCR scan results) or default first item
  useEffect(() => {
    if (!user?.user_id || id) return;

    if (location.state?.extractedData && items.length === 0) {
      const { extractedData } = location.state;
      console.log("DEBUG: Initializing editor with extracted data:", extractedData);
      
      const mappedItems = extractedData.map((item, index) => ({
        id: Date.now() + index,
        friendly_name: item.friendly_name || item.extracted_name || '',
        original_name: item.extracted_name || '',
        quantity: item.quantity || 1,
        price: item.price || 0,
        category_level_1: item.category_level_1 || '',
        category_level_2: item.category_level_2 || '',
        category_level_3: item.category_level_3 || '',
        contributors: [user.user_id],
      }));
      
      setItems(mappedItems);
      setPurchase(p => ({ 
        ...p, 
        payer_user_id: user.user_id,
        purchase_name: `Scan ${new Date().toLocaleDateString()}`
      }));
    } else if (items.length === 0) {
      setItems([{
        id: Date.now(),
        friendly_name: '',
        original_name: '',
        quantity: 1,
        price: 0,
        category_level_1: '',
        category_level_2: '',
        category_level_3: '',
        contributors: [user.user_id],
      }]);
      setPurchase(p => ({ ...p, payer_user_id: user.user_id }));
    }
  }, [user, id, location.state]);

  const addItem = () => {
    if (!user?.user_id) return;
    setItems([
      {
        id: Date.now(),
        friendly_name: '',
        original_name: '',
        quantity: 1,
        price: 0,
        category_level_1: '',
        category_level_2: '',
        category_level_3: '',
        contributors: [user.user_id],
      },
      ...items,
    ]);
  };

  const deleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/purchases/users/all');
        setAllUsers(response.data);
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    };
    fetchUsers();
  }, []);

  // Fetch purchase details if in edit mode (Section 5.6 Review Mode)
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
          console.log("DEBUG: Received items from backend:", p.items);
          const mappedItems = p.items.map(item => ({
            id: item.item_id,
            friendly_name: item.friendly_name || '',
            original_name: item.original_name || '',
            quantity: item.quantity,
            price: item.price,
            category_level_1: item.category_level_1 || '',
            category_level_2: item.category_level_2 || '',
            category_level_3: item.category_level_3 || '',
            contributors: item.contributors
          }));
          console.log("DEBUG: Setting mapped items into state:", mappedItems);
          setItems(mappedItems);
        } catch (err) {
          console.error('Failed to fetch purchase details', err);
          alert("Failed to load purchase details: " + (err.response?.data?.detail || err.message));
        } finally {
          setLoading(false);
        }
      };
      fetchPurchase();
    }
  }, [id]);

  const fetchLogs = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/purchases/${id}/logs`);
      setLogs(response.data);
      setShowLogs(true);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
  };

  const handleDeletePurchase = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/purchases/${id}`);
      alert("Purchase deleted successfully");
      navigate('/');
    } catch (err) {
      alert("Failed to delete purchase");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!purchase.purchase_name) {
      alert("Please provide a purchase name");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...purchase,
        payer_user_id: parseInt(purchase.payer_user_id),
        items: items.map(({ id: _, ...item }) => ({
          ...item,
          price: parseFloat(item.price) || 0,
          quantity: parseInt(item.quantity) || 1,
          contributors: item.contributors.map(c => parseInt(c)).filter(c => !isNaN(c))
        }))
      };

      if (id) {
        await api.put(`/purchases/${id}`, payload);
      } else {
        const response = await api.post('/purchases/', payload);
        const newId = response.data.purchase_id;
        await api.post(`/purchases/${newId}/logs`, { message: `Purchase created by user ${user.user_id}` });
      }
      
      alert("Purchase saved successfully!");
      navigate('/');
    } catch (err) {
      console.error('Failed to save purchase', err);
      const detail = err.response?.data?.detail;
      const errorMsg = Array.isArray(detail) 
        ? detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join('\n')
        : (detail || err.message);
      alert("Failed to save purchase:\n" + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Category dependency logic (Section 10.2)
        if (field === 'category_level_1' && !value) {
          updated.category_level_2 = '';
          updated.category_level_3 = '';
        }
        if (field === 'category_level_2' && !value) {
          updated.category_level_3 = '';
        }
        return updated;
      }
      return item;
    }));
  };

  const calculateContributorTotals = () => {
    const totals = {};
    items.forEach(item => {
      if (!item.contributors || item.contributors.length === 0) return;
      const share = ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)) / item.contributors.length;
      item.contributors.forEach(userId => {
        totals[userId] = (totals[userId] || 0) + share;
      });
    });
    return totals;
  };

  const contributorTotals = calculateContributorTotals();

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Section 1: Purchase Details Header */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-deep-blue mb-6 flex items-center gap-2">
          <Info size={20} />
          Purchase Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-charcoal-gray mb-1">Purchase Name</label>
            <input
              type="text"
              className="w-full p-2 bg-light-gray border-transparent rounded-md focus:ring-2 focus:ring-deep-blue outline-none"
              placeholder="e.g., Weekly Groceries"
              value={purchase.purchase_name}
              onChange={(e) => setPurchase({ ...purchase, purchase_name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-gray mb-1">Purchase Date</label>
            <input
              type="date"
              className="w-full p-2 bg-light-gray border-transparent rounded-md focus:ring-2 focus:ring-deep-blue outline-none"
              value={purchase.purchase_date}
              onChange={(e) => setPurchase({ ...purchase, purchase_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-gray mb-1">Payer</label>
            <select
              className="w-full p-2 bg-light-gray border-transparent rounded-md focus:ring-2 focus:ring-deep-blue outline-none"
              value={purchase.payer_user_id}
              onChange={(e) => setPurchase({ ...purchase, payer_user_id: parseInt(e.target.value) })}
            >
              {allUsers.map(u => (
                <option key={u.user_id} value={u.user_id}>
                  {u.name} {u.user_id === user?.user_id ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div onClick={() => setPurchase({...purchase, tax_is_added: !purchase.tax_is_added})}>
              {purchase.tax_is_added ? <CheckSquare className="text-deep-blue" size={20} /> : <Square className="text-gray-400 group-hover:text-deep-blue" size={20} />}
            </div>
            <span className="text-sm font-medium text-charcoal-gray">Add Tax</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
             <div onClick={() => setPurchase({...purchase, discount_is_applied: !purchase.discount_is_applied})}>
              {purchase.discount_is_applied ? <CheckSquare className="text-deep-blue" size={20} /> : <Square className="text-gray-400 group-hover:text-deep-blue" size={20} />}
            </div>
            <span className="text-sm font-medium text-charcoal-gray">Apply discounts</span>
          </label>
        </div>
      </section>

      {/* Section 2: Interactive Item List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-deep-blue flex items-center gap-2">
            <Receipt size={20} />
            Items
          </h2>
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-4 py-2 bg-deep-blue text-white rounded-md hover:opacity-90 transition text-sm font-bold shadow-sm"
          >
            <Plus size={18} />
            Add Item
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-100 flex overflow-hidden group">
              {/* Drag Handle */}
              <div className="w-10 bg-gray-50 flex items-center justify-center text-gray-300 border-r border-gray-100 cursor-grab active:cursor-grabbing">
                <GripVertical size={20} />
              </div>

              {/* Card Content */}
              <div className="flex-grow p-4 space-y-4">
                {/* Top Row: Names */}
                <div className="flex justify-between items-start">
                  <div className="flex-grow max-w-md">
                    <input
                      type="text"
                      className="w-full text-lg font-bold text-charcoal-gray bg-transparent border-b border-transparent focus:border-deep-blue outline-none transition"
                      placeholder="Friendly Name"
                      value={item.friendly_name}
                      onChange={(e) => updateItem(item.id, 'friendly_name', e.target.value)}
                    />
                    {item.original_name && (
                      <p className="text-xs text-gray-400 mt-1 italic">Original: {item.original_name}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => deleteItem(item.id)}
                    className="text-gray-300 hover:text-alert-red transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* Middle Row 1: Qty, Price, Categories */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      className="w-full p-2 bg-light-gray rounded outline-none focus:ring-1 focus:ring-deep-blue"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-2 bg-light-gray rounded outline-none focus:ring-1 focus:ring-deep-blue"
                      value={item.price}
                      onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Contributors</label>
                    <ContributorDropdown 
                        allUsers={allUsers}
                        selectedIds={item.contributors || []}
                        onChange={(updated) => updateItem(item.id, 'contributors', updated)}
                    />
                  </div>
                </div>

                {/* Per-person Contribution Display */}
                {(item.contributors?.length > 0) && (
                  <div className="text-[11px] font-bold text-deep-blue flex items-center gap-1 bg-blue-50/50 w-fit px-3 py-1 rounded-full">
                    <Info size={12} />
                    Share: {((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1) / item.contributors.length).toFixed(2)} per person
                  </div>
                )}

                {/* Middle Row 2: Category Levels */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 p-3 rounded-md">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Category 1</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Food"
                      className="w-full p-2 bg-white border border-gray-200 rounded text-sm outline-none focus:border-deep-blue"
                      value={item.category_level_1}
                      onChange={(e) => updateItem(item.id, 'category_level_1', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Category 2</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Dairy"
                      disabled={!item.category_level_1}
                      className="w-full p-2 bg-white border border-gray-200 rounded text-sm outline-none focus:border-deep-blue disabled:bg-gray-100 disabled:text-gray-400"
                      value={item.category_level_2}
                      onChange={(e) => updateItem(item.id, 'category_level_2', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Category 3</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Cheese"
                      disabled={!item.category_level_2}
                      className="w-full p-2 bg-white border border-gray-200 rounded text-sm outline-none focus:border-deep-blue disabled:bg-gray-100 disabled:text-gray-400"
                      value={item.category_level_3}
                      onChange={(e) => updateItem(item.id, 'category_level_3', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Actions Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="text-deep-blue font-bold">
                Total Purchase: <span className="text-xl">{items.reduce((acc, item) => acc + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0), 0).toFixed(2)}</span>
            </div>
            
            {/* Contributor Breakdown */}
            {Object.keys(contributorTotals).length > 0 && (
                <div className="flex flex-wrap gap-2 items-center border-t md:border-t-0 md:border-l border-gray-100 pt-2 md:pt-0 md:pl-6">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block w-full md:w-auto">Total per person:</span>
                    {Object.entries(contributorTotals).map(([userId, amount]) => (
                        <div key={userId} className="bg-gray-50 px-3 py-1 rounded-full text-xs font-bold text-charcoal-gray flex items-center gap-2 border border-gray-100">
                            <span className="text-deep-blue opacity-70">
                                {allUsers.find(u => u.user_id === parseInt(userId))?.name || 'User'}
                                {parseInt(userId) === user?.user_id ? ' (You)' : ''}:
                            </span>
                            <span>{amount.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <button 
              onClick={() => navigate(-1)}
              className="px-6 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded transition"
            >
              Cancel
            </button>
            {id && (
              <>
                <button 
                  onClick={fetchLogs}
                  className="px-4 py-2 border border-gray-200 text-gray-400 rounded hover:bg-gray-50 transition"
                  title="View Logs"
                >
                  <History size={18} />
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-2 bg-alert-red text-white font-bold rounded hover:opacity-90 transition flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </>
            )}
            <button 
              onClick={handleConfirm}
              disabled={loading}
              className="px-8 py-2 bg-deep-blue text-white font-bold rounded hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Confirm Purchase'}
            </button>
          </div>
        </div>
      </footer>

      {/* Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-charcoal-gray/20 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-charcoal-gray flex items-center gap-2">
                <History size={20} className="text-deep-blue" />
                Purchase Audit Logs
              </h2>
              <button onClick={() => setShowLogs(false)} className="text-gray-400 hover:text-charcoal-gray transition"><X /></button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {logs.length > 0 ? logs.map((log) => (
                <div key={log.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-sm text-charcoal-gray font-medium">{log.message}</p>
                  <div className="flex justify-between items-center mt-2 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                    <span>User ID: {log.user_id}</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              )) : (
                <p className="text-center py-8 text-gray-400 italic">No logs found for this purchase.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-charcoal-gray/20 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-alert-red rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-charcoal-gray mb-2">Delete Purchase?</h2>
              <p className="text-gray-400 text-sm mb-8">This action cannot be undone. All associated items and records will be permanently removed.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)} 
                  className="flex-1 py-3 bg-gray-100 text-charcoal-gray font-bold rounded-xl hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeletePurchase} 
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-alert-red text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={18} /> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseEditor;
