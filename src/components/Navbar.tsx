import React from 'react';
import { CurrentUser } from '../types';
import { ShoppingBag, User, LogOut, Shield, Factory, Store } from 'lucide-react';

interface NavbarProps {
  currentUser: CurrentUser | null;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  cartCount,
  onOpenCart,
  onOpenAuth,
  onLogout,
  activeView,
  setActiveView,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Distribuidora Serrana Spress) */}
        <button
          onClick={() => setActiveView('landing')}
          className="flex items-center gap-2.5 group whitespace-nowrap shrink-0 text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b00] to-[#ea580c] flex items-center justify-center font-extrabold text-white text-sm tracking-wider shadow-sm group-hover:scale-105 transition-transform">
            DS
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#ff5500] leading-tight">
              Distribuidora
            </span>
            <div className="text-xl font-black tracking-tight text-slate-900 font-display leading-tight flex items-center gap-1">
              <span>Serrana</span>
              <span className="text-[#ff5500]">Spress</span>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold leading-none hidden sm:block">
              Polo Calçadista Nova Serrana
            </div>
          </div>
        </button>

        {/* Zone 2: 4-5 Concise Single-line Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <button
            onClick={() => setActiveView('landing')}
            className={`whitespace-nowrap transition-colors cursor-pointer ${
              activeView === 'landing' ? 'text-[#ff5500]' : 'hover:text-slate-900'
            }`}
          >
            Catálogo Geral
          </button>
          <button
            onClick={() => {
              setActiveView('landing');
              const el = document.getElementById('como-funciona');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="whitespace-nowrap hover:text-slate-900 transition-colors cursor-pointer"
          >
            Como Funciona
          </button>
          <button
            onClick={() => {
              setActiveView('landing');
              const el = document.getElementById('fabricantes-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="whitespace-nowrap hover:text-slate-900 transition-colors cursor-pointer"
          >
            Para Fabricantes
          </button>
          <button
            onClick={() => {
              setActiveView('landing');
              const el = document.getElementById('lojistas-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="whitespace-nowrap hover:text-slate-900 transition-colors cursor-pointer"
          >
            Para Lojistas
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action & Cart */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Cart button */}
          <button
            onClick={onOpenCart}
            className="relative p-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Ver Carrinho de Compras"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff5500] text-white text-[11px] font-extrabold rounded-full flex items-center justify-center font-mono shadow-xs">
                {cartCount}
              </span>
            )}
          </button>

          {/* User state / Action button */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (currentUser.role === 'admin') setActiveView('admin');
                  else if (currentUser.role === 'manufacturer') setActiveView('manufacturer');
                  else setActiveView('retailer');
                }}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 transition-colors cursor-pointer"
              >
                {currentUser.role === 'admin' && <Shield className="w-3.5 h-3.5 text-amber-500" />}
                {currentUser.role === 'manufacturer' && <Factory className="w-3.5 h-3.5 text-[#ff5500]" />}
                {currentUser.role === 'retailer' && <Store className="w-3.5 h-3.5 text-blue-600" />}
                <span className="truncate max-w-[140px]">
                  {'brandName' in currentUser
                    ? currentUser.brandName
                    : 'storeName' in currentUser
                    ? currentUser.storeName
                    : currentUser.name}
                </span>
              </button>

              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                title="Sair da conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#ff5500] hover:bg-[#ea580c] rounded-xl transition-all shadow-sm hover:shadow-md whitespace-nowrap cursor-pointer flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
