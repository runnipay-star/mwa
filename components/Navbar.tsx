
import React from 'react';
import { UserProfile } from '../types';
import { LogOut, LayoutDashboard, User, Settings, ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

interface NavbarProps {
  user: UserProfile | null;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  logoSize: number;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onNavigate, logoSize }) => {
  const { totalItems } = useCart();

  return (
    <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer transition-all duration-300" 
            onClick={() => onNavigate('/')}
          >
            <img 
              src="https://res.cloudinary.com/dhj0ztos6/image/upload/v1764867375/mwa_trasparente_thl6fk.png" 
              alt="MWA Logo" 
              style={{ height: `${logoSize}px` }}
              className="w-auto object-contain transition-all duration-300"
            />
          </div>

          {/* Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => onNavigate('/')} 
              className="text-gray-600 hover:text-brand-600 font-medium transition-colors"
            >
              Corsi
            </button>
            
            {/* Cart Icon */}
            <button 
              onClick={() => onNavigate('/cart')}
              className="relative p-2 text-gray-600 hover:text-brand-600 transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                  {totalItems}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center space-x-4">
                {user.is_admin && (
                   <button 
                     onClick={() => onNavigate('/admin')}
                     className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center transition-colors shadow-md shadow-purple-500/20"
                   >
                     <Settings className="h-3 w-3 mr-1" /> ADMIN
                   </button>
                )}
                
                <button 
                  onClick={() => onNavigate('/dashboard')}
                  className="flex items-center text-gray-700 hover:text-brand-600 font-medium"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  I Miei Corsi
                </button>
                <div className="h-6 w-px bg-gray-200"></div>
                <div className="flex items-center text-sm text-gray-500">
                  <User className="h-4 w-4 mr-1" />
                  {user.full_name || user.email}
                </div>
                <button 
                  onClick={onLogout}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => onNavigate('/login')}
                  className="text-gray-600 hover:text-brand-600 font-medium"
                >
                  Accedi
                </button>
                <button 
                  onClick={() => onNavigate('/register')}
                  className="bg-brand-600 text-white px-5 py-2 rounded-full font-medium hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/30"
                >
                  Inizia Ora
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
