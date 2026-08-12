import React, { useState } from 'react';
import { Schedule, Dock, VesselType } from '../../types';
import { Calendar, Filter, Clock, Users, ArrowRight, ShieldCheck, AlertTriangle, Search, CheckCircle2 } from 'lucide-react';

interface ScheduleListProps {
  schedules: Schedule[];
  docks: Dock[];
  onSelectBooking: (schedule: Schedule) => void;
}

export const ScheduleList: React.FC<ScheduleListProps> = ({ schedules, docks, onSelectBooking }) => {
  const [selectedOrigin, setSelectedOrigin] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('all'); // 'today', 'tomorrow', 'all'
  const [vesselTypeFilter, setVesselTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'time' | 'price'>('time');

  const filteredSchedules = schedules
    .filter((sch) => {
      if (selectedOrigin && !sch.originDockName.toLowerCase().includes(selectedOrigin.toLowerCase())) return false;
      if (selectedDestination && !sch.destinationDockName.toLowerCase().includes(selectedDestination.toLowerCase())) return false;
      if (vesselTypeFilter !== 'all' && sch.vesselType !== vesselTypeFilter) return false;
      
      if (dateFilter === 'today') {
        return sch.date === '2026-08-11';
      } else if (dateFilter === 'tomorrow') {
        return sch.date === '2026-08-12';
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price') return a.tariffPassenger - b.tariffPassenger;
      return a.departureTime.localeCompare(b.departureTime);
    });

  return (
    <div className="space-y-6 pb-12">
      {/* Search Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              <span>Jadwal Pelayaran & Tarif Kapal</span>
            </h2>
            <p className="text-xs text-slate-500">
              Temukan jadwal kapal klotok, speedboat, feri, dan perintis lokal.
            </p>
          </div>

          {/* Quick Date Filters */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dateFilter === 'today' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hari Ini (11 Agt)
            </button>

            <button
              onClick={() => setDateFilter('tomorrow')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dateFilter === 'tomorrow' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Besok (12 Agt)
            </button>

            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dateFilter === 'all' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Dermaga Asal</label>
            <input
              type="text"
              placeholder="Cari Asal (mis: Balikpapan)..."
              value={selectedOrigin}
              onChange={(e) => setSelectedOrigin(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Dermaga Tujuan</label>
            <input
              type="text"
              placeholder="Cari Tujuan (mis: Penajam)..."
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Jenis Kapal</label>
            <select
              value={vesselTypeFilter}
              onChange={(e) => setVesselTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="all">Semua Jenis Kapal</option>
              <option value="Klotok">Klotok</option>
              <option value="Speedboat">Speedboat</option>
              <option value="Feri">Feri Tradisional / Ro-Ro</option>
              <option value="Kapal Perintis">Kapal Perintis</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Urutkan Berdasarkan</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'time' | 'price')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="time">Jam Keberangkatan</option>
              <option value="price">Harga Termurah</option>
            </select>
          </div>
        </div>
      </div>

      {/* Schedule Table / Cards */}
      <div className="space-y-4">
        {filteredSchedules.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <Search className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Jadwal Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tidak ada jadwal kapal yang sesuai dengan filter pencarian Anda. Coba ubah dermaga asal/tujuan atau tanggal.
            </p>
          </div>
        ) : (
          filteredSchedules.map((sch) => {
            const seatsRemaining = sch.maxPassengers - sch.bookedPassengers;
            const isFull = seatsRemaining <= 0;
            const percentage = Math.min(100, Math.round((sch.bookedPassengers / sch.maxPassengers) * 100));

            return (
              <div
                key={sch.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden p-5 space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  {/* Vessel info */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-extrabold uppercase bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md">
                        {sch.vesselType}
                      </span>
                      <span className="text-xs font-mono text-slate-400">Tanggal: {sch.date}</span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-lg">{sch.vesselName}</h3>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span
                      className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        sch.status === 'on_time' || sch.status === 'scheduled'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sch.status === 'delayed'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <span>
                        {sch.status === 'on_time' || sch.status === 'scheduled'
                          ? '🟢 Tepat Waktu'
                          : sch.status === 'delayed'
                          ? '🟡 Delay'
                          : '🔴 Batal'}
                      </span>
                    </span>
                    {sch.statusReason && (
                      <p className="text-[11px] text-slate-500 italic mt-1 max-w-xs">{sch.statusReason}</p>
                    )}
                  </div>
                </div>

                {/* Sailing Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  {/* Departure & Arrival */}
                  <div className="md:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Keberangkatan</div>
                        <div className="font-extrabold text-slate-900 text-base">{sch.departureTime} WITA</div>
                        <div className="text-slate-600 font-medium text-xs mt-0.5">{sch.originDockName}</div>
                      </div>

                      <div className="flex flex-col items-center px-4">
                        <span className="text-[10px] font-semibold text-sky-600">Pelayaran</span>
                        <ArrowRight className="w-5 h-5 text-sky-500" />
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Estimasi Tiba</div>
                        <div className="font-extrabold text-slate-900 text-base">{sch.estimatedArrivalTime} WITA</div>
                        <div className="text-slate-600 font-medium text-xs mt-0.5">{sch.destinationDockName}</div>
                      </div>
                    </div>
                  </div>

                  {/* Quota Gauge */}
                  <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Kuota Kursi</span>
                      <span className={isFull ? 'text-red-600' : 'text-slate-900'}>
                        {sch.bookedPassengers} / {sch.maxPassengers}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          percentage >= 90 ? 'bg-red-500' : percentage >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 pt-1">
                      {isFull ? (
                        <span className="text-red-600 font-bold">Kapal penuh. Silakan pilih jadwal berikutnya.</span>
                      ) : (
                        <span>Tersedia {seatsRemaining} kursi penumpang</span>
                      )}
                    </div>
                  </div>

                  {/* Pricing & Booking Button */}
                  <div className="flex flex-col justify-center items-end space-y-2">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-bold">Tarif Penumpang</span>
                      <span className="text-xl font-extrabold text-slate-900">
                        Rp {sch.tariffPassenger.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <button
                      disabled={isFull || sch.status === 'cancelled'}
                      onClick={() => onSelectBooking(sch)}
                      className={`w-full md:w-auto px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-sm ${
                        isFull || sch.status === 'cancelled'
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-sky-600 hover:bg-sky-700 text-white active:scale-95 shadow-sky-600/30'
                      }`}
                    >
                      {sch.status === 'cancelled' ? 'Dibatalkan' : isFull ? 'Kapal Penuh' : 'Pesan Tiket'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
