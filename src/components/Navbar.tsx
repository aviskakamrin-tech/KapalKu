import React from 'react';
import { Anchor, ShieldAlert, Bell, Ship, UserCheck, Compass } from 'lucide-react';
import { Role } from '../types';

interface NavbarProps {
  activeRole: Role;
  onRoleChange: (role: Role) => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenSOS: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRole,
  onRoleChange,
  unreadCount,
  onOpenNotifications,
  onOpenSOS,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0F2C59] text-white shadow-md border-b border-sky-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onRoleChange('passenger')}>
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
          <div className="flex items-center bg-sky-950/80 p-1 rounded-xl border border-sky-800/60 shadow-inner">
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
              <span className="hidden md:inline">Penumpang</span>
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
              <span className="hidden md:inline">Nakhoda</span>
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
              <span className="hidden md:inline">Syahbandar</span>
            </button>
          </div>

          {/* Quick Actions (Notifications & SOS) */}
          <div className="flex items-center space-x-2">
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

            <button
              onClick={onOpenSOS}
              className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg shadow-red-600/30 transition-all active:scale-95 sos-beacon"
            >
              <ShieldAlert className="w-4 h-4 animate-bounce" />
              <span>SOS</span>
            </button>
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
