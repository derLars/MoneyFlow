import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Receipt, LayoutDashboard, Settings, Users, ArrowRightLeft } from 'lucide-react';
import useAuthStore from '../store/authStore';

const MobileNav = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  
  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Purchases', path: '/purchases', icon: Receipt },
    { name: 'Analytics', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Money Flow', path: '/moneyflow', icon: ArrowRightLeft },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];
  
  // Add User Management for admins
  if (user?.administrator) {
    navItems.splice(4, 0, { name: 'Users', path: '/users', icon: Users });
  }
  
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-dark-border z-50 pb-safe-bottom">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                active 
                  ? 'text-deep-blue dark:text-dark-primary' 
                  : 'text-gray-400 dark:text-dark-text-secondary'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className={`text-[10px] mt-1 font-medium ${active ? 'font-bold' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
