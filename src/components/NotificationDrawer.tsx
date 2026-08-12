import React from 'react';
import { NotificationItem } from '../types';
import { X, Bell, ShieldAlert, Ship, Calendar, CloudSun, Ticket } from 'lucide-react';

interface NotificationDrawerProps {
  notifications: NotificationItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  notifications,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="bg-[#0F2C59] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-sky-400" />
            <h3 className="font-extrabold text-base">Notifikasi & Pengumuman</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-sky-900 text-sky-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center text-slate-400 py-12 text-xs">
              Belum ada notifikasi pelayaran.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border text-xs space-y-1 transition-all ${
                  n.type === 'sos'
                    ? 'bg-red-50 border-red-200'
                    : n.type === 'cancel' || n.type === 'delay'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm">{n.title}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">{n.createdAt}</span>
                </div>
                <p className="text-slate-600 leading-relaxed">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
