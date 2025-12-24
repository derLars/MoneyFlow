import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-light-gray dark:bg-dark-bg flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-md dark:shadow-xl dark:shadow-black/20 w-full max-w-[400px] overflow-hidden border border-transparent dark:border-dark-border">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-deep-blue dark:bg-dark-primary rounded-full mb-4 shadow-lg">
              <span className="text-white font-bold text-2xl italic">MF</span>
            </div>
            <h1 className="text-2xl font-bold text-charcoal-gray dark:text-dark-text">Log in to your account</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-charcoal-gray dark:text-dark-text mb-1" htmlFor="username">
                User name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400 dark:text-dark-text-secondary" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-3 md:py-2 bg-light-gray dark:bg-dark-bg border border-transparent dark:border-dark-border rounded-md leading-5 text-charcoal-gray dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-deep-blue dark:focus:ring-dark-primary focus:border-transparent transition"
                  placeholder="Enter your user name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-gray dark:text-dark-text mb-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400 dark:text-dark-text-secondary" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-10 pr-10 py-3 md:py-2 bg-light-gray dark:bg-dark-bg border border-transparent dark:border-dark-border rounded-md leading-5 text-charcoal-gray dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-deep-blue dark:focus:ring-dark-primary focus:border-transparent transition"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-dark-text-secondary hover:text-charcoal-gray dark:hover:text-dark-text transition min-w-touch"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-alert-red dark:border-red-500 rounded text-alert-red dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 md:py-2 px-4 bg-deep-blue dark:bg-dark-primary text-white font-bold rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-deep-blue dark:focus:ring-dark-primary dark:focus:ring-offset-dark-bg transition disabled:opacity-50 min-h-touch shadow-lg"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
