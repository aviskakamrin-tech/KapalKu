import React, { useState, useEffect } from 'react';
import { User, Role } from '../../types';
import { api } from '../../lib/api';
import {
  Anchor,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  X,
  SlidersHorizontal,
  ScanLine,
} from 'lucide-react';

interface LoginPageProps {
  currentUser?: User | null;
  onLoginSuccess: (user: User) => void;
  onClose?: () => void;
  targetRole?: Role;
  onSelectRolePortal?: (role: Role) => void;
  onOpenRoleLinks?: () => void;
  onOpenSupabaseModal?: () => void;
  isFixedPortal?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  currentUser,
  onLoginSuccess,
  onClose,
  targetRole,
}) => {
  const activeRole: Role = targetRole || 'passenger';
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [regAgreed, setRegAgreed] = useState(false);

  // Feedback & State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const roleMeta = {
    admin: {
      badge: 'PORTAL LOGIN ADMINISTRATOR',
      badgeClass: 'bg-indigo-400/20 border-indigo-400/40 text-indigo-200',
      iconBg: 'bg-indigo-600 shadow-indigo-600/40',
      icon: <SlidersHorizontal className="w-6 h-6 text-white" />,
      title: 'KapalKu Administrator',
      subtitle: 'Pengelolaan Tarif, Rute, Armada & Jadwal Pelayaran',
      loginBtnText: 'Masuk sebagai Admin',
      registerBtnText: 'Daftar Akun Admin',
      placeholder: 'admin@kapalku.id atau nama admin',
      accentColor: 'indigo',
      submitBtnClass: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30',
    },
    officer: {
      badge: 'PORTAL LOGIN PETUGAS LAPANGAN',
      badgeClass: 'bg-cyan-400/20 border-cyan-400/40 text-cyan-200',
      iconBg: 'bg-cyan-600 shadow-cyan-600/40',
      icon: <ScanLine className="w-6 h-6 text-white" />,
      title: 'KapalKu Petugas Lapangan',
      subtitle: 'Scanner Barcode Boarding, Gate & Validasi Manifes',
      loginBtnText: 'Masuk sebagai Petugas',
      registerBtnText: 'Daftar Akun Petugas',
      placeholder: 'petugas@kapalku.id atau nama petugas',
      accentColor: 'cyan',
      submitBtnClass: 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-600/30',
    },
    passenger: {
      badge: 'PORTAL RESMI PENGGUNA',
      badgeClass: 'bg-sky-400/20 border-sky-400/40 text-sky-200',
      iconBg: 'bg-sky-500 shadow-sky-500/40',
      icon: <Anchor className="w-6 h-6 text-white" />,
      title: 'KapalKu Penumpang',
      subtitle: 'Pemesanan Tiket Online, Jadwal & Live Tracking',
      loginBtnText: 'Masuk ke Akun',
      registerBtnText: 'Daftar Akun Baru',
      placeholder: 'nama@email.com atau 0812...',
      accentColor: 'sky',
      submitBtnClass: 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/30',
    },
  }[activeRole];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setErrorMessage('Silakan masukkan nama lengkap, email, atau nomor HP Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.login({
        identifier: loginIdentifier.trim(),
        password: loginPassword,
        role: activeRole,
      });

      setSuccessMessage(res.message || `Selamat datang kembali, ${res.user.name}!`);
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login gagal. Periksa kembali informasi yang dimasukkan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }
    if (!regEmail.trim() && !regPhone.trim()) {
      setErrorMessage('Email atau Nomor WhatsApp/HP wajib diisi.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }
    if (regPassword !== regPasswordConfirm) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (!regAgreed) {
      setErrorMessage('Anda harus menyetujui Ketentuan Layanan & Protokol Keselamatan Maritim.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.register({
        name: regName.trim(),
        email: regEmail.trim() || undefined,
        phone: regPhone.trim() || undefined,
        role: activeRole,
        password: regPassword,
      });

      setSuccessMessage(`Pendaftaran berhasil! Selamat datang di KapalKu, ${res.user.name}.`);
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Pendaftaran gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotInput.trim()) return;
    setForgotSuccess(true);
  };

  return (
    <div className="w-full max-w-lg mx-auto py-4 px-2 sm:px-4">
      {/* Main Authentication Card */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden relative">
        {/* Top Header Branding Tailored to Role */}
        <div className="bg-gradient-to-r from-[#0A2647] via-[#0F2C59] to-[#144272] text-white p-6 sm:p-7 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="relative z-10 flex items-center space-x-3.5">
            <div className={`p-3 rounded-2xl text-white shadow-lg ${roleMeta.iconBg}`}>
              {roleMeta.icon}
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="font-extrabold text-2xl tracking-tight text-white">
                  {roleMeta.title}
                </span>
                <span
                  className={`text-[10px] border px-2 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider ${roleMeta.badgeClass}`}
                >
                  {roleMeta.badge}
                </span>
              </div>
              <p className="text-xs text-sky-200/90 font-medium mt-0.5">
                {roleMeta.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher: Masuk Akun vs Daftar Akun */}
        <div className="p-6 sm:p-7 pt-5">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Daftar Akun Baru
            </button>
          </div>

          {/* Alert Messages */}
          {errorMessage && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>{successMessage}</div>
            </div>
          )}

          {/* ===================== TAB 1: MASUK AKUN ===================== */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email, Nomor WhatsApp / HP, atau Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4 text-sky-600" />
                  </div>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder={roleMeta.placeholder}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotInput(loginIdentifier.trim());
                      setForgotSuccess(false);
                      setShowForgotModal(true);
                    }}
                    className="text-xs text-sky-600 hover:text-sky-700 hover:underline font-semibold cursor-pointer"
                  >
                    Lupa kata sandi?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Masukkan kata sandi Anda"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full mt-2 py-3 px-4 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer active:scale-[0.99] ${roleMeta.submitBtnClass}`}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{roleMeta.loginBtnText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Belum memiliki akun? </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-xs text-sky-600 hover:text-sky-700 font-bold hover:underline cursor-pointer"
                >
                  Daftar di sini
                </button>
              </div>
            </form>
          )}

          {/* ===================== TAB 2: DAFTAR AKUN BARU ===================== */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4 text-sky-600" />
                  </div>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kata Sandi <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 6 karakter"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ulangi Kata Sandi <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      value={regPasswordConfirm}
                      onChange={(e) => setRegPasswordConfirm(e.target.value)}
                      placeholder="Ulangi kata sandi"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regAgreed}
                    onChange={(e) => setRegAgreed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                    required
                  />
                  <span className="text-[11px] text-slate-600 leading-tight">
                    Saya menyetujui Ketentuan Layanan & Kebijakan Privasi Pengguna Maritim KapalKu.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full mt-2 py-3 px-4 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer active:scale-[0.99] ${roleMeta.submitBtnClass}`}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{roleMeta.registerBtnText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Sudah memiliki akun? </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-xs text-sky-600 hover:text-sky-700 font-bold hover:underline cursor-pointer"
                >
                  Masuk di sini
                </button>
              </div>
            </form>
          )}

          {/* Security Assurance */}
          <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-center space-x-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Koneksi aman terenkripsi & data akun terlindungi</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-sky-100 text-sky-700 rounded-2xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Pemulihan Kata Sandi</h3>
                <p className="text-xs text-slate-500">Kirim instruksi reset via Email atau WhatsApp</p>
              </div>
            </div>

            {forgotSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl space-y-2 text-xs">
                <div className="font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Tautan Pemulihan Terkirim!</span>
                </div>
                <p>
                  Instruksi pemulihan kata sandi telah dikirim ke <strong>{forgotInput}</strong>.
                </p>
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSuccess(false);
                    setForgotInput('');
                  }}
                  className="w-full mt-2 py-2.5 bg-emerald-600 text-white rounded-xl font-bold cursor-pointer hover:bg-emerald-700"
                >
                  Tutup & Kembali ke Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Email atau Nomor WhatsApp Terdaftar:
                </label>
                <input
                  type="text"
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                  placeholder="nama@email.com atau 0812..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white outline-none"
                  required
                />
                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/30 cursor-pointer"
                  >
                    Kirim Instruksi
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
