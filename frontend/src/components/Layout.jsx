import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Home, Receipt, LayoutDashboard, Settings, User as UserIcon, Users, ArrowRightLeft } from 'lucide-react';
import useAuthStore from '../store/authStore';
import MobileNav from './MobileNav';

const Layout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: <Home size={18} /> },
    { name: 'Purchases', path: '/purchases', icon: <Receipt size={18} /> },
    { name: 'Analytics', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Money Flow', path: '/moneyflow', icon: <ArrowRightLeft size={18} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={18} /> },
  ];

  if (user?.administrator) {
    navLinks.push({ name: 'User Management', path: '/users', icon: <Users size={18} /> });
  }

  return (
    <div className="min-h-screen bg-light-gray dark:bg-dark-bg font-sans flex flex-col pb-16 md:pb-0">
      {/* Persistent Navigation Bar (Header) */}
      <header className="bg-deep-blue text-white shadow-lg sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left Side: Logo & Welcome Message */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-white text-deep-blue w-8 h-8 rounded-full flex items-center justify-center font-bold italic">
                MF
              </div>
              <span className="font-bold text-lg hidden sm:inline-block">Moneyflow</span>
            </Link>
            <span className="hidden md:inline-block border-l border-white/20 pl-4 text-sm font-medium text-white/90">
              Welcome, {user?.name}!
            </span>
          </div>

          {/* Right Side: Logout & Hamburger Menu */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded hover:bg-white/10 transition text-sm font-medium"
              title="Logout"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>

            {/* Hamburger Icon */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded hover:bg-white/10 transition"
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute top-16 right-4 w-64 bg-white rounded-2xl shadow-2xl py-3 z-50 border border-gray-100 transform origin-top-right transition-all animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-50 mb-1">
              <p className="text-[10px] uppercase font-bold text-gray-400">Navigation</p>
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-charcoal-gray hover:bg-blue-50 hover:text-deep-blue transition-colors font-semibold text-sm group"
              >
                <span className="text-gray-400 group-hover:text-deep-blue transition-colors">{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            ))}
            <div className="border-t border-gray-100 mt-2 sm:hidden">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 text-alert-red hover:bg-red-50 transition font-medium text-left"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <Outlet />
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
};

export default Layout;
