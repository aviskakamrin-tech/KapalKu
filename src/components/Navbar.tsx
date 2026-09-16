import React, { useState, useRef, useEffect } from 'react';
import { Anchor, Bell, LogIn, LogOut, User as UserIcon, ChevronDown, ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  unreadCount: number;
  onOpenNotifications: () => void;
  currentUser: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  unreadCount,
  onOpenNotifications,
  currentUser,
  onOpenLogin,
  onLogout,
  onNavigateTab,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#0F2C59] text-white shadow-md border-b border-sky-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => onNavigateTab && onNavigateTab('beranda')}
          >
            <div className="bg-sky-500 p-2 rounded-xl text-white shadow-lg shadow-sky-500/30 flex items-center justify-center">
              <Anchor className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-bold text-xl tracking-tight text-white">KapalKu</span>
                <span className="text-xs bg-sky-500/30 text-sky-200 px-1.5 py-0.5 rounded font-mono font-medium">
                  ID Maritime
                </span>
              </div>
              <p className="text-[10px] text-sky-200 hidden sm:block font-medium">
                Informasi Laut, Lebih Mudah dan Aman.
              </p>
            </div>
          </div>

          {/* Right Actions: Notifications & User Profile / Login */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-sky-200 hover:bg-sky-900/80 hover:text-white transition-colors cursor-pointer"
              title="Notifikasi Pelayaran"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Profile or Login Trigger */}
            {currentUser ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 bg-sky-950/70 hover:bg-sky-900 border border-sky-700/60 pl-1.5 pr-2.5 py-1 rounded-xl transition-all cursor-pointer"
                >
                  <img
                    src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name}`}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full object-cover border border-sky-400"
                  />
                  <div className="text-left hidden md:block">
                    <div className="text-[11px] font-bold text-white max-w-[130px] truncate leading-tight" title={currentUser.name}>
                      {currentUser.name}
                    </div>
                    <div className="text-[9px] font-bold leading-tight flex items-center space-x-1">
                      {currentUser.role === 'admin' && (
                        <span className="text-indigo-300">🛡️ Admin Tarif & Rute</span>
                      )}
                      {currentUser.role === 'officer' && (
                        <span className="text-cyan-300">🔍 Petugas Gate</span>
                      )}
                      {currentUser.role === 'passenger' && (
                        <span className="text-sky-300">👥 Penumpang</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-sky-300" />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{currentUser.email || currentUser.phone}</div>
                      <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                        {currentUser.role === 'admin' && (
                          <span className="bg-indigo-100 text-indigo-800">🛡️ Administrator (Tarif & Rute)</span>
                        )}
                        {currentUser.role === 'officer' && (
                          <span className="bg-cyan-100 text-cyan-800">🔍 Petugas Scanner Gate</span>
                        )}
                        {currentUser.role === 'passenger' && (
                          <span className="bg-sky-100 text-sky-800">👥 Akun Penumpang</span>
                        )}
                      </div>
                    </div>

                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center space-x-1.5 text-[10px] text-slate-500 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Auto Log-out Aktif Saat Keluar / Idle</span>
                    </div>

                    <div className="py-1 text-xs">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenLogin();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center space-x-2 cursor-pointer font-medium"
                      >
                        <UserIcon className="w-4 h-4 text-sky-600" />
                        <span>Ganti Akun / Masuk</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-semibold flex items-center space-x-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Keluar (Logout)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center space-x-1.5 bg-sky-500 hover:bg-sky-400 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
