import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Home, Receipt, LayoutDashboard, Settings, Users, ArrowRightLeft } from 'lucide-react';
import useAuthStore from '../store/authStore';
import MobileNav from './MobileNav';

const Layout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we are in an editor view where we want full screen/custom footer
  const isEditor = location.pathname.includes('create-purchase') || location.pathname.includes('edit-purchase');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: <Home size={20} /> },
    { name: 'Purchases', path: '/purchases', icon: <Receipt size={20} /> },
    { name: 'Analytics', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Money Flow', path: '/moneyflow', icon: <ArrowRightLeft size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  if (user?.administrator) {
    navLinks.push({ name: 'User Management', path: '/users', icon: <Users size={20} /> });
  }

  return (
    <div className={`min-h-screen bg-background font-sans flex flex-col ${isEditor ? '' : 'pb-24'} md:pb-0`}>
      {/* Top Bar (Mobile & Desktop) */}
      <header className="bg-surface sticky top-0 z-50 px-6 h-16 flex items-center justify-between shadow-sm">
        {/* Left: Hamburger Menu */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 -ml-2 text-white hover:bg-white/5 rounded-xl transition"
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Center: Logo (Optional, or Title) */}
        <Link to="/" className="text-xl font-bold text-white tracking-tight">
          Moneyflow
        </Link>

        {/* Right: User Avatar */}
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-white">{user?.name}</p>
            <p className="text-[10px] font-medium text-secondary uppercase tracking-wider">{user?.administrator ? 'Admin' : 'User'}</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-info rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-surface">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>

        {/* Dropdown Menu (Sidebar style on mobile, dropdown on desktop) */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <div className="fixed top-0 left-0 bottom-0 w-72 bg-surface z-50 shadow-2xl p-6 flex flex-col animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between mb-8">
                <span className="text-2xl font-bold text-white">Menu</span>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 bg-background rounded-xl text-white hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2 flex-grow">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-4 px-4 py-4 rounded-2xl text-secondary hover:bg-background hover:text-primary transition-colors font-medium group"
                  >
                    <span className="group-hover:text-primary transition-colors">{link.icon}</span>
                    <span className="text-lg">{link.name}</span>
                  </Link>
                ))}
              </div>

              <div className="pt-6 border-t border-white/5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-4 px-4 py-4 rounded-2xl text-error hover:bg-error/10 transition font-medium"
                >
                  <LogOut size={20} />
                  <span className="text-lg">Logout</span>
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <Outlet />
      </main>
      
      {/* Mobile Bottom Navigation - Hidden on Editor Pages */}
      {!isEditor && <MobileNav />}
    </div>
  );
};

export default Layout;
