import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Server,
  Download,
  Code,
  Layers,
  X,
  ShieldCheck,
  Table,
  UploadCloud,
  Trash2,
} from 'lucide-react';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  checkSupabaseHealth,
  seedDataToSupabase,
  clearAllSupabaseData,
  setCustomSupabaseCredentials,
  SupabaseHealthResult,
} from '../../lib/supabase';
import { api } from '../../lib/api';
import {
  INITIAL_USERS,
  INITIAL_VESSELS,
  INITIAL_DOCKS,
  INITIAL_ROUTES,
  INITIAL_SCHEDULES,
  INITIAL_RESERVATIONS,
  INITIAL_WEATHER,
  INITIAL_NOTIFICATIONS,
  INITIAL_SOS,
  INITIAL_AUDIT_LOGS,
} from '../../data/mockData';

interface SupabaseDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const SupabaseDatabaseModal: React.FC<SupabaseDatabaseModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'sql' | 'instructions'>('status');
  const [health, setHealth] = useState<SupabaseHealthResult | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [seedResults, setSeedResults] = useState<string[] | null>(null);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [sqlContent, setSqlContent] = useState<string>('');

  const [customUrl, setCustomUrl] = useState(SUPABASE_URL);
  const [customKey, setCustomKey] = useState(SUPABASE_ANON_KEY);
  const [isEditingCreds, setIsEditingCreds] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const projectId = customUrl.replace('https://', '').split('.')[0] || 'project';
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectId}/sql/new`;
  const dashboardUrl = `https://supabase.com/dashboard/project/${projectId}`;
  const tableEditorUrl = `https://supabase.com/dashboard/project/${projectId}/editor`;

  const handleSaveCredentials = async () => {
    if (!customUrl.trim() || !customKey.trim()) return;
    setCustomSupabaseCredentials(customUrl.trim(), customKey.trim());
    setSaveSuccessMsg('Kredensial disimpan! Menghubungkan ulang...');
    await fetchHealth();
    setTimeout(() => {
      setSaveSuccessMsg('');
      setIsEditingCreds(false);
    }, 2000);
  };

  const fetchHealth = async () => {
    setIsLoadingHealth(true);
    try {
      const res = await checkSupabaseHealth();
      setHealth(res);
    } catch (e) {
      console.error('Error fetching Supabase health:', e);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm('Hapus SEMUA data sample pada aplikasi dan database Supabase?')) return;
    setIsClearing(true);
    setSeedResults(null);
    try {
      await api.clearAllData();
      const res = await clearAllSupabaseData();
      setSeedResults(['Semua data aplikasi telah dibersihkan menjadi kosong.', ...res.messages]);
      await fetchHealth();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setSeedResults([`Error pembersihan data: ${err?.message || 'Terjadi kesalahan'}`]);
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
      // Load SQL schema text from root/supabase
      fetch('/supabase_schema.sql')
        .then((r) => r.text())
        .then((txt) => {
          if (txt && !txt.includes('<!DOCTYPE html>')) {
            setSqlContent(txt);
          } else {
            // Fallback SQL text if static fetch returns html
            setSqlContent(DEFAULT_SQL_SCHEMA);
          }
        })
        .catch(() => setSqlContent(DEFAULT_SQL_SCHEMA));
    }
  }, [isOpen]);

  const handleCopySQL = async () => {
    try {
      await navigator.clipboard.writeText(sqlContent || DEFAULT_SQL_SCHEMA);
      setCopiedSQL(true);
      setTimeout(() => setCopiedSQL(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_URL);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (e) {}
  };

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_ANON_KEY);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch (e) {}
  };

  const handleDownloadSQL = () => {
    const blob = new Blob([sqlContent || DEFAULT_SQL_SCHEMA], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supabase_schema_kapalku.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    setSeedResults(null);
    try {
      const res = await seedDataToSupabase({
        users: INITIAL_USERS,
        docks: INITIAL_DOCKS,
        routes: INITIAL_ROUTES,
        vessels: INITIAL_VESSELS,
        schedules: INITIAL_SCHEDULES,
        reservations: INITIAL_RESERVATIONS,
        weather: INITIAL_WEATHER,
        notifications: INITIAL_NOTIFICATIONS,
        sos: INITIAL_SOS,
        audit: INITIAL_AUDIT_LOGS,
      });
      setSeedResults(res.messages);
      await fetchHealth();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setSeedResults([`Error sinkronisasi: ${err?.message || 'Terjadi kesalahan'}`]);
    } finally {
      setIsSeeding(false);
    }
  };

  if (!isOpen) return null;

  const tableDefinitions = [
    { name: 'users', label: 'Pengguna & Akun', desc: 'Akun Admin, Petugas Gate, dan Penumpang' },
    { name: 'docks', label: 'Dermaga & Pelabuhan', desc: 'Daftar pelabuhan feri & speedboat nasional/lokal' },
    { name: 'routes', label: 'Rute & Tarif', desc: 'Jalur penyeberangan beserta tarif penumpang & kendaraan' },
    { name: 'vessels', label: 'Armada Kapal', desc: 'Data kapal, kapasitas, status, & koordinat GPS/AIS' },
    { name: 'schedules', label: 'Jadwal Keberangkatan', desc: 'Jadwal pelayaran harian dan kuota penumpang' },
    { name: 'reservations', label: 'Reservasi & Tiket', desc: 'E-tiket, manifes penumpang, check-in QR code' },
    { name: 'notifications', label: 'Notifikasi', desc: 'Pemberitahuan cuaca, boarding, dan sistem' },
    { name: 'weather', label: 'Prakiraan Cuaca BMKG', desc: 'Laporan gelombang, kecepatan angin, dan keselamatan' },
    { name: 'sos_reports', label: 'Panggilan Darurat Laut', desc: 'Laporan SOS penumpang dan titik koordinat kapal' },
    { name: 'audit_logs', label: 'Log Audit & Aktivitas', desc: 'Catatan aktivitas login, check-in, dan manajemen' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 px-5 sm:px-6 py-4 border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Konfigurasi Database Supabase
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PostgreSQL
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5 truncate max-w-md">
                {SUPABASE_URL}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-5 sm:px-6 pt-2">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center space-x-2 pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'status'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Status Tabel & Koneksi</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center space-x-2 pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'sql'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Skrip SQL Schema</span>
          </button>

          <button
            onClick={() => setActiveTab('instructions')}
            className={`flex items-center space-x-2 pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'instructions'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Panduan Setup Supabase</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-slate-200 text-sm">
          {/* TAB 1: STATUS */}
          {activeTab === 'status' && (
            <div className="space-y-5">
              {/* Connection Status Card */}
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-400"></div>
                    <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white">Status Koneksi Supabase:</span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        Terhubung (Active)
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Proyek ID: <strong className="text-slate-300 font-mono">{projectId}</strong>
                      {health?.lastChecked && ` • Terakhir dicek: ${health.lastChecked}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={fetchHealth}
                    disabled={isLoadingHealth}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-medium text-white transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHealth ? 'animate-spin' : ''}`} />
                    <span>Periksa Ulang</span>
                  </button>

                  <a
                    href={dashboardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Supabase</span>
                  </a>
                </div>
              </div>

              {/* Credentials card & Custom Config input */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Kredensial Proyek Supabase Aktif</span>
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Semua data rute, jadwal, kapal, tarif, dermaga & manifes yang diinput Admin otomatis terhubung ke proyek ini.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditingCreds(!isEditingCreds)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {isEditingCreds ? 'Tutup Pengaturan' : 'Ganti URL & Key Proyek'}
                  </button>
                </div>

                {isEditingCreds ? (
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Supabase Project URL (contoh: https://xyzcompany.supabase.co)
                      </label>
                      <input
                        type="text"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="https://xyz.supabase.co"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Supabase Anon Public API Key
                      </label>
                      <input
                        type="text"
                        value={customKey}
                        onChange={(e) => setCustomKey(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={handleSaveCredentials}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all cursor-pointer shadow"
                      >
                        Simpan & Sambungkan
                      </button>
                      {saveSuccessMsg && (
                        <span className="text-xs text-emerald-400 font-medium">
                          {saveSuccessMsg}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between">
                      <div className="truncate mr-2">
                        <span className="text-slate-500 block text-[10px] uppercase font-sans">Project URL</span>
                        <span className="text-emerald-400 truncate">{customUrl}</span>
                      </div>
                      <button
                        onClick={handleCopyUrl}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0 cursor-pointer"
                        title="Salin Project URL"
                      >
                        {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between">
                      <div className="truncate mr-2">
                        <span className="text-slate-500 block text-[10px] uppercase font-sans">Anon Public Key</span>
                        <span className="text-emerald-400 truncate">{customKey.slice(0, 30)}...</span>
                      </div>
                      <button
                        onClick={handleCopyKey}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0 cursor-pointer"
                        title="Salin Anon Key"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Table Status Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <Table className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Status 10 Tabel Database di Supabase</span>
                  </h4>
                  <span className="text-xs text-slate-400">
                    {health?.allTablesExist ? (
                      <span className="text-emerald-400 font-bold">Semua tabel aktif!</span>
                    ) : (
                      <span className="text-amber-400 font-medium">Beberapa tabel belum dibuat</span>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {tableDefinitions.map((tab) => {
                    const st = health?.tables[tab.name];
                    const exists = st?.exists;

                    return (
                      <div
                        key={tab.name}
                        className={`p-3 rounded-xl border transition-all flex items-start justify-between ${
                          exists
                            ? 'bg-slate-800/40 border-emerald-500/30'
                            : 'bg-slate-800/20 border-amber-500/30'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-white">
                              public.{tab.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-sans">
                              ({tab.label})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{tab.desc}</p>
                        </div>

                        <div className="shrink-0 ml-2 text-right">
                          {exists ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>{st.rowCount} baris</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-semibold">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              <span>Belum Dibuat</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Seed Data Action */}
              <div className="bg-gradient-to-r from-slate-800/80 to-slate-900 border border-slate-700/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <UploadCloud className="w-4 h-4 text-cyan-400" />
                    <span>Sinkronisasi & Push Data Awal ke Supabase</span>
                  </h5>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kirim data default (dermaga, rute, kapal, jadwal, akun) ke tabel Supabase yang telah dibuat.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={handleClearAllData}
                    disabled={isClearing}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-xs font-bold text-rose-300 hover:text-white transition-all shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                    title="Kosongkan seluruh data pada aplikasi dan tabel Supabase"
                  >
                    <Trash2 className={`w-3.5 h-3.5 ${isClearing ? 'animate-spin' : ''}`} />
                    <span>{isClearing ? 'Menghapus...' : 'Hapus Semua Data'}</span>
                  </button>

                  <button
                    onClick={handleSeedData}
                    disabled={isSeeding}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white transition-all shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                    <span>{isSeeding ? 'Menyinkronkan...' : 'Sinkronkan Data ke Supabase'}</span>
                  </button>
                </div>
              </div>

              {/* Seed results output */}
              {seedResults && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                  <div className="text-slate-400 font-bold mb-1">Hasil Sinkronisasi Data:</div>
                  {seedResults.map((msg, i) => (
                    <div
                      key={i}
                      className={msg.startsWith('Berhasil') ? 'text-emerald-400' : 'text-amber-400'}
                    >
                      • {msg}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SQL SCHEMA */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/70">
                <div className="text-xs text-slate-300">
                  Skrip ini akan membuat seluruh 10 tabel, Row Level Security (RLS) policies, dan initial seed data.
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={handleCopySQL}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    {copiedSQL ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-white" />
                        <span>Salin SQL (1-Click)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadSQL}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh .sql</span>
                  </button>

                  <a
                    href={sqlEditorUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka SQL Editor</span>
                  </a>
                </div>
              </div>

              {/* Code viewer */}
              <div className="relative">
                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-[380px] leading-relaxed select-all">
                  {sqlContent || DEFAULT_SQL_SCHEMA}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: INSTRUCTIONS */}
          {activeTab === 'instructions' && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>3 Langkah Mudah Mengaktifkan Database Supabase Anda</span>
                </h4>

                <ol className="space-y-3 text-xs text-slate-300 list-decimal list-inside pl-1">
                  <li className="leading-relaxed">
                    <strong className="text-white">Buka Supabase SQL Editor:</strong> Klik tautan berikut untuk langsung membuka editor SQL di project Anda:{' '}
                    <a
                      href={sqlEditorUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 underline font-mono inline-flex items-center space-x-1 ml-1"
                    >
                      <span>supabase.com/dashboard/project/{projectId}/sql/new</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>

                  <li className="leading-relaxed">
                    <strong className="text-white">Salin Skrip Schema:</strong> Masuk ke tab{' '}
                    <button
                      onClick={() => setActiveTab('sql')}
                      className="text-cyan-400 font-semibold underline cursor-pointer"
                    >
                      Skrip SQL Schema
                    </button>{' '}
                    lalu klik tombol <strong>"Salin SQL (1-Click)"</strong>.
                  </li>

                  <li className="leading-relaxed">
                    <strong className="text-white">Tempel (Paste) & Jalankan (Run):</strong> Tempel teks SQL di kotak editor Supabase, lalu tekan tombol hijau{' '}
                    <strong className="text-emerald-400">"Run"</strong> (atau tekan Cmd/Ctrl + Enter). Seluruh tabel dan kebijakan keamanan (RLS) akan aktif dalam waktu ~2 detik!
                  </li>
                </ol>
              </div>

              <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-4 text-xs text-emerald-200">
                <div className="font-bold text-white mb-1">Dukungan Multi-Fallback & Real-Time Sync:</div>
                Aplikasi ini dilengkapi arsitektur resilient dual-layer: jika database Supabase telah siap, seluruh operasi (pemesanan tiket, check-in QR scanner, pembaruan dermaga/rute/kapal) otomatis tersimpan permanen di cloud Supabase PostgreSQL Anda.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-5 sm:px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Supabase PostgreSQL • Cloud Host: Singapore / Southeast Asia</span>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={tableEditorUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Table className="w-3.5 h-3.5 text-cyan-400" />
              <span>Lihat Table Editor</span>
            </a>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all cursor-pointer"
            >
              Selesai / Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fallback schema string
const DEFAULT_SQL_SCHEMA = `-- Skema Database KapalKu - Supabase PostgreSQL
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'officer', 'passenger')),
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.docks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    lat NUMERIC(9,6) NOT NULL,
    lng NUMERIC(9,6) NOT NULL,
    status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Perbaikan', 'Non-Aktif')),
    province TEXT,
    city TEXT,
    region TEXT,
    dock_role TEXT DEFAULT 'both',
    facilities TEXT[],
    contact_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.routes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    origin_dock_id TEXT,
    origin_dock_name TEXT NOT NULL,
    destination_dock_id TEXT,
    destination_dock_name TEXT NOT NULL,
    distance_km NUMERIC(8,2) DEFAULT 0,
    distance_miles NUMERIC(8,2),
    estimated_duration_minutes INTEGER DEFAULT 60,
    tariff_passenger NUMERIC(12,2) DEFAULT 0,
    tariff_child NUMERIC(12,2) DEFAULT 0,
    tariff_motorbike NUMERIC(12,2) DEFAULT 0,
    tariff_car NUMERIC(12,2) DEFAULT 0,
    tariff_truck NUMERIC(12,2) DEFAULT 0,
    status TEXT DEFAULT 'Operasional',
    region TEXT,
    vessel_types_available TEXT[],
    description TEXT,
    frequency_text TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.vessels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    registration_number TEXT,
    type TEXT NOT NULL,
    capacity_passengers INTEGER DEFAULT 50,
    capacity_motorbikes INTEGER DEFAULT 0,
    capacity_cars INTEGER DEFAULT 0,
    capacity_trucks INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Bertambat',
    operator_id TEXT,
    operator_name TEXT,
    operator_phone TEXT,
    speed_kts NUMERIC(6,2) DEFAULT 0,
    heading_deg NUMERIC(6,2) DEFAULT 0,
    current_lat NUMERIC(9,6) NOT NULL,
    current_lng NUMERIC(9,6) NOT NULL,
    last_updated TEXT,
    current_route_id TEXT,
    operating_routes_description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.schedules (
    id TEXT PRIMARY KEY,
    vessel_id TEXT,
    vessel_name TEXT NOT NULL,
    vessel_type TEXT NOT NULL,
    route_id TEXT,
    origin_dock_name TEXT NOT NULL,
    destination_dock_name TEXT NOT NULL,
    date DATE NOT NULL,
    departure_time TEXT NOT NULL,
    estimated_arrival_time TEXT NOT NULL,
    tariff_passenger NUMERIC(12,2) DEFAULT 0,
    tariff_child NUMERIC(12,2) DEFAULT 0,
    tariff_motorbike NUMERIC(12,2) DEFAULT 0,
    tariff_car NUMERIC(12,2) DEFAULT 0,
    tariff_truck NUMERIC(12,2) DEFAULT 0,
    status TEXT DEFAULT 'scheduled',
    status_reason TEXT,
    booked_passengers INTEGER DEFAULT 0,
    max_passengers INTEGER DEFAULT 100,
    booked_motorbikes INTEGER DEFAULT 0,
    booked_cars INTEGER DEFAULT 0,
    booked_trucks INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reservations (
    id TEXT PRIMARY KEY,
    booking_code TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    user_email TEXT,
    schedule_id TEXT,
    vessel_name TEXT NOT NULL,
    vessel_type TEXT,
    origin_dock_name TEXT NOT NULL,
    destination_dock_name TEXT NOT NULL,
    travel_date TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    estimated_arrival_time TEXT,
    passengers_count INTEGER DEFAULT 1,
    motorbikes_count INTEGER DEFAULT 0,
    cars_count INTEGER DEFAULT 0,
    passengers_list JSONB,
    vehicle_plate TEXT,
    vehicle_type TEXT,
    base_price NUMERIC(12,2) DEFAULT 0,
    insurance_fee NUMERIC(12,2) DEFAULT 0,
    port_service_fee NUMERIC(12,2) DEFAULT 0,
    total_price NUMERIC(12,2) NOT NULL,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'Menunggu Pembayaran',
    reservation_status TEXT DEFAULT 'Terkonfirmasi',
    check_in_status TEXT DEFAULT 'Belum Check-In',
    check_in_time TEXT,
    scanned_by TEXT,
    scanned_at TEXT,
    gate_number TEXT,
    created_at TEXT NOT NULL,
    qr_code_url TEXT,
    cancellation_reason TEXT,
    cancelled_at TEXT,
    payment_details JSONB
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'all',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.weather (
    id TEXT PRIMARY KEY,
    route_name TEXT NOT NULL,
    origin_dock_name TEXT NOT NULL,
    destination_dock_name TEXT NOT NULL,
    condition TEXT NOT NULL,
    wave_height_meters NUMERIC(4,2) DEFAULT 0.5,
    wind_speed_kmh NUMERIC(6,2) DEFAULT 10,
    wind_direction TEXT DEFAULT 'Tenggara',
    status TEXT DEFAULT 'Aman',
    official_advice TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS public.sos_reports (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    vessel_name TEXT,
    lat NUMERIC(9,6) NOT NULL,
    lng NUMERIC(9,6) NOT NULL,
    time TEXT NOT NULL,
    emergency_type TEXT NOT NULL,
    description TEXT,
    booking_code TEXT,
    status TEXT DEFAULT 'Baru',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vessels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Access users" ON public.users;
    CREATE POLICY "Public Access users" ON public.users FOR ALL USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "Public Access docks" ON public.docks;
    CREATE POLICY "Public Access docks" ON public.docks FOR ALL USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "Public Access routes" ON public.routes;
    CREATE POLICY "Public Access routes" ON public.routes FOR ALL USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "Public Access vessels" ON public.vessels;
    CREATE POLICY "Public Access vessels" ON public.vessels FOR ALL USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "Public Access schedules" ON public.schedules;
    CREATE POLICY "Public Access schedules" ON public.schedules FOR ALL USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "Public Access reservations" ON public.reservations;
    CREATE POLICY "Public Access reservations" ON public.reservations FOR ALL USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "Public Access notifications" ON public.notifications;
    CREATE POLICY "Public Access notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "Public Access weather" ON public.weather;
    CREATE POLICY "Public Access weather" ON public.weather FOR ALL USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "Public Access sos_reports" ON public.sos_reports;
    CREATE POLICY "Public Access sos_reports" ON public.sos_reports FOR ALL USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "Public Access audit_logs" ON public.audit_logs;
    CREATE POLICY "Public Access audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
END $$;
`;
