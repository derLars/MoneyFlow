import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, GripVertical, Info, Save, X, ChevronRight, CheckSquare, Square, Receipt, History, AlertTriangle, Loader2, ChevronDown, Search, Maximize2 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api, { getCategoriesByLevel, createCategory } from '../api/axios';
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
        className="w-full flex items-center justify-between p-2 bg-light-gray dark:bg-dark-bg rounded text-sm text-charcoal-gray dark:text-dark-text border border-transparent focus:border-deep-blue dark:focus:border-dark-primary transition"
      >
        <span className="truncate">
          {selectedIds.length === 0 
            ? 'Select contributors...' 
            : `${selectedIds.length} contributor${selectedIds.length > 1 ? 's' : ''} selected`}
        </span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-dark-surface rounded-lg shadow-xl border border-gray-100 dark:border-dark-border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-gray-50 dark:border-dark-border flex items-center gap-2 bg-gray-50/50 dark:bg-dark-bg/50">
            <Search size={14} className="text-gray-400 dark:text-dark-text-secondary" />
            <input
              type="text"
              className="bg-transparent text-xs outline-none w-full text-charcoal-gray dark:text-dark-text"
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
                className="flex items-center gap-3 px-3 py-2 hover:bg-blue-50 dark:hover:bg-dark-primary/20 cursor-pointer transition"
              >
                <div 
                    onClick={(e) => { e.preventDefault(); toggleUser(u.user_id); }}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                        selectedIds.includes(u.user_id) ? 'bg-deep-blue dark:bg-dark-primary border-deep-blue dark:border-dark-primary text-white' : 'bg-white dark:bg-dark-surface border-gray-300 dark:border-dark-border'
                    }`}
                >
                    {selectedIds.includes(u.user_id) && <CheckSquare size={12} />}
                </div>
                <span className="text-sm font-medium text-charcoal-gray dark:text-dark-text">{u.name}</span>
              </label>
            ))}
            {sortedUsers.length === 0 && (
                <p className="p-4 text-xs text-gray-400 dark:text-dark-text-secondary text-center italic">No users found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CategoryInput = ({ value, onChange, options, placeholder, disabled = false }) => {
  const [isTyping, setIsTyping] = useState(!options.some(opt => opt.category_name === value) && value !== '');
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    // Only update if the external value changes and it's not currently being typed
    if (value !== inputValue && !isTyping) {
      setInputValue(value);
      setIsTyping(!options.some(opt => opt.category_name === value) && value !== '');
    }
  }, [value, options, isTyping]);

  const handleSelectChange = (e) => {
    const selectedValue = e.target.value;
    if (selectedValue === "__new__") {
      setIsTyping(true);
      setInputValue('');
      onChange('');
    } else {
      setIsTyping(false);
      setInputValue(selectedValue);
      onChange(selectedValue);
    }
  };

  const handleInputChange = (e) => {
    const typedValue = e.target.value;
    setInputValue(typedValue);
    onChange(typedValue);
  };

  return (
    <div className="relative">
      {!isTyping && options.length > 0 ? (
        <select
          className="w-full p-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border dark:text-dark-text rounded text-sm outline-none focus:border-deep-blue dark:focus:border-dark-primary disabled:bg-gray-100 dark:disabled:bg-dark-bg disabled:text-gray-400"
          value={value}
          onChange={handleSelectChange}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.category_id} value={option.category_name}>
              {option.category_name}
            </option>
          ))}
          <option value="__new__">+ Add new category</option>
        </select>
      ) : (
        <input
          type="text"
          placeholder={placeholder}
          className="w-full p-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border dark:text-dark-text rounded text-sm outline-none focus:border-deep-blue dark:focus:border-dark-primary disabled:bg-gray-100 dark:disabled:bg-dark-bg disabled:text-gray-400"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={() => {
            // If the input is empty and it was a new category field, switch back to select
            if (!inputValue && !options.some(opt => opt.category_name === value)) {
                setIsTyping(false);
            }
          }}
          disabled={disabled}
        />
      )}
      {isTyping && options.length > 0 && (
        <button
          onClick={() => {
            setIsTyping(false);
            setInputValue(value); // Revert to current selected value if exists
            if (!value) onChange(''); // Clear if no value was set
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-charcoal-gray"
          type="button"
        >
          <X size={16} />
        </button>
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
  const [receiptImages, setReceiptImages] = useState([]);
  const [viewImage, setViewImage] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [categoriesLevel1, setCategoriesLevel1] = useState([]);
  const [categoriesLevel2, setCategoriesLevel2] = useState([]);
  const [categoriesLevel3, setCategoriesLevel3] = useState([]);

  // Fetch categories for each level
  useEffect(() => {
    if (!user?.user_id) return;
    const fetchCategories = async (level, setter) => {
      try {
        const data = await getCategoriesByLevel(level);
        setter(data);
      } catch (error) {
        console.error(`Failed to fetch categories for level ${level}:`, error);
      }
    };

    fetchCategories(1, setCategoriesLevel1);
    fetchCategories(2, setCategoriesLevel2);
    fetchCategories(3, setCategoriesLevel3);
  }, [user?.user_id]);

  // Initialize items from location state (OCR scan results) or default first item
  useEffect(() => {
    if (!user?.user_id || id) return;

    if (location.state?.extractedData && items.length === 0) {
      const { extractedData, receiptImages: images } = location.state;
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
      if (images) setReceiptImages(images);
      
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
          
          if (p.images) {
            setReceiptImages(p.images.map(img => ({
              url: img.url,
              file_path: img.file_path,
              original_filename: img.original_filename
            })));
          }

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
      // Process new categories before saving the purchase
      const allExistingCategoryNames = new Set([
        ...categoriesLevel1.map(c => c.category_name),
        ...categoriesLevel2.map(c => c.category_name),
        ...categoriesLevel3.map(c => c.category_name),
      ]);

      for (const item of items) {
        for (let i = 1; i <= 3; i++) {
          const categoryLevelField = `category_level_${i}`;
          const categoryName = item[categoryLevelField];
          
          if (categoryName && !allExistingCategoryNames.has(categoryName)) {
            await createCategory(categoryName, i);
            // Add to local set to avoid duplicate API calls within the same confirm action
            allExistingCategoryNames.add(categoryName);
          }
        }
      }
      // After creating new categories, re-fetch all categories to ensure dropdowns are updated for subsequent actions (though not strictly necessary for the current save operation)
      await Promise.all([
        getCategoriesByLevel(1).then(setCategoriesLevel1),
        getCategoriesByLevel(2).then(setCategoriesLevel2),
        getCategoriesByLevel(3).then(setCategoriesLevel3),
      ]);

      const purchaseData = {
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
        await api.put(`/purchases/${id}`, purchaseData);
      } else {
        // Use FormData for creation to include files
        const formData = new FormData();
        formData.append('purchase_data', JSON.stringify(purchaseData));
        
        receiptImages.forEach(img => {
          if (img.blob) {
            formData.append('files', img.blob, img.blob.name);
          }
        });

        const response = await api.post('/purchases/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
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
      <section className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-sm border border-gray-100 dark:border-dark-border">
        <h2 className="text-xl font-bold text-deep-blue dark:text-dark-primary mb-6 flex items-center gap-2">
          <Info size={20} />
          Purchase Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-charcoal-gray dark:text-dark-text mb-1">Purchase Name</label>
                    <input
                    type="text"
                    className="w-full p-3 md:p-2 bg-light-gray dark:bg-dark-bg border-transparent rounded-md focus:ring-2 focus:ring-deep-blue dark:focus:ring-dark-primary outline-none text-charcoal-gray dark:text-dark-text"
                    placeholder="e.g., Weekly Groceries"
                    value={purchase.purchase_name}
                    onChange={(e) => setPurchase({ ...purchase, purchase_name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-charcoal-gray dark:text-dark-text mb-1">Purchase Date</label>
                    <input
                    type="date"
                    className="w-full p-3 md:p-2 bg-light-gray dark:bg-dark-bg border-transparent rounded-md focus:ring-2 focus:ring-deep-blue dark:focus:ring-dark-primary outline-none text-charcoal-gray dark:text-dark-text"
                    value={purchase.purchase_date}
                    onChange={(e) => setPurchase({ ...purchase, purchase_date: e.target.value })}
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-charcoal-gray dark:text-dark-text mb-1">Payer</label>
                    <select
                    className="w-full p-3 md:p-2 bg-light-gray dark:bg-dark-bg border-transparent rounded-md focus:ring-2 focus:ring-deep-blue dark:focus:ring-dark-primary outline-none text-charcoal-gray dark:text-dark-text"
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
                <div className="flex gap-6 items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div onClick={() => setPurchase({...purchase, tax_is_added: !purchase.tax_is_added})}>
                        {purchase.tax_is_added ? <CheckSquare className="text-deep-blue dark:text-dark-primary" size={20} /> : <Square className="text-gray-400 dark:text-dark-text-secondary group-hover:text-deep-blue dark:group-hover:text-dark-primary" size={20} />}
                        </div>
                        <span className="text-sm font-medium text-charcoal-gray dark:text-dark-text">Add Tax</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div onClick={() => setPurchase({...purchase, discount_is_applied: !purchase.discount_is_applied})}>
                        {purchase.discount_is_applied ? <CheckSquare className="text-deep-blue dark:text-dark-primary" size={20} /> : <Square className="text-gray-400 dark:text-dark-text-secondary group-hover:text-deep-blue dark:group-hover:text-dark-primary" size={20} />}
                        </div>
                        <span className="text-sm font-medium text-charcoal-gray dark:text-dark-text">Apply discounts</span>
                    </label>
                </div>
            </div>
          </div>

          {/* Receipt Images Display (Section 5.6.1) */}
          <div className="bg-gray-50 dark:bg-dark-bg p-4 rounded-lg border border-dashed border-gray-200 dark:border-dark-border">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-bold text-charcoal-gray dark:text-dark-text flex items-center gap-2">
                <Receipt size={16} className="text-deep-blue dark:text-dark-primary" />
                Receipt Images
              </label>
              <span className="text-[10px] bg-white dark:bg-dark-surface px-2 py-1 rounded border text-gray-400">
                {receiptImages.length} attached
              </span>
            </div>
            
            {receiptImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {receiptImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-square group overflow-hidden rounded-md border bg-white dark:bg-dark-surface cursor-pointer" onClick={() => setViewImage(img.url)}>
                    <img src={img.url} alt="Receipt" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 size={20} className="text-white" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-24 flex flex-col items-center justify-center text-gray-400 italic text-xs">
                <Receipt size={24} className="opacity-20 mb-2" />
                No images attached
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 2: Interactive Item List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-deep-blue dark:text-dark-primary flex items-center gap-2">
            <Receipt size={20} />
            Items
          </h2>
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-4 py-2 bg-deep-blue dark:bg-dark-primary text-white rounded-md hover:opacity-90 transition text-sm font-bold shadow-sm min-h-touch"
          >
            <Plus size={18} />
            Add Item
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-100 dark:border-dark-border flex overflow-hidden group">
              {/* Drag Handle */}
              <div className="w-10 bg-gray-50 dark:bg-dark-bg flex items-center justify-center text-gray-300 dark:text-dark-text-secondary border-r border-gray-100 dark:border-dark-border cursor-grab active:cursor-grabbing">
                <GripVertical size={20} />
              </div>

              {/* Card Content */}
              <div className="flex-grow p-4 space-y-4">
                {/* Top Row: Names */}
                <div className="flex justify-between items-start">
                  <div className="flex-grow max-w-md">
                    <input
                      type="text"
                      className="w-full text-lg font-bold text-charcoal-gray dark:text-dark-text bg-transparent border-b border-transparent focus:border-deep-blue dark:focus:border-dark-primary outline-none transition"
                      placeholder="Friendly Name"
                      value={item.friendly_name}
                      onChange={(e) => updateItem(item.id, 'friendly_name', e.target.value)}
                    />
                    {item.original_name && (
                      <p className="text-xs text-gray-400 dark:text-dark-text-secondary mt-1 italic">Original: {item.original_name}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => deleteItem(item.id)}
                    className="text-gray-300 dark:text-dark-text-secondary hover:text-alert-red transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* Middle Row 1: Qty, Price, Contributors */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-dark-text-secondary mb-1">Quantity</label>
                    <input
                      type="number"
                      className="w-full p-2 bg-light-gray dark:bg-dark-bg dark:text-dark-text rounded outline-none focus:ring-1 focus:ring-deep-blue dark:focus:ring-dark-primary"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-dark-text-secondary mb-1">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-2 bg-light-gray dark:bg-dark-bg dark:text-dark-text rounded outline-none focus:ring-1 focus:ring-deep-blue dark:focus:ring-dark-primary"
                      value={item.price}
                      onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-dark-text-secondary mb-1">Contributors</label>
                    <ContributorDropdown 
                        allUsers={allUsers}
                        selectedIds={item.contributors || []}
                        onChange={(updated) => updateItem(item.id, 'contributors', updated)}
                    />
                  </div>
                </div>

                {/* Per-person Contribution Display */}
                {(item.contributors?.length > 0) && (
                  <div className="text-[11px] font-bold text-deep-blue dark:text-dark-primary flex items-center gap-1 bg-blue-50/50 dark:bg-dark-primary/10 w-fit px-3 py-1 rounded-full">
                    <span className="opacity-70">Share: {((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1) / item.contributors.length).toFixed(2)} per person</span>
                  </div>
                )}

                {/* Middle Row 2: Category Levels */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 dark:bg-dark-bg p-3 rounded-md">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-dark-text-secondary mb-1">Category 1</label>
                    <CategoryInput
                      value={item.category_level_1}
                      onChange={(value) => updateItem(item.id, 'category_level_1', value)}
                      options={categoriesLevel1}
                      placeholder="e.g. Food"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-dark-text-secondary mb-1">Category 2</label>
                    <CategoryInput
                      value={item.category_level_2}
                      onChange={(value) => updateItem(item.id, 'category_level_2', value)}
                      options={categoriesLevel2}
                      placeholder="e.g. Dairy"
                      disabled={!item.category_level_1}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-dark-text-secondary mb-1">Category 3</label>
                    <CategoryInput
                      value={item.category_level_3}
                      onChange={(value) => updateItem(item.id, 'category_level_3', value)}
                      options={categoriesLevel3}
                      placeholder="e.g. Cheese"
                      disabled={!item.category_level_2}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Actions Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-dark-border p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="text-deep-blue dark:text-dark-primary font-bold">
                Total Purchase: <span className="text-xl">{items.reduce((acc, item) => acc + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0), 0).toFixed(2)}</span>
            </div>
            
            {/* Contributor Breakdown */}
            {Object.keys(contributorTotals).length > 0 && (
                <div className="flex flex-wrap gap-2 items-center border-t md:border-t-0 md:border-l border-gray-100 dark:border-dark-border pt-2 md:pt-0 md:pl-6">
                    <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-text-secondary block w-full md:w-auto">Total per person:</span>
                    {Object.entries(contributorTotals).map(([userId, amount]) => (
                        <div key={userId} className="bg-gray-50 dark:bg-dark-bg px-3 py-1 rounded-full text-xs font-bold text-charcoal-gray dark:text-dark-text flex items-center gap-2 border border-gray-100 dark:border-dark-border">
                            <span className="text-deep-blue dark:text-dark-primary opacity-70">
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
              className="px-6 py-2 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-dark-bg rounded transition"
            >
              Cancel
            </button>
            {id && (
              <>
                <button 
                  onClick={fetchLogs}
                  className="px-4 py-2 border border-gray-200 dark:border-dark-border text-gray-400 rounded hover:bg-gray-50 dark:hover:bg-dark-bg transition"
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
              className="px-8 py-2 bg-deep-blue dark:bg-dark-primary text-white font-bold rounded hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Confirm Purchase'}
            </button>
          </div>
        </div>
      </footer>

      {/* Image Viewer Modal */}
      {viewImage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" onClick={() => setViewImage(null)}>
          <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition" onClick={() => setViewImage(null)}>
            <X size={32} />
          </button>
          <img src={viewImage} alt="Full receipt" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-charcoal-gray/20 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-surface w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-50 dark:border-dark-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-charcoal-gray dark:text-dark-text flex items-center gap-2">
                <History size={20} className="text-deep-blue dark:text-dark-primary" />
                Purchase Audit Logs
              </h2>
              <button onClick={() => setShowLogs(false)} className="text-gray-400 hover:text-charcoal-gray transition"><X /></button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {logs.length > 0 ? logs.map((log) => (
                <div key={log.id} className="p-4 bg-gray-50 dark:bg-dark-bg rounded-2xl border border-gray-100 dark:border-dark-border">
                  <p className="text-sm text-charcoal-gray dark:text-dark-text font-medium">{log.message}</p>
                  <div className="flex justify-between items-center mt-2 text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-dark-text-secondary">
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
          <div className="bg-white dark:bg-dark-surface w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 dark:bg-alert-red/10 text-alert-red rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-charcoal-gray dark:text-dark-text mb-2">Delete Purchase?</h2>
              <p className="text-gray-400 dark:text-dark-text-secondary text-sm mb-8">This action cannot be undone. All associated items and records will be permanently removed.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)} 
                  className="flex-1 py-3 bg-gray-100 dark:bg-dark-bg text-charcoal-gray dark:text-dark-text font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-dark-border transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeletePurchase} 
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-alert-red text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-red-200 dark:shadow-none flex items-center justify-center gap-2"
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
