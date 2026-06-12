/**
 * Header Component - Shared Layout Component
 * 
 * This is a reusable header component designed to be copied and used across multiple applications.
 * It is fully self-contained with no page-specific logic or route dependencies.
 * All external data and actions are provided via props.
 */

import React from 'react';
import { LogOut } from 'lucide-react';

export interface HeaderAction {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  title: string;
  badge?: number;
}

export interface HeaderUser {
  name: string;
  role: string;
  roleLabel: string;
}

export interface HeaderProps {
  /** Logo images displayed on the left side */
  logos?: {
    primary: { src: string; alt: string };
    secondary: { src: string; alt: string };
  };
  
  /** User information displayed on the right side */
  user: HeaderUser;
  
  /** Optional actions/buttons shown to the right (e.g., notifications, settings) */
  actions?: HeaderAction[];
  
  /** Handler for logo click */
  onLogoClick?: () => void;
  
  /** Handler for user profile click */
  onUserClick?: () => void;
  
  /** Handler for logout */
  onLogout: () => void;
  
  /** Additional CSS classes for the header container */
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  logos = {
    primary: {
      src: 'https://leica-geosystems.com/-/media/images/hexagon_logo/hexagon_logo_balck_svg.ashx?sc_lang=en',
      alt: 'Hexagon'
    },
    secondary: {
      src: 'https://leica-geosystems.com/-/media/images/leicageosystems/logos%20and%20icons/icons/leica_geosystems_logo.ashx?sc_lang=en',
      alt: 'Leica'
    }
  },
  user,
  actions = [],
  onLogoClick,
  onUserClick,
  onLogout,
  className = ''
}) => {
  return (
    <header className={`bg-white sticky top-0 z-20 shadow-md border-b-4 border-hex-sky-dark print:hidden ${className}`}>
      <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between">
        {/* Logo Section */}
        <div 
          className="flex items-center gap-6 cursor-pointer" 
          onClick={onLogoClick}
        >
          <div className="flex items-center h-full gap-4 md:gap-6">
            <img 
              src={logos.primary.src} 
              alt={logos.primary.alt} 
              className="h-11 md:h-[3.75rem] w-auto object-contain" 
            />
            <div className="h-8 md:h-12 w-px bg-slate-300"></div>
            <img 
              src={logos.secondary.src} 
              alt={logos.secondary.alt} 
              className="h-11 md:h-[3.75rem] w-auto object-contain" 
            />
          </div>
        </div>

        {/* Actions and User Section */}
        <div className="flex items-center gap-4">
          {/* Dynamic Action Buttons */}
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="relative p-2 text-slate-500 hover:text-hex-sky transition-colors"
              title={action.title}
            >
              <action.icon className="w-6 h-6" />
              {action.badge !== undefined && action.badge > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {action.badge}
                </span>
              )}
            </button>
          ))}

          {/* User Profile Section */}
          <div className="text-right hidden md:block">
            <button
              onClick={onUserClick}
              className="text-left hover:bg-slate-50 p-2 rounded-lg transition-colors"
              title="Ver Perfil"
            >
              <div className="text-xs font-bold text-slate-800">{user.name}</div>
              <div className="text-[10px] text-slate-500 flex items-center justify-end gap-2">
                {user.roleLabel}
              </div>
            </button>
            <button 
              onClick={onLogout} 
              className="text-red-400 hover:text-red-600 font-bold flex items-center gap-1 text-[10px] mt-1" 
              title="Sair"
            >
              <LogOut className="w-3 h-3" /> Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
