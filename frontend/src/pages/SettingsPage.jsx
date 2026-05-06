import React, { useState, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Settings as SettingsIcon, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Percent,
  Plus,
  X,
  Info,
  Filter,
  Trash2
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../api/axios';

const SettingsPage = () => {
  const { user, logout, checkAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [nameLoading, setNameLoading] = useState(false);
  const [taxLoading, setTaxLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [taxError, setTaxError] = useState('');
  const [taxSuccess, setTaxSuccess] = useState('');
  
  const [newName, setNewName] = useState(user?.name || '');

  // Tax Settings State
  const [defaultTaxRate, setDefaultTaxRate] = useState(user?.default_tax_rate || 0);
  const [commonRates, setCommonRates] = useState(
    user?.common_tax_rates ? user.common_tax_rates.split(',').map(r => r.trim()).filter(r => r !== '') : []
  );
  const [newRate, setNewRate] = useState('');

  // Saved Filters State
  const [savedFilters, setSavedFilters] = useState([]);

  useEffect(() => {
    fetchSavedFilters();
  }, []);

  const fetchSavedFilters = async () => {
    try {
      const res = await api.get('/analytics/filters');
      setSavedFilters(res.data);
    } catch (err) {
      console.error("Failed to fetch filters", err);
    }
  };

  const handleDeleteFilter = async (id) => {
    if (!window.confirm("Delete this saved filter?")) return;
    try {
      await api.delete(`/analytics/filters/${id}`);
      fetchSavedFilters();
    } catch (err) {
      alert("Failed to delete filter");
    }
  };

  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const validatePassword = (pass) => {
    return pass.length >= 10 && pass.length <= 30;
  };

  const isFormValid = 
    formData.current_password && 
    validatePassword(formData.new_password) && 
    formData.new_password === formData.confirm_password;

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!newName || newName === user?.name) return;

    setNameLoading(true);
    setNameError('');
    setNameSuccess('');

    try {
      await api.post('/auth/update-name', { new_name: newName });
      setNameSuccess('Username updated successfully! Redirecting to login...');
      setTimeout(() => {
        logout();
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setNameError(err.response?.data?.detail || 'Failed to update username');
    } finally {
      setNameLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/auth/change-password', {
        current_password: formData.current_password,
        new_password: formData.new_password
      });
      setSuccess('Password changed successfully!');
      setFormData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleAddRate = () => {
    if (!newRate || isNaN(newRate)) return;
    const val = parseFloat(newRate).toString();
    if (!commonRates.includes(val)) {
      setCommonRates([...commonRates, val].sort((a, b) => parseFloat(a) - parseFloat(b)));
    }
    setNewRate('');
  };

  const handleRemoveRate = (rate) => {
    setCommonRates(commonRates.filter(r => r !== rate));
  };

  const handleSaveTaxSettings = async () => {
    setTaxLoading(true);
    setTaxError('');
    setTaxSuccess('');

    try {
      await api.post('/auth/tax-settings', {
        default_tax_rate: parseFloat(defaultTaxRate),
        common_tax_rates: commonRates.join(',')
      });
      setTaxSuccess('Tax settings saved successfully!');
      await checkAuth(); // Refresh user data in store
    } catch (err) {
      setTaxError(err.response?.data?.detail || 'Failed to save tax settings');
    } finally {
      setTaxLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-4 space-y-3 md:space-y-4 pb-20">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-md">
          <SettingsIcon size={18} />
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-bold text-white">Settings</h1>
          <p className="text-[11px] text-secondary font-medium">Manage your account</p>
        </div>
      </div>

      {/* Section 1: Account Information */}
      <section className="bg-surface rounded-xl p-3 md:p-4 border border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <User className="text-primary" size={16} />
          <h2 className="text-sm md:text-base font-bold text-white">Account Information</h2>
        </div>
        
        <form onSubmit={handleUpdateName} className="space-y-3">
          {nameError && (
            <div className="p-2.5 bg-error/10 border border-error/20 rounded-lg flex items-center gap-2 text-error text-xs font-medium">
              <AlertCircle size={14} />
              {nameError}
            </div>
          )}
          {nameSuccess && (
            <div className="p-2.5 bg-success/10 border border-success/20 rounded-lg flex items-center gap-2 text-success text-xs font-bold">
              <CheckCircle2 size={14} />
              {nameSuccess}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
            <div className="flex-grow w-full">
              <label className="text-[10px] uppercase tracking-wider font-bold text-secondary mb-1 ml-0.5 block">User Name</label>
              <input type="text" className="w-full px-3 py-2 bg-background rounded-lg outline-none focus:ring-1 focus:ring-primary border border-white/10 text-sm text-white" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <button type="submit" disabled={nameLoading || !newName || newName === user?.name}
              className="px-5 py-2 bg-primary text-white rounded-lg font-bold shadow-md hover:opacity-90 transition disabled:opacity-50 text-xs">
              {nameLoading ? <Loader2 className="animate-spin" size={14} /> : 'Update Name'}
            </button>
          </div>
          <p className="text-[10px] text-secondary italic">Changing your username will require you to log in again.</p>
        </form>
      </section>

      {/* Section 2: Saved Filters */}
      <section className="bg-surface rounded-xl p-3 md:p-4 border border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="text-primary" size={16} />
          <h2 className="text-sm md:text-base font-bold text-white">Saved Filters</h2>
        </div>
        {savedFilters.length > 0 ? (
          <div className="space-y-1.5">
            {savedFilters.map(filter => (
              <div key={filter.filter_id} className="flex items-center justify-between p-2.5 bg-background rounded-lg border border-white/5 hover:bg-white/5 transition">
                <div>
                  <h3 className="font-bold text-xs text-white">{filter.name}</h3>
                  <p className="text-[10px] text-secondary">Created: {new Date(filter.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => handleDeleteFilter(filter.filter_id)} className="p-1 text-secondary hover:text-error transition">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-secondary italic text-xs bg-background/50 rounded-lg border border-dashed border-white/10">
            No saved filters yet.
          </div>
        )}
      </section>

      {/* Section 3: Tax Configuration */}
      <section className="bg-surface rounded-xl p-3 md:p-4 border border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <Percent className="text-primary" size={16} />
          <h2 className="text-sm md:text-base font-bold text-white">Tax Configuration</h2>
        </div>
        <div className="space-y-3">
          {taxError && (
            <div className="p-2.5 bg-error/10 border border-error/20 rounded-lg flex items-center gap-2 text-error text-xs font-medium">
              <AlertCircle size={14} />
              {taxError}
            </div>
          )}
          {taxSuccess && (
            <div className="p-2.5 bg-success/10 border border-success/20 rounded-lg flex items-center gap-2 text-success text-xs font-bold">
              <CheckCircle2 size={14} />
              {taxSuccess}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1">
                Default Tax Rate (%)
                <Info size={12} className="text-secondary" />
              </h3>
              <input type="number" step="0.01" className="w-full px-3 py-2 bg-background rounded-lg outline-none focus:ring-1 focus:ring-primary border border-white/10 text-sm text-white" value={defaultTaxRate} onChange={(e) => setDefaultTaxRate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white">Common Rates</h3>
              <div className="flex flex-wrap gap-1.5">
                {commonRates.map(rate => (
                  <div key={rate} className="flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                    <span className="text-xs font-bold text-primary">{rate}%</span>
                    <button onClick={() => handleRemoveRate(rate)} className="text-secondary hover:text-error transition"><X size={12} /></button>
                  </div>
                ))}
                {commonRates.length === 0 && <p className="text-[10px] text-secondary italic py-1">No common rates defined.</p>}
              </div>
              <div className="flex gap-1.5">
                <input type="number" placeholder="Add rate" className="flex-grow px-2.5 py-1.5 bg-background rounded-lg border border-white/10 text-xs text-white outline-none focus:ring-1 focus:ring-primary" value={newRate} onChange={(e) => setNewRate(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddRate()} />
                <button onClick={handleAddRate} className="p-1.5 bg-background hover:bg-white/5 text-white rounded-lg transition border border-white/10"><Plus size={16} /></button>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-white/5">
            <button onClick={handleSaveTaxSettings} disabled={taxLoading}
              className="w-full sm:w-auto px-6 py-2 bg-primary text-white rounded-lg font-bold shadow-md hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs">
              {taxLoading ? <Loader2 className="animate-spin" size={14} /> : 'Save Tax Settings'}
            </button>
          </div>
        </div>
      </section>

      {/* Section 4: Security */}
      <section className="bg-surface rounded-xl p-3 md:p-4 border border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="text-primary" size={16} />
          <h2 className="text-sm md:text-base font-bold text-white">Security</h2>
        </div>
        <form onSubmit={handleChangePassword} className="max-w-md space-y-3">
          <h3 className="text-xs font-bold text-white">Change Password</h3>
          {error && (
            <div className="p-2.5 bg-error/10 border border-error/20 rounded-lg flex items-center gap-2 text-error text-xs font-medium">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          {success && (
            <div className="p-2.5 bg-success/10 border border-success/20 rounded-lg flex items-center gap-2 text-success text-xs font-bold">
              <CheckCircle2 size={14} /> {success}
            </div>
          )}
          <div className="space-y-2">
            {['current', 'new', 'confirm'].map(field => (
              <div key={field} className="relative">
                <label className="text-[10px] uppercase tracking-wider font-bold text-secondary mb-0.5 ml-0.5 block">
                  {field === 'current' ? 'Current Password' : field === 'new' ? 'New Password' : 'Confirm Password'}
                </label>
                <input type={showPasswords[field] ? 'text' : 'password'}
                  className={`w-full px-3 py-2 bg-background rounded-lg outline-none border border-white/10 text-sm pr-9 text-white focus:ring-1 focus:ring-primary ${
                    (field === 'new' && formData.new_password && !validatePassword(formData.new_password)) ||
                    (field === 'confirm' && formData.confirm_password && formData.new_password !== formData.confirm_password) ? 'ring-1 ring-error' : ''
                  }`}
                  placeholder={field === 'current' ? '••••••••' : field === 'new' ? 'Min. 10 chars' : 'Repeat password'}
                  value={formData[field === 'current' ? 'current_password' : field === 'new' ? 'new_password' : 'confirm_password']}
                  onChange={(e) => setFormData({ ...formData, [field === 'current' ? 'current_password' : field === 'new' ? 'new_password' : 'confirm_password']: e.target.value })} />
                <button type="button" onClick={() => toggleVisibility(field)} className="absolute right-2.5 top-[60%] -translate-y-1/2 text-secondary hover:text-primary transition">
                  {showPasswords[field] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-secondary italic">Password must be 10-30 characters.</p>
          <button type="submit" disabled={loading || !isFormValid}
            className="w-full py-2 bg-primary text-white rounded-lg font-bold shadow-md hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs">
            {loading ? <Loader2 className="animate-spin" size={14} /> : 'Change Password'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default SettingsPage;
