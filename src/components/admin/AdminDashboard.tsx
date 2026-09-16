import React, { useState } from 'react';
import { RouteItem, Schedule, Vessel, Dock, Reservation, User } from '../../types';
import { RoutePriceManager } from './RoutePriceManager';
import { ScheduleManager } from './ScheduleManager';
import { VesselDockManager } from './VesselDockManager';
import { DockMasterManager } from './DockMasterManager';
import { ManifestReport } from './ManifestReport';
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
} from 'lucide-react';

interface AdminDashboardProps {
  routes: RouteItem[];
  schedules: Schedule[];
  vessels: Vessel[];
  docks: Dock[];
  reservations: Reservation[];
  currentUser: User | null;
  onRefreshData: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  routes,
  schedules,
  vessels,
  docks,
  reservations,
  currentUser,
  onRefreshData,
}) => {
  const [adminTab, setAdminTab] = useState<'docks' | 'routes_pricing' | 'schedules' | 'vessels' | 'reports'>('docks');

  // Key KPI Calculations
  const totalRevenue = reservations
    .filter((r) => r.paymentStatus === 'Lunas' && r.reservationStatus !== 'Dibatalkan')
    .reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

  const totalPassengersBooked = reservations
    .filter((r) => r.reservationStatus !== 'Dibatalkan')
    .reduce((acc, curr) => acc + (curr.passengersCount || 1), 0);

  const totalBoarded = reservations
    .filter((r) => r.checkInStatus === 'Sudah Check-In (Boarded)')
    .reduce((acc, curr) => acc + (curr.passengersCount || 1), 0);

  const activeRoutesCount = routes.filter((r) => r.status === 'Operasional').length;
  const activeSchedulesCount = schedules.filter((s) => s.status !== 'cancelled' && s.status !== 'completed').length;

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

          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3.5 rounded-2xl flex items-center space-x-3 shrink-0">
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

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
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
            <span>{totalBoarded} tiket tervalidasi</span>
          </div>
        </div>
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

      {adminTab === 'reports' && (
        <ManifestReport
          reservations={reservations}
          routes={routes}
          schedules={schedules}
          onRefreshData={onRefreshData}
        />
      )}
    </div>
  );
};

