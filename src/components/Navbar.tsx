import React, { useState, useRef, useEffect } from 'react';
import { Anchor, ShieldAlert, Bell, Ship, UserCheck, Compass, LogIn, LogOut, User as UserIcon, ChevronDown, Check } from 'lucide-react';
import { Role, User } from '../types';

interface NavbarProps {
  activeRole: Role;
  onRoleChange: (role: Role) => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenSOS: () => void;
  currentUser: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRole,
  onRoleChange,
  unreadCount,
  onOpenNotifications,
  onOpenSOS,
  currentUser,
  onOpenLogin,
  onLogout,
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
            onClick={() => onRoleChange('passenger')}
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

          {/* Role Switcher Pills */}
          <div className="hidden sm:flex items-center bg-sky-950/80 p-1 rounded-xl border border-sky-800/60 shadow-inner">
            <button
              onClick={() => onRoleChange('passenger')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'passenger'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-sky-200 hover:text-white hover:bg-sky-900/50'
              }`}
              title="Mode Penumpang / Warga"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Penumpang</span>
            </button>

            <button
              onClick={() => onRoleChange('operator')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'operator'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-sky-200 hover:text-white hover:bg-sky-900/50'
              }`}
              title="Mode Nakhoda / Operator Kapal"
            >
              <Ship className="w-3.5 h-3.5" />
              <span>Nakhoda</span>
            </button>

            <button
              onClick={() => onRoleChange('admin')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'admin'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-sky-200 hover:text-white hover:bg-sky-900/50'
              }`}
              title="Mode Syahbandar / Admin Pelabuhan"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Syahbandar</span>
            </button>
          </div>

          {/* Right Actions: Notifications, SOS & User Profile / Login */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-sky-200 hover:bg-sky-900/80 hover:text-white transition-colors"
              title="Notifikasi Pelayaran"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* SOS Emergency Button */}
            <button
              onClick={onOpenSOS}
              className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg shadow-red-600/30 transition-all active:scale-95 sos-beacon"
            >
              <ShieldAlert className="w-4 h-4 animate-bounce" />
              <span>SOS</span>
            </button>

            {/* User Profile or Login Trigger */}
            {currentUser ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 bg-sky-950/70 hover:bg-sky-900 border border-sky-700/60 pl-1.5 pr-2.5 py-1 rounded-xl transition-all"
                >
                  <img
                    src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name}`}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full object-cover border border-sky-400"
                  />
                  <div className="text-left hidden md:block">
                    <div className="text-[11px] font-bold text-white max-w-[100px] truncate leading-tight">
                      {currentUser.name.split(' ')[0]}
                    </div>
                    <div className="text-[9px] text-sky-300 capitalize leading-tight">
                      {currentUser.role === 'passenger' ? 'Penumpang' : currentUser.role === 'operator' ? 'Nakhoda' : 'Syahbandar'}
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
                      <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800">
                        {currentUser.role === 'passenger' && '👥 Akun Penumpang'}
                        {currentUser.role === 'operator' && '👨‍✈️ Akun Nakhoda Kapal'}
                        {currentUser.role === 'admin' && '🛡️ Akun Otoritas Syahbandar'}
                      </div>
                      {currentUser.agencyOrVessel && (
                        <div className="text-[10px] text-slate-600 mt-1 font-medium">
                          ⚓ {currentUser.agencyOrVessel}
                        </div>
                      )}
                    </div>

                    <div className="py-1 text-xs">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenLogin();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center space-x-2"
                      >
                        <UserIcon className="w-4 h-4 text-sky-600" />
                        <span>Ganti Akun / Masuk Lain</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-semibold flex items-center space-x-2"
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
                className="flex items-center space-x-1.5 bg-sky-500 hover:bg-sky-400 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Role Banner Indicator */}
      <div className="bg-sky-950/90 text-sky-300 text-[11px] py-1 px-4 border-t border-sky-900 flex justify-between items-center text-center">
        <span className="mx-auto font-medium">
          {activeRole === 'passenger' && '👥 Mode Penumpang: Cari rute, jadwal, reservasi tiket & pantau lokasi kapal real-time.'}
          {activeRole === 'operator' && '👨‍✈️ Mode Nakhoda / Operator: Kelola GPS tracking, update status pelayaran & manifest penumpang.'}
          {activeRole === 'admin' && '🛡️ Mode Syahbandar / Admin: Monitoring lalu lintas laut, persetujuan SPB, cuaca & tanggap SOS.'}
        </span>
      </div>
    </header>
  );
};

