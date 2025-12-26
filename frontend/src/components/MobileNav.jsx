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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-white/5 z-50 pb-safe-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 active:scale-95 group relative`}
            >
              {active && (
                <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              )}
              
              <div className={`
                p-1.5 rounded-xl transition-colors
                ${active ? 'text-primary' : 'text-secondary group-hover:text-white'}
              `}>
                <Icon 
                  size={24} 
                  strokeWidth={active ? 2.5 : 2}
                  fill={active ? "currentColor" : "none"} 
                  fillOpacity={active ? 0.2 : 0}
                />
              </div>
              <span className={`text-[10px] mt-0.5 font-medium transition-colors ${active ? 'text-primary' : 'text-secondary'}`}>
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
