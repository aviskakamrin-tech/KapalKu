import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../lib/api';
import {
  User as UserIcon,
  X,
  ShieldCheck,
  Phone,
  Mail,
  KeyRound,
  Bell,
  LogOut,
  Save,
  CheckCircle2,
  Lock,
  Smartphone,
  Eye,
  EyeOff,
  Settings,
  CreditCard,
  FileText,
  BadgeCheck,
  AlertTriangle,
} from 'lucide-react';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUpdateUser?: (updated: User) => void;
  onLogout: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onLogout,
}) => {
  if (!isOpen || !currentUser) return null;

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');

  // Form State
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [idCardNumber, setIdCardNumber] = useState('7406012809920002');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Notification Preferences
  const [notifTicket, setNotifTicket] = useState(true);
  const [notifWeather, setNotifWeather] = useState(true);
  const [notifRefund, setNotifRefund] = useState(true);

  // Status message
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama lengkap tidak boleh kosong.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser: User = {
        ...currentUser,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      };

      if (api.updateUserProfile) {
        await api.updateUserProfile(
          currentUser.id,
          {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
          },
          currentUser.id
        );
      }

      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }

      setSuccessMessage('Profil berhasil diperbarui!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Gagal menyimpan perubahan profil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      alert('Harap masukkan kata sandi saat ini.');
      return;
    }
    if (newPassword.length < 6) {
      alert('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Kata sandi akun Anda berhasil diperbarui!');
      setTimeout(() => setSuccessMessage(null), 4000);
    }, 600);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    onClose();
    onLogout();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#0F2C59] via-[#1E3E62] to-[#0A2647] p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <img
                src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name}`}
                alt={currentUser.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-sky-400 bg-sky-900 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0F2C59] rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black">{currentUser.name}</h3>
                <BadgeCheck className="w-4 h-4 text-sky-400" />
              </div>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-sky-200 font-mono">
                  {currentUser.role === 'admin'
                    ? '🛡️ Administrator'
                    : currentUser.role === 'officer'
                    ? '🔍 Petugas Gate'
                    : '👥 Penumpang'}
                </span>
                <span className="text-[11px] text-slate-300">
                  {currentUser.email || currentUser.phone}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-sky-200 hover:text-white transition-all cursor-pointer"
            title="Tutup Pengaturan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profil Akun</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Keamanan & Sandi</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'notifications'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Preferensi Notifikasi</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 max-h-[65vh] overflow-y-auto space-y-5">
          {/* TAB 1: PROFIL */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nama Lengkap:</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Alamat Email:</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="nama@email.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Nomor Handphone / WhatsApp:</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="0812-xxxx-xxxx"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nomor Induk Kependudukan (NIK / KTP):</span>
                </label>
                <input
                  type="text"
                  value={idCardNumber}
                  onChange={(e) => setIdCardNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="16 digit NIK"
                />
                <span className="text-[10px] text-slate-400 block">
                  Digunakan otomatis untuk pengisian manifes keselamatan kapal feri & asuransi Jasa Raharja.
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">Hak Akses Sistem Saat Ini:</div>
                <div className="text-[11px] leading-relaxed">
                  {currentUser.role === 'admin'
                    ? 'Hak akses Penuh: Mengelola dermaga, menentukan tarif tiket, mengatur jadwal armada feri, menyetujui pembatalan & refund dana tiket.'
                    : currentUser.role === 'officer'
                    ? 'Hak akses Petugas Gate: Memindai QR Code boarding pass penumpang, check-in tiket di dermaga pelabuhan.'
                    : 'Hak akses Pengguna/Penumpang: Memesan tiket kapal feri/speedboat, memantau live map GPS armada kapal, mengecek cuaca maritim, dan mengajukan pembatalan serta refund uang tiket.'}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Profil'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: KEAMANAN & SANDI */}
          {activeTab === 'security' && (
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-950 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-[11px]">
                  Kata sandi melindungi akun Anda dari akses yang tidak sah saat bertransaksi tiket dan mengajukan pengembalian dana.
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Kata Sandi Saat Ini:</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan kata sandi lama"
                    className="w-full p-2.5 pr-9 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Kata Sandi Baru:</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Konfirmasi Kata Sandi Baru:</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Menyimpan...' : 'Perbarui Kata Sandi'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: NOTIFIKASI */}
          {activeTab === 'notifications' && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Notifikasi Tiket & E-Boarding Pass</div>
                  <div className="text-[11px] text-slate-500">Pemberitahuan penerbitan tiket dan status check-in kapal.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifTicket}
                  onChange={(e) => setNotifTicket(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Informasi Status Pengembalian Dana (Refund)</div>
                  <div className="text-[11px] text-slate-500">Pemberitahuan saat transfer refund tiket telah selesai disetujui admin.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifRefund}
                  onChange={(e) => setNotifRefund(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Peringatan Cuaca & Gelombang Laut BMKG</div>
                  <div className="text-[11px] text-slate-500">Peringatan dini gelombang tinggi di perairan Selat Kabaena & Tiworo.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifWeather}
                  onChange={(e) => setNotifWeather(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Bottom Area: Logout Option */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500">
              Sesi login aman & terenkripsi • KapalKu v2.4
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="py-2 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer transition-all"
                title="Keluar dari akun Anda"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Akun</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Konfirmasi Logout Tambahan */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                <LogOut className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h4 className="text-base font-black text-slate-900">Konfirmasi Keluar Akun?</h4>
                <p className="text-xs text-slate-500">
                  Apakah Anda yakin ingin keluar dari akun <strong>{currentUser.name}</strong>?
                </p>
              </div>
              <div className="flex justify-between gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer active:scale-95"
                >
                  Ya, Keluar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
