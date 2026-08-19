import React, { useState } from 'react';
import { Search, MapPin, Calendar, Compass, Map, Ticket, CloudSun, ShieldAlert, Clock, ArrowRight, Anchor, Users, Navigation, UserCheck } from 'lucide-react';
import { Dock, Schedule, WeatherReport, Reservation, User } from '../../types';

interface PassengerHomeProps {
  docks: Dock[];
  schedules: Schedule[];
  weatherReports: WeatherReport[];
  reservations?: Reservation[];
  currentUser?: User | null;
  onNavigateTab: (tab: string) => void;
  onSearchSchedules: (originId: string, destinationId: string, date: string) => void;
  onSelectBooking: (schedule: Schedule) => void;
  onTrackVessel?: (vesselName: string) => void;
}

export const PassengerHome: React.FC<PassengerHomeProps> = ({
  docks,
  schedules,
  weatherReports,
  reservations = [],
  currentUser,
  onNavigateTab,
  onSearchSchedules,
  onSelectBooking,
  onTrackVessel,
}) => {
  const [originDockId, setOriginDockId] = useState<string>('');
  const [destinationDockId, setDestinationDockId] = useState<string>('');
  const [travelDate, setTravelDate] = useState<string>('2026-08-11');

  const activeBookings = reservations.filter((r) => r.reservationStatus !== 'Dibatalkan');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSchedules(originDockId, destinationDockId, travelDate);
  };

  const upcomingSchedules = schedules.slice(0, 4);
  const criticalWeather = weatherReports.find((w) => w.status === 'Siaga' || w.status === 'Waspada' || w.status === 'Berbahaya') || weatherReports[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Active Booked Vessel Live Tracking Alert if user has active ticket */}
      {activeBookings.length > 0 && (
        <div className="bg-gradient-to-r from-[#0F2C59] via-[#1E40AF] to-[#0284C7] text-white p-4 sm:p-5 rounded-3xl shadow-xl border border-sky-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in-50 duration-300">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-sky-300 flex items-center justify-center shrink-0 shadow-inner">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
                  Radar AIS Aktif • Tiket Dipesan
                </span>
              </div>
              <h3 className="font-black text-sm sm:text-base text-white mt-0.5">
                {activeBookings[0].vesselName} ({activeBookings[0].originDockName} ➔ {activeBookings[0].destinationDockName})
              </h3>
              <p className="text-xs text-sky-200">
                Jadwal: {activeBookings[0].travelDate} • Pukul {activeBookings[0].departureTime}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onTrackVessel) {
                onTrackVessel(activeBookings[0].vesselName);
              } else {
                onNavigateTab('peta');
              }
            }}
            className="py-2.5 px-5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-2xl shadow-lg flex items-center justify-center space-x-1.5 cursor-pointer self-start sm:self-auto transition-all hover:scale-105"
          >
            <Compass className="w-4 h-4 text-slate-900" />
            <span>Lacak di Live Map</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Search Box */}
      <div className="relative bg-gradient-to-br from-[#0F2C59] via-[#1E40AF] to-[#0284C7] rounded-3xl p-6 sm:p-8 text-white shadow-xl overflow-hidden">
        {/* Decorative Wave Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Top Header Row with Slogan & User Name on the Right */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-4 mb-4">
          <div className="inline-flex items-center space-x-2 bg-sky-400/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-sky-200 border border-sky-300/30">
            <Anchor className="w-3.5 h-3.5 text-sky-300" />
            <span>Platform Transportasi Laut & Sungai Lokal</span>
          </div>

          {/* User Name in Top Right of Beranda */}
          {currentUser && (
            <div className="flex items-center space-x-2.5 self-start sm:self-auto bg-white/15 backdrop-blur-md pl-3 pr-3.5 py-1.5 rounded-2xl border border-white/25 shadow-sm">
              <span className="text-xs text-sky-200">Halo,</span>
              <span className="text-xs font-extrabold text-white tracking-wide">{currentUser.name}</span>
              <img
                src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name}`}
                alt={currentUser.name}
                className="w-6 h-6 rounded-full object-cover border-2 border-amber-300 shadow-sm ml-1"
              />
            </div>
          )}
        </div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Informasi Laut, Lebih Mudah dan Aman.
          </h1>
          <p className="text-sky-100 text-sm sm:text-base leading-relaxed">
            Cari jadwal kapal klotok, speedboat, feri tradisional, dan perintis. Cek posisi kapal real-time & pesan tiket tanpa antre.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="bg-white/95 backdrop-blur-lg p-4 sm:p-6 rounded-2xl shadow-2xl text-slate-800 border border-white/40 space-y-4 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Origin */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  <span>Dari mana?</span>
                </label>
                <select
                  value={originDockId}
                  onChange={(e) => setOriginDockId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Semua Dermaga Asal</option>
                  {['Jawa & Bali', 'Sumatera', 'Kalimantan', 'Sulawesi', 'Nusa Tenggara', 'Maluku & Papua'].map((reg) => {
                    const regDocks = docks.filter((d) => d.region === reg || (!d.region && reg === 'Kalimantan'));
                    if (regDocks.length === 0) return null;
                    return (
                      <optgroup key={reg} label={`📍 ${reg}`}>
                        {regDocks.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ke mana?</span>
                </label>
                <select
                  value={destinationDockId}
                  onChange={(e) => setDestinationDockId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Semua Dermaga Tujuan</option>
                  {['Jawa & Bali', 'Sumatera', 'Kalimantan', 'Sulawesi', 'Nusa Tenggara', 'Maluku & Papua'].map((reg) => {
                    const regDocks = docks.filter((d) => d.region === reg || (!d.region && reg === 'Kalimantan'));
                    if (regDocks.length === 0) return null;
                    return (
                      <optgroup key={reg} label={`📍 ${reg}`}>
                        {regDocks.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  <span>Tanggal Perjalanan</span>
                </label>
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-lg shadow-sky-600/30 flex items-center justify-center space-x-2 active:scale-[0.99]"
            >
              <Search className="w-4 h-4" />
              <span>Cari Jadwal Kapal</span>
            </button>
          </form>
        </div>
      </div>

      {/* Quick Menu Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        <button
          onClick={() => onNavigateTab('peta')}
          className="bg-white p-3 rounded-2xl shadow-sm hover:shadow-md border border-slate-200/80 flex flex-col items-center justify-center text-center group transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-1.5">
            <Map className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-800">Live Map</span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">Tracking Kapal</span>
        </button>

        <button
          onClick={() => onNavigateTab('rute')}
          className="bg-white p-3 rounded-2xl shadow-sm hover:shadow-md border border-sky-200 flex flex-col items-center justify-center text-center group transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform mb-1.5 shadow-sm shadow-sky-600/30">
            <Compass className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-sky-900">Rute Se-ID</span>
          <span className="text-[10px] text-sky-600 hidden sm:inline">Pencarian Rute</span>
        </button>

        <button
          onClick={() => onNavigateTab('jadwal')}
          className="bg-white p-3 rounded-2xl shadow-sm hover:shadow-md border border-slate-200/80 flex flex-col items-center justify-center text-center group transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-1.5">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-800">Jadwal</span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">Keberangkatan</span>
        </button>

        <button
          onClick={() => onNavigateTab('tiket')}
          className="bg-white p-3 rounded-2xl shadow-sm hover:shadow-md border border-slate-200/80 flex flex-col items-center justify-center text-center group transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-1.5">
            <Ticket className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-800">Tiket Saya</span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">Digital Pass</span>
        </button>

        <button
          onClick={() => onNavigateTab('cuaca')}
          className="bg-white p-3 rounded-2xl shadow-sm hover:shadow-md border border-slate-200/80 flex flex-col items-center justify-center text-center group transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-1.5">
            <CloudSun className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-800">Cuaca</span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">Gelombang Laut</span>
        </button>

        <button
          onClick={() => onNavigateTab('sos')}
          className="bg-white p-3 rounded-2xl shadow-sm hover:shadow-md border border-red-200/80 flex flex-col items-center justify-center text-center group transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-1.5">
            <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
          </div>
          <span className="text-xs font-bold text-red-600">SOS</span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">Bantuan Darurat</span>
        </button>
      </div>

      {/* Critical Weather Alert Ticker */}
      {criticalWeather && (
        <div
          onClick={() => onNavigateTab('cuaca')}
          className={`cursor-pointer p-4 rounded-2xl border flex items-start space-x-3 shadow-sm transition-all hover:shadow-md ${
            criticalWeather.status === 'Siaga' || criticalWeather.status === 'Berbahaya'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-sky-50 border-sky-200 text-sky-900'
          }`}
        >
          <div className="p-2 rounded-xl bg-amber-500 text-white font-bold text-xs shrink-0 mt-0.5">
            ⚠️ BMKG
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs sm:text-sm">
                Info Cuaca & Gelombang Rute {criticalWeather.routeName}
              </h4>
              <span className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded border border-amber-300">
                Status: {criticalWeather.status}
              </span>
            </div>
            <p className="text-xs mt-1 text-slate-700 line-clamp-2">
              {criticalWeather.officialAdvice}
            </p>
          </div>
        </div>
      )}

      {/* Jadwal Terdekat */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Jadwal Keberangkatan Terdekat</h2>
            <p className="text-xs text-slate-500">Pilih kapal dan pesan kuota yang tersedia</p>
          </div>
          <button
            onClick={() => onNavigateTab('jadwal')}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingSchedules.map((sch) => {
            const seatsRemaining = sch.maxPassengers - sch.bookedPassengers;
            const isFull = seatsRemaining <= 0;
            const percentageUsed = Math.min(100, Math.round((sch.bookedPassengers / sch.maxPassengers) * 100));

            return (
              <div
                key={sch.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md mb-1">
                      {sch.vesselType}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">{sch.vesselName}</h3>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      sch.status === 'on_time' || sch.status === 'scheduled'
                        ? 'bg-emerald-100 text-emerald-800'
                        : sch.status === 'delayed'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {sch.status === 'on_time' || sch.status === 'scheduled'
                      ? '🟢 Tepat Waktu'
                      : sch.status === 'delayed'
                      ? '🟡 Delay'
                      : '🔴 Batal'}
                  </span>
                </div>

                {/* Route & Times */}
                <div className="bg-slate-50 p-3 rounded-xl space-y-2 border border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <div className="font-medium text-slate-700">{sch.originDockName}</div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mx-2" />
                    <div className="font-medium text-slate-700 text-right">{sch.destinationDockName}</div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-200/60 font-semibold">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-sky-600" />
                      <span>{sch.departureTime} WITA</span>
                    </span>
                    <span className="text-slate-500">
                      Tiba ~ {sch.estimatedArrivalTime} WITA
                    </span>
                  </div>
                </div>

                {/* Quota Gauge */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>Kapasitas Kursi</span>
                    </span>
                    <span className={isFull ? 'text-red-600 font-bold' : 'text-slate-800'}>
                      {sch.bookedPassengers} / {sch.maxPassengers} kursi terisi
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        percentageUsed >= 90
                          ? 'bg-red-500'
                          : percentageUsed >= 70
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percentageUsed}%` }}
                    />
                  </div>
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Tarif Penumpang</span>
                    <span className="font-extrabold text-slate-900 text-base">
                      Rp {sch.tariffPassenger.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <button
                    disabled={isFull || sch.status === 'cancelled'}
                    onClick={() => onSelectBooking(sch)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      isFull || sch.status === 'cancelled'
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-sky-600 hover:bg-sky-700 text-white active:scale-95 shadow-sky-600/20'
                    }`}
                  >
                    {sch.status === 'cancelled'
                      ? 'Dibatalkan'
                      : isFull
                      ? 'Penuh'
                      : 'Pesan Tiket'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
