import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../lib/api';
import {
  Anchor,
  Compass,
  Ship,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  FileText,
} from 'lucide-react';

interface LoginPageProps {
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  onClose?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  currentUser,
  onLoginSuccess,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

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
        role: 'passenger',
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
      setErrorMessage('Anda harus menyetujui Syarat & Ketentuan Keselamatan Maritim.');
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
        role: 'passenger',
        password: regPassword,
      });

      setSuccessMessage(`Pendaftaran berhasil! Selamat datang di KapalKu, ${res.user.name}`);
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 700);
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
    <div className="w-full max-w-4xl mx-auto py-2 sm:py-6 px-2 sm:px-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Maritime Showcase Banner */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0A2647] via-[#0F2C59] to-[#144272] text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Background Maritime Waves Accent */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
          
          {/* Top Brand Header */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-sky-500 p-2.5 rounded-2xl text-white shadow-lg shadow-sky-500/40">
                <Anchor className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-2xl tracking-tight text-white">KapalKu</span>
                  <span className="text-[10px] bg-sky-400/20 border border-sky-400/30 text-sky-200 px-2 py-0.5 rounded-md font-mono font-bold">
                    PORTAL PENUMPANG
                  </span>
                </div>
                <p className="text-xs text-sky-200 font-medium">
                  Sistem Informasi & Tiket Maritim Terpadu
                </p>
              </div>
            </div>

            <div className="pt-2">
              <h2 className="text-lg font-bold text-sky-100">
                {authMode === 'login' ? 'Masuk ke Layanan Penumpang' : 'Registrasi Akun Penumpang'}
              </h2>
              <p className="text-xs text-sky-200/90 leading-relaxed mt-1">
                Akses jadwal keberangkatan, pemesanan tiket feri & speedboat, live radar AIS kapal yang Anda tumpangi, informasi cuaca pelayaran BMKG, dan boarding pass elektronik.
              </p>
            </div>
          </div>

          {/* Maritime Platform Features Showcase */}
          <div className="relative z-10 my-6 bg-sky-950/70 border border-sky-700/50 rounded-2xl p-4 space-y-3.5 backdrop-blur-sm shadow-inner">
            <span className="text-[11px] font-bold tracking-wide uppercase text-sky-300 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Fitur Layanan Penumpang</span>
            </span>

            <div className="space-y-2.5 text-xs text-sky-100">
              <div className="flex items-start space-x-2.5 p-2 rounded-xl bg-white/5 border border-white/10">
                <Ship className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white text-[11px]">Live Map Radar AIS</div>
                  <div className="text-[10px] text-sky-200/80">Pantau posisi kapal tiket Anda sepanjang alur laut nyata.</div>
                </div>
              </div>

              <div className="flex items-start space-x-2.5 p-2 rounded-xl bg-white/5 border border-white/10">
                <FileText className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white text-[11px]">E-Ticket Resmi & QR Gate</div>
                  <div className="text-[10px] text-sky-200/80">Pemesanan praktis dengan boarding pass dan invoice digital.</div>
                </div>
              </div>

              <div className="flex items-start space-x-2.5 p-2 rounded-xl bg-white/5 border border-white/10">
                <Compass className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white text-[11px]">Info Cuaca BMKG & SOS</div>
                  <div className="text-[10px] text-sky-200/80">Informasi gelombang laut dan tombol bantuan darurat 24 jam.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Assurance */}
          <div className="relative z-10 pt-2 border-t border-sky-800/80 flex items-center space-x-2 text-[11px] text-sky-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Terintegrasi Standar Keselamatan Laut Kemenhub RI & BMKG</span>
          </div>
        </div>

        {/* Right Authentication Form Area */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Tab Navigation: Masuk vs Daftar */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  authMode === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Masuk ke Akun
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
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

            {/* ===================== LOGIN FORM ===================== */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Lengkap, Email, atau Nomor WhatsApp / HP
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4 text-sky-600" />
                    </div>
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="Masukkan nama lengkap, email, atau nomor HP"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs text-sky-600 hover:text-sky-700 hover:underline font-semibold"
                    >
                      Lupa kata sandi?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Masukkan kata sandi akun Anda"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                    />
                    <span className="text-xs text-slate-600 select-none">Ingat akun saya di perangkat ini</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-sky-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer active:scale-[0.99]"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Masuk Sekarang</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ===================== REGISTER FORM ===================== */}
            {authMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Contoh: Muhammad Ramli"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alamat Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="nama@email.com"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomor WhatsApp / HP
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="0812-xxxx-xxxx"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kata Sandi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 6 karakter"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ulangi Kata Sandi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={regPasswordConfirm}
                      onChange={(e) => setRegPasswordConfirm(e.target.value)}
                      placeholder="Ulangi kata sandi"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={regAgreed}
                      onChange={(e) => setRegAgreed(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                      required
                    />
                    <span className="text-[11px] text-slate-600 leading-tight">
                      Saya menyetujui Ketentuan Layanan & Protokol Keselamatan Maritim Republik Indonesia.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-sky-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer active:scale-[0.99]"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Daftar Akun Baru</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Bottom Security & Help Footer */}
          <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Perlu bantuan akses tiket & jadwal?</span>
            <span className="font-semibold text-sky-700">Call Center: 1500-112</span>
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
                  Instruksi pemulihan kata sandi telah dikirim ke <strong>{forgotInput}</strong>. Silakan periksa kotak masuk atau WhatsApp Anda.
                </p>
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSuccess(false);
                    setForgotInput('');
                  }}
                  className="w-full mt-2 py-2 bg-emerald-600 text-white rounded-xl font-bold"
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
                  placeholder="faisal@example.com atau 0812..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                />
                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/30"
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
