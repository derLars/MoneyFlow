import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Shield, 
  Settings as SettingsIcon, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../api/axios';

const SettingsPage = () => {
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [nameLoading, setNameLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  
  const [newName, setNewName] = useState(user?.name || '');
  
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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-deep-blue rounded-xl flex items-center justify-center text-white shadow-lg">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-charcoal-gray">Settings</h1>
          <p className="text-sm text-gray-400 font-medium">Manage your account and security</p>
        </div>
      </div>

      {/* Section 1: Account Information */}
      <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <User className="text-deep-blue" size={20} />
          <h2 className="text-xl font-bold text-charcoal-gray">Account Information</h2>
        </div>
        
        <form onSubmit={handleUpdateName} className="space-y-6">
          {nameError && (
            <div className="p-4 bg-alert-red/10 border border-alert-red/20 rounded-2xl flex items-center gap-3 text-alert-red text-sm font-medium">
              <AlertCircle size={18} />
              {nameError}
            </div>
          )}

          {nameSuccess && (
            <div className="p-4 bg-vibrant-green/10 border border-vibrant-green/20 rounded-2xl flex items-center gap-3 text-vibrant-green text-sm font-bold">
              <CheckCircle2 size={18} />
              {nameSuccess}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-grow w-full">
              <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2 ml-1">User Name</label>
              <input
                type="text"
                className="w-full p-4 bg-light-gray rounded-2xl outline-none focus:ring-2 focus:ring-deep-blue border-none text-sm"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={nameLoading || !newName || newName === user?.name}
              className="px-8 py-4 bg-deep-blue text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {nameLoading ? <Loader2 className="animate-spin" size={20} /> : 'Update Name'}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 px-1 italic">
            Changing your username will require you to log in again.
          </p>
        </form>
      </section>

      {/* Section 2: Security */}
      <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-8">
          <Lock className="text-deep-blue" size={20} />
          <h2 className="text-xl font-bold text-charcoal-gray">Security</h2>
        </div>

        <form onSubmit={handleChangePassword} className="max-w-md space-y-6">
          <h3 className="text-sm font-bold text-charcoal-gray">Change Password</h3>

          {error && (
            <div className="p-4 bg-alert-red/10 border border-alert-red/20 rounded-2xl flex items-center gap-3 text-alert-red text-sm font-medium animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-vibrant-green/10 border border-vibrant-green/20 rounded-2xl flex items-center gap-3 text-vibrant-green text-sm font-bold animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 size={18} />
              {success}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2 ml-1">Current Password</label>
              <input
                type={showPasswords.current ? "text" : "password"}
                className="w-full p-4 bg-light-gray rounded-2xl outline-none focus:ring-2 focus:ring-deep-blue border-none text-sm pr-12"
                placeholder="••••••••"
                value={formData.current_password}
                onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
              />
              <button 
                type="button"
                onClick={() => toggleVisibility('current')}
                className="absolute right-4 bottom-4 text-gray-400 hover:text-deep-blue transition"
              >
                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2 ml-1">New Password</label>
              <input
                type={showPasswords.new ? "text" : "password"}
                className={`w-full p-4 bg-light-gray rounded-2xl outline-none border-none text-sm pr-12 transition
                  ${formData.new_password && !validatePassword(formData.new_password) ? 'ring-2 ring-alert-red' : 'focus:ring-2 focus:ring-deep-blue'}
                `}
                placeholder="Min. 10 characters"
                value={formData.new_password}
                onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
              />
              <button 
                type="button"
                onClick={() => toggleVisibility('new')}
                className="absolute right-4 bottom-4 text-gray-400 hover:text-deep-blue transition"
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2 ml-1">Confirm New Password</label>
              <input
                type={showPasswords.confirm ? "text" : "password"}
                className={`w-full p-4 bg-light-gray rounded-2xl outline-none border-none text-sm pr-12 transition
                  ${formData.confirm_password && formData.new_password !== formData.confirm_password ? 'ring-2 ring-alert-red' : 'focus:ring-2 focus:ring-deep-blue'}
                `}
                placeholder="Repeat new password"
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              />
              <button 
                type="button"
                onClick={() => toggleVisibility('confirm')}
                className="absolute right-4 bottom-4 text-gray-400 hover:text-deep-blue transition"
              >
                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 px-1 italic">
            Password must be between 10 and 30 characters long.
          </p>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full py-4 bg-deep-blue text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Change Password'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default SettingsPage;
