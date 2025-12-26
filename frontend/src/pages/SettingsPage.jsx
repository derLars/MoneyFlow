import React, { useState } from 'react';
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
  Info
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
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-sm text-secondary font-medium">Manage your account and security</p>
        </div>
      </div>

      {/* Section 1: Account Information */}
      <section className="bg-surface rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <User className="text-primary" size={20} />
          <h2 className="text-xl font-bold text-white">Account Information</h2>
        </div>
        
        <form onSubmit={handleUpdateName} className="space-y-6">
          {nameError && (
            <div className="p-4 bg-error/10 border border-error/20 rounded-2xl flex items-center gap-3 text-error text-sm font-medium">
              <AlertCircle size={18} />
              {nameError}
            </div>
          )}

          {nameSuccess && (
            <div className="p-4 bg-success/10 border border-success/20 rounded-2xl flex items-center gap-3 text-success text-sm font-bold">
              <CheckCircle2 size={18} />
              {nameSuccess}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-grow w-full">
              <label className="block text-[10px] uppercase tracking-wider font-bold text-secondary mb-2 ml-1">User Name</label>
              <input
                type="text"
                className="w-full p-4 bg-background rounded-2xl outline-none focus:ring-2 focus:ring-primary border-none text-sm text-white"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={nameLoading || !newName || newName === user?.name}
              className="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap min-h-touch"
            >
              {nameLoading ? <Loader2 className="animate-spin" size={20} /> : 'Update Name'}
            </button>
          </div>
          <p className="text-[10px] text-secondary px-1 italic">
            Changing your username will require you to log in again.
          </p>
        </form>
      </section>

      {/* Section 2: Tax Configuration */}
      <section className="bg-surface rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Percent className="text-primary" size={20} />
          <h2 className="text-xl font-bold text-white">Tax Configuration</h2>
        </div>

        <div className="space-y-8">
          {taxError && (
            <div className="p-4 bg-error/10 border border-error/20 rounded-2xl flex items-center gap-3 text-error text-sm font-medium">
              <AlertCircle size={18} />
              {taxError}
            </div>
          )}

          {taxSuccess && (
            <div className="p-4 bg-success/10 border border-success/20 rounded-2xl flex items-center gap-3 text-success text-sm font-bold">
              <CheckCircle2 size={18} />
              {taxSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Default Tax Rate (%)
                <Info size={14} className="text-secondary" title="This rate will be applied by default to new items" />
              </h3>
              <input
                type="number"
                step="0.01"
                className="w-full p-4 bg-background rounded-2xl outline-none focus:ring-2 focus:ring-primary border-none text-sm text-white"
                value={defaultTaxRate}
                onChange={(e) => setDefaultTaxRate(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">Common Tax Rates</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {commonRates.map(rate => (
                  <div key={rate} className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 group">
                    <span className="text-sm font-bold text-primary">{rate}%</span>
                    <button 
                        onClick={() => handleRemoveRate(rate)}
                        className="text-secondary hover:text-error transition"
                    >
                        <X size={14} />
                    </button>
                  </div>
                ))}
                {commonRates.length === 0 && (
                  <p className="text-xs text-secondary italic py-2">No common rates defined.</p>
                )}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Add rate (e.g. 8.875)"
                  className="flex-grow p-3 bg-background rounded-xl outline-none text-sm text-white"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddRate()}
                />
                <button
                  onClick={handleAddRate}
                  className="p-3 bg-background hover:bg-surface text-white rounded-xl transition"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <button
                onClick={handleSaveTaxSettings}
                disabled={taxLoading}
                className="w-full sm:w-auto px-12 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 min-h-touch"
            >
                {taxLoading ? <Loader2 className="animate-spin" size={20} /> : 'Save Tax Settings'}
            </button>
          </div>
        </div>
      </section>

      {/* Section 3: Security */}
      <section className="bg-surface rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <Lock className="text-primary" size={20} />
          <h2 className="text-xl font-bold text-white">Security</h2>
        </div>

        <form onSubmit={handleChangePassword} className="max-w-md space-y-6">
          <h3 className="text-sm font-bold text-white">Change Password</h3>

          {error && (
            <div className="p-4 bg-error/10 border border-error/20 rounded-2xl flex items-center gap-3 text-error text-sm font-medium animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-success/10 border border-success/20 rounded-2xl flex items-center gap-3 text-success text-sm font-bold animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 size={18} />
              {success}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <label className="block text-[10px] uppercase tracking-wider font-bold text-secondary mb-2 ml-1">Current Password</label>
              <input
                type={showPasswords.current ? "text" : "password"}
                className="w-full p-4 bg-background rounded-2xl outline-none focus:ring-2 focus:ring-primary border-none text-sm pr-12 text-white"
                placeholder="••••••••"
                value={formData.current_password}
                onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
              />
              <button 
                type="button"
                onClick={() => toggleVisibility('current')}
                className="absolute right-4 bottom-4 text-secondary hover:text-primary transition min-w-touch"
              >
                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <label className="block text-[10px] uppercase tracking-wider font-bold text-secondary mb-2 ml-1">New Password</label>
              <input
                type={showPasswords.new ? "text" : "password"}
                className={`w-full p-4 bg-background rounded-2xl outline-none border-none text-sm pr-12 transition text-white
                  ${formData.new_password && !validatePassword(formData.new_password) ? 'ring-2 ring-error' : 'focus:ring-2 focus:ring-primary'}
                `}
                placeholder="Min. 10 characters"
                value={formData.new_password}
                onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
              />
              <button 
                type="button"
                onClick={() => toggleVisibility('new')}
                className="absolute right-4 bottom-4 text-secondary hover:text-primary transition min-w-touch"
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <label className="block text-[10px] uppercase tracking-wider font-bold text-secondary mb-2 ml-1">Confirm New Password</label>
              <input
                type={showPasswords.confirm ? "text" : "password"}
                className={`w-full p-4 bg-background rounded-2xl outline-none border-none text-sm pr-12 transition text-white
                  ${formData.confirm_password && formData.new_password !== formData.confirm_password ? 'ring-2 ring-error' : 'focus:ring-2 focus:ring-primary'}
                `}
                placeholder="Repeat new password"
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              />
              <button 
                type="button"
                onClick={() => toggleVisibility('confirm')}
                className="absolute right-4 bottom-4 text-secondary hover:text-primary transition min-w-touch"
              >
                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <p className="text-[10px] text-secondary px-1 italic">
            Password must be between 10 and 30 characters long.
          </p>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 min-h-touch"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Change Password'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default SettingsPage;
