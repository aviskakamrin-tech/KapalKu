import React, { useState } from 'react';
import { User, Reservation, Dock } from '../../types';
import { api } from '../../lib/api';
import {
  Users,
  Search,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Ticket,
  X,
  CheckCircle2,
  Filter,
  Plus,
  KeyRound,
  Copy,
  Check,
  Trash2,
  Edit3,
  ScanLine,
  Anchor,
  AlertCircle,
  Building,
  UserCheck,
  UserX,
  Share2,
} from 'lucide-react';

interface UserManagerProps {
  users: User[];
  docks?: Dock[];
  reservations: Reservation[];
  onRefreshData: () => void;
}

export const UserManager: React.FC<UserManagerProps> = ({
  users,
  docks = [],
  reservations,
  onRefreshData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'officers' | 'passengers' | 'all'>('officers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Modal Tambah Petugas
  const [isAddOfficerModalOpen, setIsAddOfficerModalOpen] = useState(false);
  const [officerName, setOfficerName] = useState('');
  const [officerNip, setOfficerNip] = useState('');
  const [officerEmail, setOfficerEmail] = useState('');
  const [officerPhone, setOfficerPhone] = useState('');
  const [officerPassword, setOfficerPassword] = useState('Petugas123#');
  const [officerDockId, setOfficerDockId] = useState(docks[0]?.id || 'dock_kasipute');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Modal Sukses / Kredensial Baru
  const [createdOfficerCreds, setCreatedOfficerCreds] = useState<{
    officer: User;
    rawPassword: string;
  } | null>(null);

  // Modal Edit / Reset Password Petugas
  const [editingOfficer, setEditingOfficer] = useState<User | null>(null);
  const [editDockId, setEditDockId] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editStatus, setEditStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [isUpdating, setIsUpdating] = useState(false);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Generate random password helper
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let res = 'Ptg';
    for (let i = 0; i < 5; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    res += '@' + Math.floor(10 + Math.random() * 90);
    setOfficerPassword(res);
  };

  // Generate auto NIP helper
  const handleAutoNip = () => {
    const randomDigits = Math.floor(100 + Math.random() * 900);
    setOfficerNip(`NIP-PTG-${new Date().getFullYear()}-${randomDigits}`);
  };

  // Officer filter & passenger filter
  const officerUsers = users.filter((u) => u.role === 'officer');
  const passengerUsers = users.filter((u) => u.role === 'passenger');
  const adminUsers = users.filter((u) => u.role === 'admin');

  const displayedUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.nip && u.nip.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phone && u.phone.includes(searchQuery));

    if (!matchesSearch) return false;
    if (activeSubTab === 'officers') return u.role === 'officer';
    if (activeSubTab === 'passengers') return u.role === 'passenger';
    return true;
  });

  // Calculate ticket reservations for a user
  const getUserReservations = (user: User) => {
    return reservations.filter(
      (r) =>
        r.userId === user.id ||
        (user.email && r.userEmail && r.userEmail.toLowerCase() === user.email.toLowerCase()) ||
        (user.phone && r.userPhone && r.userPhone.replace(/[^0-9]/g, '') === user.phone.replace(/[^0-9]/g, '')) ||
        r.userName.toLowerCase() === user.name.toLowerCase()
    );
  };

  // Handle Create Officer
  const handleCreateOfficerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerName.trim()) {
      setFormError('Nama lengkap petugas wajib diisi.');
      return;
    }
    if (!officerEmail.trim()) {
      setFormError('Email petugas wajib diisi.');
      return;
    }
    if (!officerPassword || officerPassword.length < 6) {
      setFormError('Kata sandi petugas minimal 6 karakter.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const selectedDock = docks.find((d) => d.id === officerDockId);
      const newOfficer = await api.createOfficerAccount({
        name: officerName.trim(),
        nip: officerNip.trim() || `NIP-PTG-${Date.now().toString().slice(-4)}`,
        email: officerEmail.trim(),
        phone: officerPhone.trim() || '0812-4211-3344',
        password: officerPassword,
        dockId: officerDockId,
        dockName: selectedDock?.name || 'Pelabuhan Ferry Kampung Baru (Kasipute, Bombana)',
      });

      setCreatedOfficerCreds({
        officer: newOfficer,
        rawPassword: officerPassword,
      });

      // Reset form
      setOfficerName('');
      setOfficerNip('');
      setOfficerEmail('');
      setOfficerPhone('');
      setOfficerPassword('Petugas123#');
      setIsAddOfficerModalOpen(false);

      onRefreshData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menambahkan akun petugas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Officer
  const handleOpenEditOfficer = (officer: User) => {
    setEditingOfficer(officer);
    setEditDockId(officer.dockId || docks[0]?.id || '');
    setEditNewPassword('');
    setEditStatus(officer.status || 'Aktif');
  };

  const handleUpdateOfficerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfficer) return;
    setIsUpdating(true);

    try {
      const selectedDock = docks.find((d) => d.id === editDockId);
      const updateData: Partial<User> = {
        dockId: editDockId,
        dockName: selectedDock?.name || editingOfficer.dockName,
        status: editStatus,
      };

      if (editNewPassword.trim()) {
        updateData.password = editNewPassword.trim();
      }

      await api.updateOfficerAccount(editingOfficer.id, updateData);
      setEditingOfficer(null);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui data petugas.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Delete Officer
  const handleDeleteOfficer = async (officer: User) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun petugas "${officer.name}" (${officer.nip || officer.email})? Petugas ini tidak akan dapat login lagi.`)) {
      return;
    }

    try {
      await api.deleteOfficerAccount(officer.id);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus akun petugas.');
    }
  };

  // Copy Credential Text Format
  const copyOfficerCredentials = (officer: User, pass?: string) => {
    const passwordToCopy = pass || officer.password || 'petugas123';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kapalku.vercel.app';
    const loginLink = `${origin}/?role=officer&login=true#/petugas`;

    const text = `⚓ KREDENSIAL RESMI AKUN PETUGAS GATE KAPALKU ⚓
--------------------------------------------------
Nama Lengkap : ${officer.name}
NIP / ID     : ${officer.nip || '-'}
Penugasan    : ${officer.dockName || 'Dermaga Kampung Baru'}
Email / Login: ${officer.email}
Kata Sandi   : ${passwordToCopy}
Status Akun  : ${officer.status || 'Aktif'}
--------------------------------------------------
🔗 Link Login Petugas:
${loginLink}

*PENTING*:
Petugas tidak dapat membuat akun sendiri. Gunakan Email/NIP dan Kata Sandi di atas untuk masuk ke Scanner Boarding Gate.`;

    navigator.clipboard.writeText(text);
    setCopiedId(officer.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0F2C59] via-[#1E3E62] to-[#0A2647] p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-cyan-500/20 border border-cyan-400/40 rounded-full text-cyan-200 text-xs font-bold">
            <ScanLine className="w-3.5 h-3.5 text-cyan-300" />
            <span>MANAJEMEN AKUN PETUGAS & PENGGUNA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Kelola Akun Petugas Gate & Direktori Penumpang
          </h2>
          <p className="text-xs sm:text-sm text-cyan-100/90 max-w-2xl leading-relaxed">
            Administrator memiliki kewenangan penuh untuk <strong>menerbitkan akun petugas gate dermaga</strong> beserta kata sandi resminya. Petugas tidak dapat mendaftar mandiri demi keamanan verifikasi boarding pass.
          </p>
        </div>

        <div className="relative z-10 shrink-0">
          <button
            type="button"
            onClick={() => {
              setFormError('');
              setIsAddOfficerModalOpen(true);
            }}
            className="w-full sm:w-auto px-5 py-3.5 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-cyan-500/30 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Akun Petugas Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setActiveSubTab('officers')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeSubTab === 'officers'
              ? 'bg-cyan-50 border-cyan-300 ring-2 ring-cyan-500'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-cyan-800 font-bold uppercase tracking-wider block">
              Petugas Gate Jaga
            </span>
            <ScanLine className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-cyan-900 mt-1">{officerUsers.length}</div>
          <span className="text-[11px] text-cyan-700 font-medium">Akun diterbitkan admin</span>
        </div>

        <div
          onClick={() => setActiveSubTab('passengers')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeSubTab === 'passengers'
              ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-500'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-sky-800 font-bold uppercase tracking-wider block">
              Akun Penumpang
            </span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-sky-900 mt-1">{passengerUsers.length}</div>
          <span className="text-[11px] text-sky-700 font-medium">Daftar mandiri di web</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider block">
              Administrator
            </span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900">{adminUsers.length}</div>
          <span className="text-[11px] text-indigo-700 font-medium">Pengelola operasional</span>
        </div>

        <div
          onClick={() => setActiveSubTab('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeSubTab === 'all'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-800'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Total Seluruh Akun
            </span>
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{users.length}</div>
          <span className="text-[11px] text-slate-500 font-medium">Terdaftar di sistem</span>
        </div>
      </div>

      {/* Main SubTab Switcher & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 w-full md:w-auto">
          <button
            onClick={() => setActiveSubTab('officers')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeSubTab === 'officers'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Akun Petugas Gate ({officerUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('passengers')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeSubTab === 'passengers'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Akun Penumpang ({passengerUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('all')}
            className={`hidden sm:flex px-3 py-2 rounded-xl text-xs font-bold transition-all items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>Semua ({users.length})</span>
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIP, email, atau no HP..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none"
          />
        </div>
      </div>

      {/* Information & Dedicated Form based on subtab */}
      {activeSubTab === 'officers' ? (
        <div className="space-y-4">
          {/* Success Banner if credentials newly created */}
          {createdOfficerCreds && (
            <div className="p-5 bg-emerald-500/10 border-2 border-emerald-500 rounded-3xl text-emerald-950 shadow-md animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm sm:text-base text-emerald-950">
                      Akun Petugas Berhasil Diterbitkan & Aktif!
                    </h4>
                    <p className="text-xs text-emerald-800">
                      Akun telah terdaftar di database sistem. Berikan kredensial di bawah kepada petugas untuk login di portal Scanner Gate.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => copyOfficerCredentials(createdOfficerCreds.officer, createdOfficerCreds.rawPassword)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow flex items-center space-x-1.5 cursor-pointer"
                  >
                    {copiedId === createdOfficerCreds.officer.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Tersalin ke Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin Format WhatsApp Petugas</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatedOfficerCreds(null)}
                    className="p-2 text-emerald-700 hover:bg-emerald-100 rounded-xl cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs bg-white/80 p-3.5 rounded-2xl border border-emerald-200 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Nama Petugas</span>
                  <strong className="text-slate-900 font-sans">{createdOfficerCreds.officer.name}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">NIP / ID</span>
                  <strong className="text-cyan-800">{createdOfficerCreds.officer.nip || '-'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Email Login</span>
                  <strong className="text-slate-900">{createdOfficerCreds.officer.email}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Kata Sandi</span>
                  <strong className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-xs">{createdOfficerCreds.rawPassword}</strong>
                </div>
              </div>
            </div>
          )}

          {/* DEDICATED INLINE FORM: Admin Menambahkan Akun Petugas Secara Mandiri */}
          <div className="bg-gradient-to-br from-slate-900 via-[#0F2C59] to-[#0A2647] rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-cyan-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 bg-cyan-500/20 border border-cyan-400/40 rounded-full text-cyan-200 text-[11px] font-bold">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-300" />
                  <span>PENERBITAN AKUN RESMI PETUGAS OLEH ADMIN</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Formulir Tambah Akun Petugas (Diisi Mandiri oleh Admin)
                </h3>
                <p className="text-xs text-cyan-100/90 max-w-2xl leading-relaxed">
                  Petugas gate di dermaga <strong>tidak dapat membuat akun sendiri</strong>. Administrator pelabuhan wajib mengisi identitas petugas di bawah ini untuk menerbitkan username & kata sandi resmi petugas.
                </p>
              </div>

              <div className="shrink-0 flex items-center space-x-2">
                <span className="px-3 py-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 rounded-xl text-xs font-bold">
                  🛡️ Akses Mandiri Admin
                </span>
              </div>
            </div>

            <form onSubmit={handleCreateOfficerSubmit} className="mt-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/20 border border-red-400 text-red-200 rounded-xl text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Nama Lengkap */}
                <div>
                  <label className="block text-xs font-bold text-cyan-200 mb-1">
                    Nama Lengkap Petugas <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    placeholder="Contoh: Budi Santoso, S.Sos"
                    className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs font-medium text-white placeholder-slate-400 focus:bg-white/20 focus:ring-2 focus:ring-cyan-400 outline-none"
                    required
                  />
                </div>

                {/* 2. NIP / ID Petugas */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-cyan-200">
                      NIP / ID Petugas Resmi
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoNip}
                      className="text-[10px] text-cyan-300 hover:text-white font-bold underline cursor-pointer"
                    >
                      ⚡ Buat NIP Otomatis
                    </button>
                  </div>
                  <input
                    type="text"
                    value={officerNip}
                    onChange={(e) => setOfficerNip(e.target.value)}
                    placeholder="Contoh: NIP-PTG-2026-002"
                    className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs font-mono font-bold text-cyan-100 placeholder-slate-400 focus:bg-white/20 focus:ring-2 focus:ring-cyan-400 outline-none"
                  />
                </div>

                {/* 3. Pos Dermaga Penugasan */}
                <div>
                  <label className="block text-xs font-bold text-cyan-200 mb-1">
                    Pos Dermaga Penugasan <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={officerDockId}
                    onChange={(e) => setOfficerDockId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-white/20 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-cyan-400 outline-none"
                  >
                    {docks.map((dock) => (
                      <option key={dock.id} value={dock.id} className="bg-slate-900 text-white">
                        {dock.name} ({dock.province || 'Sultra'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Email Resmi Petugas */}
                <div>
                  <label className="block text-xs font-bold text-cyan-200 mb-1">
                    Email Resmi Petugas (Login) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={officerEmail}
                    onChange={(e) => setOfficerEmail(e.target.value)}
                    placeholder="budi.petugas@kapalku.id"
                    className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs font-medium text-white placeholder-slate-400 focus:bg-white/20 focus:ring-2 focus:ring-cyan-400 outline-none"
                    required
                  />
                </div>

                {/* 5. Nomor WhatsApp Petugas */}
                <div>
                  <label className="block text-xs font-bold text-cyan-200 mb-1">
                    Nomor WhatsApp / HP Petugas
                  </label>
                  <input
                    type="tel"
                    value={officerPhone}
                    onChange={(e) => setOfficerPhone(e.target.value)}
                    placeholder="0812-4211-3344"
                    className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs font-mono text-white placeholder-slate-400 focus:bg-white/20 focus:ring-2 focus:ring-cyan-400 outline-none"
                  />
                  <span className="text-[10px] text-cyan-200/70 mt-0.5 block">Untuk pengiriman kredensial login via WA</span>
                </div>

                {/* 6. Kata Sandi Petugas */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-cyan-200">
                      Kata Sandi Login Petugas <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[10px] text-cyan-300 hover:text-white font-bold underline cursor-pointer flex items-center space-x-1"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>🎲 Sandi Acak</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={officerPassword}
                      onChange={(e) => setOfficerPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs font-mono font-bold text-cyan-100 placeholder-slate-400 focus:bg-white/20 focus:ring-2 focus:ring-cyan-400 outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-cyan-300 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-cyan-200/80 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Akun petugas langsung terbit, aktif, dan dapat langsung login di Portal Petugas.</span>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setOfficerName('');
                      setOfficerNip('');
                      setOfficerEmail('');
                      setOfficerPhone('');
                      setOfficerPassword('Petugas123#');
                      setFormError('');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-white/20 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold transition-all cursor-pointer"
                  >
                    Kosongkan Form
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-500/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4 text-white" />
                    <span>{isSubmitting ? 'Menerbitkan Akun...' : '💾 Simpan & Terbitkan Akun Petugas'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-2xl flex items-start space-x-3 text-xs text-sky-950 shadow-2xs">
          <Lock className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-extrabold text-sky-950 text-xs sm:text-sm">
              Direktori Penumpang (Mode Hanya Lihat demi Privasi Pengguna)
            </span>
            <p className="text-[11px] text-sky-900 leading-relaxed">
              Akun penumpang didaftarkan secara mandiri oleh masyarakat via tab pendaftaran akun. Sesuai regulasi privasi konsumen, administrator pelabuhan hanya memiliki hak membaca data akun untuk verifikasi manifes dan kontak tiket.
            </p>
          </div>
        </div>
      )}

      {/* Table of Users */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Profil & Akun</th>
                <th className="py-3.5 px-4">Role / Pos Tugas</th>
                <th className="py-3.5 px-4">Kontak Resmi</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Aksi & Kredensial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span>Tidak ada data akun yang cocok dengan pencarian.</span>
                  </td>
                </tr>
              ) : (
                displayedUsers.map((user) => {
                  const isOfficer = user.role === 'officer';
                  const isCopied = copiedId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center space-x-3">
                          <img
                            src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center space-x-1.5">
                              <span>{user.name}</span>
                              {user.status === 'Nonaktif' && (
                                <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold">
                                  Nonaktif
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[10px] text-slate-500 flex items-center space-x-2">
                              {user.nip ? (
                                <span className="bg-cyan-50 border border-cyan-200 text-cyan-800 px-1.5 py-0.2 rounded font-bold">
                                  {user.nip}
                                </span>
                              ) : (
                                <span>ID: {user.id}</span>
                              )}
                              {user.createdAt && <span>• Terdaftar: {user.createdAt}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {user.role === 'admin' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            🛡️ Administrator
                          </span>
                        ) : user.role === 'officer' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-100 text-cyan-800 border border-cyan-200">
                              🔍 Petugas Scanner Gate
                            </span>
                            <div className="text-[11px] text-slate-600 font-medium truncate max-w-[180px]" title={user.dockName}>
                              Pos: {user.dockName || 'Kampung Baru'}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
                            👥 Penumpang Umum
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center space-x-1.5 text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[170px] font-mono text-[11px]">
                            {user.email || '-'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-slate-600 font-mono text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{user.phone || '-'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {user.status === 'Nonaktif' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1"></span>
                            Nonaktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                            Aktif
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {isOfficer ? (
                            <>
                              {/* Tombol Salin Kredensial Petugas */}
                              <button
                                type="button"
                                onClick={() => copyOfficerCredentials(user)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer border ${
                                  isCopied
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                    : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-200'
                                }`}
                                title="Salin Info Login Petugas untuk WhatsApp"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Disalin!</span>
                                  </>
                                ) : (
                                  <>
                                    <Share2 className="w-3.5 h-3.5 text-cyan-600" />
                                    <span>Salin Kredensial</span>
                                  </>
                                )}
                              </button>

                              {/* Tombol Edit / Reset Password */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditOfficer(user)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                                title="Ubah Pos Dermaga / Reset Kata Sandi"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Tombol Hapus */}
                              <button
                                type="button"
                                onClick={() => handleDeleteOfficer(user)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all cursor-pointer"
                                title="Hapus Akun Petugas"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedUser(user)}
                              className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl font-bold text-xs flex items-center space-x-1 transition-all cursor-pointer"
                              title="Lihat Detail Riwayat Pengguna"
                            >
                              <Eye className="w-3.5 h-3.5 text-sky-600" />
                              <span>Detail</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL TAMBAH AKUN PETUGAS ================= */}
      {isAddOfficerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            <div className="bg-[#0F2C59] p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-cyan-500 rounded-xl text-white">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">Tambah Akun Petugas Baru</h3>
                  <p className="text-[11px] text-cyan-200">Terbitkan akun petugas gate scanner pelabuhan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOfficerModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOfficerSubmit} className="p-5 sm:p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Petugas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="Contoh: Budi Santoso, S.Sos"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  required
                />
              </div>

              {/* NIP Petugas */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    NIP / Nomor Induk Petugas
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoNip}
                    className="text-[10px] text-cyan-600 hover:text-cyan-700 font-bold hover:underline cursor-pointer"
                  >
                    + Buat NIP Otomatis
                  </button>
                </div>
                <input
                  type="text"
                  value={officerNip}
                  onChange={(e) => setOfficerNip(e.target.value)}
                  placeholder="Contoh: NIP-PTG-2026-002"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              {/* Pos Dermaga Penugasan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pos Dermaga Penugasan <span className="text-red-500">*</span>
                </label>
                <select
                  value={officerDockId}
                  onChange={(e) => setOfficerDockId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                >
                  {docks.map((dock) => (
                    <option key={dock.id} value={dock.id}>
                      {dock.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email & No HP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Resmi Petugas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={officerEmail}
                    onChange={(e) => setOfficerEmail(e.target.value)}
                    placeholder="budi.petugas@kapalku.id"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    value={officerPhone}
                    onChange={(e) => setOfficerPhone(e.target.value)}
                    placeholder="0812-3456-7890"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  />
                </div>
              </div>

              {/* Kata Sandi Akun */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Kata Sandi Login Petugas <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[10px] text-cyan-600 hover:text-cyan-700 font-bold hover:underline cursor-pointer flex items-center space-x-1"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Buat Sandi Acak</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={officerPassword}
                    onChange={(e) => setOfficerPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Kata sandi ini yang akan digunakan oleh petugas untuk login di portal scanner.
                </span>
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddOfficerModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan & Terbitkan Akun</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KREDENSIAL BERHASIL DIBUAT ================= */}
      {createdOfficerCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150 space-y-4 p-6">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="font-black text-lg text-slate-900">Akun Petugas Berhasil Diterbitkan!</h3>
              <p className="text-xs text-slate-500">
                Kredensial login berikut siap diberikan kepada petugas bersangkutan:
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-200 pb-1.5 font-sans font-bold text-slate-800">
                <span>Nama:</span>
                <span className="text-cyan-800">{createdOfficerCreds.officer.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">NIP:</span>
                <span className="font-bold text-slate-900">{createdOfficerCreds.officer.nip}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Pos Tugas:</span>
                <span className="font-sans text-slate-800 font-semibold truncate max-w-[200px]">
                  {createdOfficerCreds.officer.dockName}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Email:</span>
                <span className="font-bold text-slate-900">{createdOfficerCreds.officer.email}</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-500">Kata Sandi:</span>
                <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {createdOfficerCreds.rawPassword}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => copyOfficerCredentials(createdOfficerCreds.officer, createdOfficerCreds.rawPassword)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Salin Lengkap untuk WhatsApp Petugas</span>
              </button>

              <button
                type="button"
                onClick={() => setCreatedOfficerCreds(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL EDIT / RESET KATA SANDI PETUGAS ================= */}
      {editingOfficer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            <div className="bg-[#0F2C59] p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <span className="font-extrabold text-sm sm:text-base">Pengaturan Akun Petugas</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingOfficer(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateOfficerSubmit} className="p-5 sm:p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="font-bold text-slate-900 text-sm">{editingOfficer.name}</div>
                <div className="text-xs text-slate-500 font-mono">NIP: {editingOfficer.nip || '-'} • {editingOfficer.email}</div>
              </div>

              {/* Pos Dermaga */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pos Dermaga Penugasan
                </label>
                <select
                  value={editDockId}
                  onChange={(e) => setEditDockId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                >
                  {docks.map((dock) => (
                    <option key={dock.id} value={dock.id}>
                      {dock.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Akun */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Keaktifan Petugas
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                >
                  <option value="Aktif">🟢 Aktif (Bisa Login & Scan)</option>
                  <option value="Nonaktif">🔴 Nonaktif (Login Diblokir)</option>
                </select>
              </div>

              {/* Reset Kata Sandi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reset Kata Sandi Baru (Opsional)
                </label>
                <input
                  type="text"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  placeholder="Kosongkan jika tidak ingin mengubah sandi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingOfficer(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-60"
                >
                  {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DETAIL AKUN PENUMPANG ================= */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            <div className="bg-[#0F2C59] p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-sky-400" />
                <span className="font-extrabold text-sm sm:text-base">Detail Akun Pengguna</span>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center space-x-2.5 text-xs text-amber-900">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-[11px] leading-tight">
                  <strong>Akses Terbatas:</strong> Akun penumpang hanya dapat diubah secara mandiri oleh pengguna. Anda melihat dalam mode <em>Read-Only</em>.
                </span>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <img
                  src={selectedUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedUser.name}`}
                  alt={selectedUser.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md shrink-0"
                />
                <div className="space-y-1">
                  <h3 className="font-black text-slate-900 text-base">{selectedUser.name}</h3>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800">
                    👥 Akun Penumpang Terdaftar
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">ID Pengguna: {selectedUser.id}</div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={selectedUser.name}
                    disabled
                    readOnly
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Email</label>
                    <input
                      type="text"
                      value={selectedUser.email || '-'}
                      disabled
                      readOnly
                      className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Nomor WhatsApp / HP</label>
                    <input
                      type="text"
                      value={selectedUser.phone || '-'}
                      disabled
                      readOnly
                      className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Riwayat Reservasi Tiket Pengguna */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center space-x-1.5">
                    <Ticket className="w-4 h-4 text-sky-600" />
                    <span>Riwayat Pemesanan Tiket ({getUserReservations(selectedUser).length})</span>
                  </span>
                </div>

                {getUserReservations(selectedUser).length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                    Pengguna ini belum pernah melakukan pemesanan tiket.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {getUserReservations(selectedUser).map((res) => (
                      <div
                        key={res.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-mono font-bold text-sky-700">{res.bookingCode}</div>
                          <div className="font-semibold text-slate-800">{res.vesselName}</div>
                          <div className="text-[11px] text-slate-500">
                            {res.originDockName} ➔ {res.destinationDockName} • {res.travelDate}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="font-bold text-slate-900 block">
                            Rp {res.totalPrice?.toLocaleString('id-ID')}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                              res.reservationStatus === 'Dibatalkan'
                                ? 'bg-red-100 text-red-800'
                                : res.paymentStatus === 'Lunas'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {res.reservationStatus === 'Dibatalkan'
                              ? 'Dibatalkan'
                              : res.paymentStatus === 'Lunas'
                              ? 'Lunas'
                              : 'Menunggu Bayar'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Admin hanya berwenang untuk memeriksa data manifes.
              </span>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
