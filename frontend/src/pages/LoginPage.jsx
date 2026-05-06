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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-white/5">
        <div className="p-5 md:p-6">
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-full mb-3 shadow-lg shadow-primary/30">
              <span className="text-white font-bold text-lg italic">MF</span>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-white">Log in</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-secondary mb-1 block" htmlFor="username">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <User size={14} className="text-secondary" />
                </div>
                <input id="username" type="text" required
                  className="block w-full pl-8 pr-3 py-2 bg-background border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-secondary/50"
                  placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-secondary mb-1 block" htmlFor="password">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Lock size={14} className="text-secondary" />
                </div>
                <input id="password" type={showPassword ? 'text' : 'password'} required
                  className="block w-full pl-8 pr-9 py-2 bg-background border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-secondary/50"
                  placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-secondary hover:text-white transition"
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {error && <div className="p-2.5 bg-error/10 border border-error/20 rounded-lg text-error text-xs font-medium">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-2 px-4 bg-primary text-white font-bold rounded-lg hover:opacity-90 focus:outline-none transition disabled:opacity-50 shadow-md text-sm">
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
