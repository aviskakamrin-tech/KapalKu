import React, { useState, useEffect } from 'react';
import { Schedule, Dock } from '../../types';
import {
  Calendar,
  Filter,
  Clock,
  Users,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Search,
  CheckCircle2,
  X,
  MapPin,
  Ship,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface ScheduleListProps {
  schedules: Schedule[];
  docks: Dock[];
  searchParams?: {
    originDockId?: string;
    destinationDockId?: string;
    travelDate?: string;
    searchTimestamp?: number;
  };
  onClearSearchParams?: () => void;
  onSelectBooking: (schedule: Schedule) => void;
}

export const ScheduleList: React.FC<ScheduleListProps> = ({
  schedules,
  docks,
  searchParams,
  onClearSearchParams,
  onSelectBooking,
}) => {
  const [selectedOrigin, setSelectedOrigin] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [vesselTypeFilter, setVesselTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'time' | 'price'>('time');
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);

  // Sync from searchParams when user searched on Home screen
  useEffect(() => {
    if (searchParams && (searchParams.originDockId || searchParams.destinationDockId || searchParams.travelDate)) {
      const originDock = docks.find((d) => d.id === searchParams.originDockId);
      const destDock = docks.find((d) => d.id === searchParams.destinationDockId);

      setSelectedOrigin(originDock ? originDock.name : searchParams.originDockId || '');
      setSelectedDestination(destDock ? destDock.name : searchParams.destinationDockId || '');
      if (searchParams.travelDate) {
        setSelectedDate(searchParams.travelDate);
      }
      setIsSearchActive(true);
    }
  }, [searchParams, docks]);

  // Extract clean search keywords
  const cleanKeyword = (str: string) => {
    return str
      .toLowerCase()
      .replace(/pelabuhan|dermaga|terminal|\(|\)|,/gi, '')
      .trim();
  };

  const originKeyword = cleanKeyword(selectedOrigin);
  const destKeyword = cleanKeyword(selectedDestination);

  // Filter schedules
  const filteredSchedules = schedules
    .filter((sch) => {
      // Origin filter
      if (originKeyword) {
        const schOrigin = cleanKeyword(sch.originDockName);
        if (!schOrigin.includes(originKeyword) && !originKeyword.includes(schOrigin)) {
          // Check if dock matches dock ID in mock
          const matchDock = docks.find((d) => d.name === sch.originDockName);
          if (!matchDock || !matchDock.id.toLowerCase().includes(originKeyword)) {
            return false;
          }
        }
      }

      // Destination filter
      if (destKeyword) {
        const schDest = cleanKeyword(sch.destinationDockName);
        if (!schDest.includes(destKeyword) && !destKeyword.includes(schDest)) {
          const matchDock = docks.find((d) => d.name === sch.destinationDockName);
          if (!matchDock || !matchDock.id.toLowerCase().includes(destKeyword)) {
            return false;
          }
        }
      }

      // Vessel Type filter
      if (vesselTypeFilter !== 'all' && sch.vesselType !== vesselTypeFilter) return false;

      // Date filter (only if explicitly set and not empty)
      if (selectedDate && sch.date) {
        // If user searched a date, try matching; if exact match fails on date, we will still show route schedules if route matches
        if (selectedDate !== sch.date) {
          // If both origin and destination matched specifically, don't completely hide if it's the only available schedule
          if (!originKeyword && !destKeyword) {
            return false;
          }
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price') return a.tariffPassenger - b.tariffPassenger;
      return a.departureTime.localeCompare(b.departureTime);
    });

  const handleResetFilters = () => {
    setSelectedOrigin('');
    setSelectedDestination('');
    setSelectedDate('');
    setVesselTypeFilter('all');
    setIsSearchActive(false);
    if (onClearSearchParams) {
      onClearSearchParams();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Search Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              <span>Jadwal Pelayaran & Tarif Kapal Nusantara</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Jadwal resmi kapal feri ASDP, speedboat perintis, kapal PELNI, dan klotok antar-dermaga.
            </p>
          </div>

          {/* Quick Clear Filter */}
          {(selectedOrigin || selectedDestination || selectedDate || vesselTypeFilter !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tampilkan Semua Jadwal</span>
            </button>
          )}
        </div>

        {/* Active Search Result Alert Banner */}
        {isSearchActive && (selectedOrigin || selectedDestination) && (
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 border-2 border-sky-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-sky-600 text-white rounded-xl flex items-center justify-center font-bold shadow-md shadow-sky-600/20">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase text-sky-800 tracking-wider">
                  Hasil Pencarian Jadwal Kapal
                </div>
                <div className="font-black text-slate-900 text-sm sm:text-base flex items-center space-x-1.5 mt-0.5">
                  <span>{selectedOrigin || 'Semua Dermaga Asal'}</span>
                  <ArrowRight className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>{selectedDestination || 'Semua Dermaga Tujuan'}</span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  {selectedDate ? `Tanggal: ${selectedDate} • ` : ''}
                  Ditemukan <strong>{filteredSchedules.length} jadwal keberangkatan kapal</strong>
                </div>
              </div>
            </div>

            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 bg-white hover:bg-sky-50 text-sky-800 text-xs font-bold rounded-xl border border-sky-200 shadow-sm cursor-pointer"
            >
              Ubah Pencarian
            </button>
          </div>
        )}

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-sky-600" />
              <span>Dermaga Asal</span>
            </label>
            <select
              value={selectedOrigin}
              onChange={(e) => {
                setSelectedOrigin(e.target.value);
                setIsSearchActive(true);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="">Semua Dermaga Asal</option>
              {docks.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name} ({d.region || d.province})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-emerald-600" />
              <span>Dermaga Tujuan</span>
            </label>
            <select
              value={selectedDestination}
              onChange={(e) => {
                setSelectedDestination(e.target.value);
                setIsSearchActive(true);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="">Semua Dermaga Tujuan</option>
              {docks.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name} ({d.region || d.province})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center space-x-1">
              <Ship className="w-3 h-3 text-sky-600" />
              <span>Jenis Kapal</span>
            </label>
            <select
              value={vesselTypeFilter}
              onChange={(e) => setVesselTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="all">Semua Jenis Kapal</option>
              <option value="Feri">Feri Tradisional / Ro-Ro ASDP</option>
              <option value="Speedboat">Speedboat Cepat</option>
              <option value="Kapal Perintis">Kapal Perintis PELNI</option>
              <option value="Klotok">Klotok Tradisional</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Urutkan Berdasarkan</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'time' | 'price')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="time">Jam Keberangkatan Terawal</option>
              <option value="price">Tarif Termurah</option>
            </select>
          </div>
        </div>
      </div>

      {/* Schedule Table / Cards */}
      <div className="space-y-4">
        {filteredSchedules.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <Search className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Tidak Ditemukan Jadwal Langsung untuk Rute Tersebut
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Silakan coba ubah filter dermaga asal atau tujuan, atau tekan tombol reset di bawah untuk melihat seluruh jadwal kapal yang sedang beroperasi.
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="py-2.5 px-5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Lihat Seluruh Jadwal Kapal Nusantara
            </button>
          </div>
        ) : (
          filteredSchedules.map((sch) => {
            const seatsRemaining = sch.maxPassengers - sch.bookedPassengers;
            const isFull = seatsRemaining <= 0;
            const percentage = Math.min(100, Math.round((sch.bookedPassengers / sch.maxPassengers) * 100));

            return (
              <div
                key={sch.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  {/* Vessel info */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-extrabold uppercase bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-lg">
                        {sch.vesselType}
                      </span>
                      <span className="text-xs font-mono text-slate-500 font-semibold">
                        🗓️ {sch.date}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl flex items-center space-x-2">
                      <Ship className="w-5 h-5 text-sky-600" />
                      <span>{sch.vesselName}</span>
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span
                      className={`inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-xs font-bold ${
                        sch.status === 'on_time' || sch.status === 'scheduled'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sch.status === 'delayed'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <span>
                        {sch.status === 'on_time' || sch.status === 'scheduled'
                          ? '🟢 Tepat Waktu (On Schedule)'
                          : sch.status === 'delayed'
                          ? '🟡 Mengalami Delay'
                          : '🔴 Pelayaran Batal'}
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
                  <div className="md:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Keberangkatan</div>
                        <div className="font-black text-slate-900 text-lg">{sch.departureTime} WITA</div>
                        <div className="text-slate-700 font-bold text-xs mt-0.5 max-w-[140px] truncate">
                          {sch.originDockName}
                        </div>
                      </div>

                      <div className="flex flex-col items-center px-4">
                        <span className="text-[10px] font-bold text-sky-600">Jalur Laut</span>
                        <ArrowRight className="w-5 h-5 text-sky-500 my-0.5" />
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Estimasi Tiba</div>
                        <div className="font-black text-slate-900 text-lg">{sch.estimatedArrivalTime} WITA</div>
                        <div className="text-slate-700 font-bold text-xs mt-0.5 max-w-[140px] truncate">
                          {sch.destinationDockName}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quota Gauge */}
                  <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Sisa Kuota Kursi</span>
                      <span className={isFull ? 'text-red-600 font-black' : 'text-slate-900'}>
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
                    <div className="text-[10px] text-slate-500 pt-0.5">
                      {isFull ? (
                        <span className="text-red-600 font-bold">Kapal penuh. Silakan pilih jadwal lain.</span>
                      ) : (
                        <span>Tersedia <strong>{seatsRemaining} kursi</strong> penumpang</span>
                      )}
                    </div>
                  </div>

                  {/* Pricing & Booking Button */}
                  <div className="flex flex-col justify-center items-start md:items-end space-y-2">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Tarif Penumpang</span>
                      <span className="text-xl font-black text-sky-800">
                        Rp {sch.tariffPassenger.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <button
                      disabled={isFull || sch.status === 'cancelled'}
                      onClick={() => onSelectBooking(sch)}
                      className={`w-full md:w-auto px-6 py-2.5 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer ${
                        isFull || sch.status === 'cancelled'
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-sky-600 hover:bg-sky-700 text-white active:scale-95 shadow-sky-600/30'
                      }`}
                    >
                      {sch.status === 'cancelled' ? 'Dibatalkan' : isFull ? 'Kapal Penuh' : 'Pesan Tiket Ini'}
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
