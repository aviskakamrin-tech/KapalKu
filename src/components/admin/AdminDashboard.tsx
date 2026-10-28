import React, { useState } from 'react';
import { RouteItem, Schedule, Vessel, Dock, Reservation, User } from '../../types';
import { api } from '../../lib/api';
import { RoutePriceManager } from './RoutePriceManager';
import { ScheduleManager } from './ScheduleManager';
import { VesselDockManager } from './VesselDockManager';
import { DockMasterManager } from './DockMasterManager';
import { ManifestReport } from './ManifestReport';
import { RefundApprovalManager } from './RefundApprovalManager';
import { UserManager } from './UserManager';
import {
  Compass,
  Calendar,
  Ship,
  Anchor,
  FileSpreadsheet,
  TrendingUp,
  Ticket,
  Users,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Share2,
  Database,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';

interface AdminDashboardProps {
  routes: RouteItem[];
  schedules: Schedule[];
  vessels: Vessel[];
  docks: Dock[];
  reservations: Reservation[];
  users?: User[];
  currentUser: User | null;
  onRefreshData: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenRoleLinks?: () => void;
  onOpenSupabaseModal?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  routes,
  schedules,
  vessels,
  docks,
  reservations,
  users = [],
  currentUser,
  onRefreshData,
  onOpenRoleLinks,
  onOpenSupabaseModal,
}) => {
  const [adminTab, setAdminTab] = useState<'docks' | 'routes_pricing' | 'schedules' | 'vessels' | 'refunds' | 'reports' | 'users'>('docks');

  // Key KPI Calculations - Total pendapatan hanya ada setelah adanya pembayaran pengguna
  const paidReservations = reservations.filter(
    (r) => r.paymentStatus === 'Lunas' && r.reservationStatus !== 'Dibatalkan' && r.refundStatus !== 'Disetujui'
  );
  const hasUserPayments = paidReservations.length > 0;
  const totalRevenue = paidReservations.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
  const pendingRefundsCount = reservations.filter((r) => r.refundStatus === 'Diajukan').length;

  const totalPassengersBooked = reservations
    .filter((r) => r.reservationStatus !== 'Dibatalkan')
    .reduce((acc, curr) => acc + (curr.passengersCount || 1), 0);

  const totalBoarded = reservations
    .filter((r) => r.checkInStatus === 'Sudah Check-In (Boarded)')
    .reduce((acc, curr) => acc + (curr.passengersCount || 1), 0);

  const activeRoutesCount = routes.filter((r) => r.status === 'Operasional').length;
  const activeSchedulesCount = schedules.filter((s) => s.status !== 'cancelled' && s.status !== 'completed').length;

  const [isReloadingKampungBaru, setIsReloadingKampungBaru] = useState(false);
  const [reloadNotice, setReloadNotice] = useState<string | null>(null);

  const handleReloadKampungBaruData = async () => {
    setIsReloadingKampungBaru(true);
    try {
      const res = await api.loadOfficialKampungBaruData();
      setReloadNotice(res.message);
      onRefreshData();
      setTimeout(() => setReloadNotice(null), 5000);
    } catch (e: any) {
      setReloadNotice('Gagal memuat data resmi: ' + (e?.message || 'Error'));
    } finally {
      setIsReloadingKampungBaru(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0F2C59] via-[#1E3E62] to-[#0A2647] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/30 border border-indigo-400/40 rounded-full text-indigo-200 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span>PORTAL ADMINISTRATOR UTAMA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Manajemen Dermaga, Rute, Tarif & Jadwal
            </h1>
            <p className="text-xs sm:text-sm text-sky-200/90 mt-1 max-w-2xl">
              Daftarkan dermaga asal & tujuan, kelola harga tiket feri/speedboat, tetapkan alur jalur pelayaran baru, atur jadwal keberangkatan armada, dan pantau rekapitulasi manifes penumpang secara terpadu.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            {onOpenSupabaseModal && (
              <button
                type="button"
                onClick={onOpenSupabaseModal}
                className="px-3 py-2 bg-emerald-500/30 hover:bg-emerald-500/50 border border-emerald-400/40 text-emerald-100 hover:text-white rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer shadow-sm"
                title="Status & Konfigurasi Database Supabase PostgreSQL"
              >
                <Database className="w-4 h-4 text-emerald-300" />
                <span>Database Supabase</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </button>
            )}

            {onOpenRoleLinks && (
              <button
                type="button"
                onClick={onOpenRoleLinks}
                className="px-3 py-2 bg-indigo-500/30 hover:bg-indigo-500/50 border border-indigo-400/40 text-indigo-100 hover:text-white rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer shadow-sm"
                title="Lihat Link Akses Role Terpisah"
              >
                <Share2 className="w-4 h-4 text-indigo-300" />
                <span>Link Akses 3 Role</span>
              </button>
            )}

            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3.5 rounded-2xl flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-base shadow-md">
                ADM
              </div>
              <div>
                <div className="text-xs font-bold text-white">{currentUser?.name || 'Administrator'}</div>
                <div className="text-[10px] text-indigo-200 font-mono">Hak Akses: Penuh (Dermaga, Tarif & Rute)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Data Showcase Banner: Pelabuhan Ferry Kampung Baru */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 rounded-3xl p-5 sm:p-6 border border-sky-800/60 shadow-xl text-white space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-sky-900/60 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-500/20 border border-sky-400/30 rounded-2xl text-sky-400">
              <Anchor className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full">
                  DATA RESMI AKTIF
                </span>
                <span className="text-xs text-slate-300">Kabupaten Bombana, Sulawesi Tenggara</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Pelabuhan Ferry Kampung Baru (Kasipute) & Armada Feri
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleReloadKampungBaruData}
              disabled={isReloadingKampungBaru}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer shadow-sm"
              title="Segarkan / Muat Ulang Data Resmi Kampung Baru"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReloadingKampungBaru ? 'animate-spin' : ''}`} />
              <span>{isReloadingKampungBaru ? 'Memuat...' : 'Segarkan Data Resmi'}</span>
            </button>
          </div>
        </div>

        {reloadNotice && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{reloadNotice}</span>
            </div>
            <button onClick={() => setReloadNotice(null)} className="text-emerald-300 hover:text-white">✕</button>
          </div>
        )}

        {/* 3 Columns: Kapal Ferry, Jalur & Waktu, Tarif Tiket */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          {/* Kolom 1: Kapal Ferry */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center space-x-2 text-sky-300 font-bold text-xs">
              <Ship className="w-4 h-4" />
              <span>1. Kapal Ferry yang Beroperasi</span>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">KMP Oputa Yi Ko</span>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-mono">265 Orang</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Jalur: Kasipute – Pising (3x seminggu) & Kasipute – Tondasi (2x seminggu)
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">KMP Bontoharu</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono">350 Orang</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Jalur: Kasipute – Sikeli (Kabaena Barat)
                </div>
              </div>
            </div>
          </div>

          {/* Kolom 2: Jalur, Jarak & Estimasi Waktu */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center space-x-2 text-emerald-300 font-bold text-xs">
              <Compass className="w-4 h-4" />
              <span>2. Jalur, Jarak & Waktu Tempuh</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-0.5">
                <div className="font-bold text-white">Kasipute – Pising</div>
                <div className="text-slate-300">Jarak: <span className="text-emerald-400 font-semibold">32 Mil</span> • Waktu: <span className="text-emerald-400 font-semibold">3 Jam</span> • <span className="text-slate-400 font-medium">3x / minggu</span></div>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-0.5">
                <div className="font-bold text-white">Kasipute – Tondasi</div>
                <div className="text-slate-300">Jarak: <span className="text-emerald-400 font-semibold">20 Mil</span> • Waktu: <span className="text-emerald-400 font-semibold">2 Jam</span> • <span className="text-slate-400 font-medium">2x / minggu</span></div>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-0.5">
                <div className="font-bold text-white">Kasipute – Sikeli</div>
                <div className="text-slate-300">Jarak: <span className="text-emerald-400 font-semibold">60 Mil</span> • Waktu: <span className="text-emerald-400 font-semibold">6 Jam</span></div>
              </div>
            </div>
          </div>

          {/* Kolom 3: Rangkuman Tarif Tiket */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs">
              <DollarSign className="w-4 h-4" />
              <span>3. Tarif Tiket Resmi</span>
            </div>
            <div className="space-y-1.5 text-[10px]">
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60">
                <div className="font-bold text-amber-200">Kasipute – Pising:</div>
                <div className="text-slate-300 font-mono">
                  Dewasa: Rp 45.000 | Anak: Rp 7.000<br />
                  Motor: Rp 92.000 | Mobil: Rp 941.000 | Truk: Rp 1.507.000
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60">
                <div className="font-bold text-amber-200">Kasipute – Tondasi:</div>
                <div className="text-slate-300 font-mono">
                  Dewasa: Rp 31.000 | Anak: Rp 4.000<br />
                  Motor: Rp 82.000 | Mobil: Rp 487.000 | Truk: Rp 765.000
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60">
                <div className="font-bold text-amber-200">Kasipute – Sikeli:</div>
                <div className="text-slate-300 font-mono">
                  Dewasa: Rp 69.000 | Anak: Rp 46.000<br />
                  Motor: Rp 149.000 | Mobil: Rp 1.048.000 | Truk: Rp 2.017.000
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className={`grid gap-3 sm:gap-4 ${hasUserPayments ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Dermaga Terdaftar</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Anchor className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900">
            {docks.length} <span className="text-xs font-normal text-slate-500">Dermaga</span>
          </div>
          <div className="text-[11px] text-sky-600 font-medium flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Titik asal & tujuan tersedia</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Jalur Pelayaran Aktif</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900">
            {activeRoutesCount} / {routes.length} <span className="text-xs font-normal text-slate-500">Rute</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tarif & jarak terkonfigurasi</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Jadwal Kapal Beroperasi</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900">
            {activeSchedulesCount} <span className="text-xs font-normal text-slate-500">Jadwal</span>
          </div>
          <div className="text-[11px] text-indigo-600 font-medium flex items-center space-x-1">
            <Ship className="w-3.5 h-3.5" />
            <span>{vessels.length} armada terdaftar</span>
          </div>
        </div>

        {/* Total Pendapatan Tiket - Hanya muncul setelah adanya transaksi pembayaran lunas dari pengguna */}
        {hasUserPayments && (
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Total Pendapatan Tiket</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-900">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-amber-700 font-medium flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{paidReservations.length} transaksi pembayaran lunas</span>
            </div>
          </div>
        )}
      </div>

      {/* Admin Module Navigation Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-1.5">
        <button
          onClick={() => setAdminTab('docks')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            adminTab === 'docks'
              ? 'bg-[#0F2C59] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Anchor className="w-4 h-4 text-sky-400" />
          <span>Dermaga Asal & Tujuan</span>
          <span className="ml-1 px-1.5 py-0.2 bg-sky-500/30 text-sky-200 text-[10px] rounded-full">
            {docks.length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('routes_pricing')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            adminTab === 'routes_pricing'
              ? 'bg-[#0F2C59] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4 text-emerald-400" />
          <span>Atur Rute & Tarif Tiket</span>
        </button>

        <button
          onClick={() => setAdminTab('schedules')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            adminTab === 'schedules'
              ? 'bg-[#0F2C59] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span>Atur Jadwal Keberangkatan</span>
        </button>

        <button
          onClick={() => setAdminTab('vessels')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            adminTab === 'vessels'
              ? 'bg-[#0F2C59] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Ship className="w-4 h-4 text-sky-400" />
          <span>Armada Kapal</span>
        </button>

        {/* Tab Persetujuan Refund & Pembatalan */}
        <button
          onClick={() => setAdminTab('refunds')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            adminTab === 'refunds'
              ? 'bg-[#0F2C59] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>Persetujuan Refund & Pembatalan</span>
          {pendingRefundsCount > 0 ? (
            <span className="ml-1 px-2 py-0.5 bg-amber-500 text-white text-[10px] rounded-full font-bold animate-pulse">
              {pendingRefundsCount} Menunggu
            </span>
          ) : (
            <span className="ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-700 text-[10px] rounded-full font-mono">
              {reservations.filter((r) => r.refundStatus).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('reports')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            adminTab === 'reports'
              ? 'bg-[#0F2C59] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-amber-400" />
          <span>Laporan Manifes & Keuangan</span>
        </button>

        <button
          onClick={() => setAdminTab('users')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            adminTab === 'users'
              ? 'bg-[#0F2C59] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Data Akun Pengguna (Hanya Lihat / Read-Only)"
        >
          <Users className="w-4 h-4 text-sky-400" />
          <span>Akun Pengguna</span>
          <span className="ml-1 px-1.5 py-0.2 bg-sky-500/30 text-sky-200 text-[10px] rounded-full font-mono">
            {users.length}
          </span>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded font-bold">
            Hanya Lihat
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      {adminTab === 'docks' && (
        <DockMasterManager
          docks={docks}
          onRefreshData={onRefreshData}
        />
      )}

      {adminTab === 'routes_pricing' && (
        <RoutePriceManager
          routes={routes}
          docks={docks}
          onRefreshData={onRefreshData}
        />
      )}

      {adminTab === 'schedules' && (
        <ScheduleManager
          schedules={schedules}
          routes={routes}
          vessels={vessels}
          docks={docks}
          onRefreshData={onRefreshData}
        />
      )}

      {adminTab === 'vessels' && (
        <VesselDockManager
          vessels={vessels}
          docks={docks}
          onRefreshData={onRefreshData}
        />
      )}

      {adminTab === 'refunds' && (
        <RefundApprovalManager
          reservations={reservations}
          currentUser={currentUser}
          onRefreshData={onRefreshData}
        />
      )}

      {adminTab === 'reports' && (
        <ManifestReport
          reservations={reservations}
          routes={routes}
          schedules={schedules}
          onRefreshData={onRefreshData}
        />
      )}

      {adminTab === 'users' && (
        <UserManager
          users={users}
          reservations={reservations}
          onRefreshData={onRefreshData}
        />
      )}
    </div>
  );
};

