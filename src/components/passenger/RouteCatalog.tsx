import React, { useState, useMemo } from 'react';
import { RouteItem, RegionIndonesia, Dock, WeatherReport } from '../../types';
import {
  MapPin,
  Navigation,
  Clock,
  CreditCard,
  Ship,
  Search,
  Globe,
  Filter,
  ArrowRight,
  Info,
  Calendar,
  X,
  Sparkles,
  Compass,
  CheckCircle2,
} from 'lucide-react';

interface RouteCatalogProps {
  routes: RouteItem[];
  docks?: Dock[];
  weatherReports?: WeatherReport[];
  onNavigateTab?: (tab: string) => void;
  onSearchSchedules?: (originDockName: string, destinationDockName: string) => void;
}

const REGIONS: { key: string; label: string; icon: string }[] = [
  { key: 'all', label: 'Semua Wilayah Indonesia', icon: '🇮🇩' },
  { key: 'Jawa & Bali', label: 'Jawa & Bali', icon: '🏛️' },
  { key: 'Sumatera', label: 'Sumatera', icon: '🌴' },
  { key: 'Kalimantan', label: 'Kalimantan', icon: '🌳' },
  { key: 'Sulawesi', label: 'Sulawesi', icon: '🐬' },
  { key: 'Nusa Tenggara', label: 'Nusa Tenggara (NTB/NTT)', icon: '🏝️' },
  { key: 'Maluku & Papua', label: 'Maluku & Papua', icon: '🦜' },
];

const POPULAR_HOT_TAGS = [
  { name: 'Merak → Bakauheni', query: 'Merak Bakauheni' },
  { name: 'Ketapang → Gilimanuk', query: 'Ketapang Gilimanuk' },
  { name: 'Sanur → Nusa Penida', query: 'Sanur Nusa Penida' },
  { name: 'Balikpapan → Penajam', query: 'Balikpapan Penajam' },
  { name: 'Sorong → Raja Ampat', query: 'Sorong Raja Ampat' },
  { name: 'Labuan Bajo → Komodo', query: 'Labuan Bajo Komodo' },
  { name: 'Banda Aceh → Sabang', query: 'Banda Aceh Sabang' },
  { name: 'Batam → Tanjung Pinang', query: 'Batam Tanjung Pinang' },
  { name: 'Marina Ancol → P. Pramuka', query: 'Ancol Pramuka' },
];

export const RouteCatalog: React.FC<RouteCatalogProps> = ({
  routes,
  docks = [],
  weatherReports = [],
  onNavigateTab,
  onSearchSchedules,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedVesselType, setSelectedVesselType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'distance' | 'price' | 'duration'>('distance');
  const [detailModalRoute, setDetailModalRoute] = useState<RouteItem | null>(null);

  // Filter routes
  const filteredRoutes = useMemo(() => {
    return routes
      .filter((route) => {
        // Keyword Search matching
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchesName = route.name.toLowerCase().includes(q);
          const matchesOrigin = route.originDockName.toLowerCase().includes(q);
          const matchesDest = route.destinationDockName.toLowerCase().includes(q);
          const matchesRegion = route.region ? route.region.toLowerCase().includes(q) : false;
          const matchesDesc = route.description ? route.description.toLowerCase().includes(q) : false;

          if (!matchesName && !matchesOrigin && !matchesDest && !matchesRegion && !matchesDesc) {
            return false;
          }
        }

        // Region filter
        if (selectedRegion !== 'all' && route.region !== selectedRegion) {
          return false;
        }

        // Vessel type filter
        if (
          selectedVesselType !== 'all' &&
          route.vesselTypesAvailable &&
          !route.vesselTypesAvailable.includes(selectedVesselType as any)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'distance') return a.distanceKm - b.distanceKm;
        if (sortBy === 'price') return a.tariffPassenger - b.tariffPassenger;
        if (sortBy === 'duration') return a.estimatedDurationMinutes - b.estimatedDurationMinutes;
        return a.name.localeCompare(b.name);
      });
  }, [routes, searchTerm, selectedRegion, selectedVesselType, sortBy]);

  const handleBookRoute = (route: RouteItem) => {
    if (onSearchSchedules) {
      onSearchSchedules(route.originDockName, route.destinationDockName);
    } else if (onNavigateTab) {
      onNavigateTab('jadwal');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Search Header Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-sky-400/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-sky-200 border border-sky-300/30">
            <Globe className="w-3.5 h-3.5 text-sky-300" />
            <span>Pencarian Rute Laut & Sungai Seluruh Indonesia</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Katalog Rute Penyeberangan Nusantara
          </h2>
          <p className="text-xs sm:text-sm text-sky-100/90 max-w-2xl leading-relaxed">
            Temukan informasi lengkap rute kapal feri, speedboat, klotok, dan kapal perintis di Jawa, Bali, Sumatra, Kalimantan, Sulawesi, Nusa Tenggara, Maluku, hingga Papua.
          </p>

          {/* Search Input Bar */}
          <div className="pt-2">
            <div className="relative flex items-center bg-white rounded-2xl p-1.5 shadow-2xl text-slate-800 border border-white/30">
              <Search className="w-5 h-5 text-sky-600 ml-3 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari rute, pelabuhan, pulau, atau wilayah (mis: Merak, Raja Ampat, Sabang, Bali, Balikpapan)..."
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none placeholder-slate-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 mr-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Popular Hot Tags */}
          <div className="pt-1">
            <div className="flex items-center space-x-2 text-[11px] text-sky-200 font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Rute Favorit Populer:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_HOT_TAGS.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => setSearchTerm(tag.query)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                    searchTerm === tag.query
                      ? 'bg-sky-400 text-slate-950 font-extrabold border-sky-300 shadow-sm'
                      : 'bg-white/10 hover:bg-white/20 text-sky-100 border-white/20'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Options Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Region Filter Chips */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center space-x-1">
            <Compass className="w-3.5 h-3.5 text-sky-600" />
            <span>Pilih Wilayah Indonesia</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((reg) => (
              <button
                key={reg.key}
                onClick={() => setSelectedRegion(reg.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  selectedRegion === reg.key
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 scale-[1.02]'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{reg.icon}</span>
                <span>{reg.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Jenis Transportasi</label>
            <select
              value={selectedVesselType}
              onChange={(e) => setSelectedVesselType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="all">Semua Jenis Kapal</option>
              <option value="Feri">Feri Tradisional / Ro-Ro</option>
              <option value="Speedboat">Speedboat / Kapal Cepat</option>
              <option value="Klotok">Klotok / Sungai</option>
              <option value="Kapal Perintis">Kapal Perintis PELNI</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Urutkan Berdasarkan</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="distance">Jarak Terpendek (KM)</option>
              <option value="price">Tarif Penumpang Termurah</option>
              <option value="duration">Waktu Tempuh Tercepat</option>
              <option value="name">Nama Rute (A - Z)</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="w-full bg-sky-50 p-2.5 rounded-xl border border-sky-100 text-xs text-sky-800 font-bold flex items-center justify-between">
              <span>Menampilkan:</span>
              <span className="bg-sky-600 text-white px-2 py-0.5 rounded-md text-xs font-extrabold">
                {filteredRoutes.length} Rute
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Routes Grid */}
      {filteredRoutes.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <Search className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Rute Tidak Ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tidak ada rute pelayaran yang cocok dengan pencarian &quot;{searchTerm}&quot;. Coba reset kata kunci atau ubah wilayah.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedRegion('all');
              setSelectedVesselType('all');
            }}
            className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition-all"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRoutes.map((route) => {
            const originDock = docks.find((d) => d.id === route.originDockId);
            const destDock = docks.find((d) => d.id === route.destinationDockId);

            return (
              <div
                key={route.id}
                className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                      {route.region && (
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-100 text-sky-800 uppercase tracking-wider mb-1">
                          📍 {route.region}
                        </span>
                      )}
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug">{route.name}</h3>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shrink-0 ml-2 ${
                        route.status === 'Operasional'
                          ? 'bg-emerald-100 text-emerald-800'
                          : route.status === 'Waspada'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {route.status}
                    </span>
                  </div>

                  {/* Route Quick Stats */}
                  <div className="flex items-center space-x-4 text-xs text-slate-600 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="flex items-center space-x-1">
                      <Navigation className="w-3.5 h-3.5 text-sky-600" />
                      <span>{route.distanceKm} km</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>~{route.estimatedDurationMinutes} menit</span>
                    </span>
                    {route.frequencyText && (
                      <span className="text-[11px] text-slate-500 font-normal truncate">
                        • {route.frequencyText}
                      </span>
                    )}
                  </div>

                  {/* Docks Box */}
                  <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-slate-700 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="truncate">
                          <strong>Asal:</strong> {route.originDockName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-slate-700 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          <strong>Tujuan:</strong> {route.destinationDockName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description if present */}
                  {route.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 italic leading-relaxed">
                      &ldquo;{route.description}&rdquo;
                    </p>
                  )}

                  {/* Tariff Matrix */}
                  <div className="space-y-1.5 pt-1">
                    <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                      <CreditCard className="w-3 h-3 text-sky-600" />
                      <span>Tarif Resmi Penyeberangan</span>
                    </h4>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-sky-50/70 p-2 rounded-xl border border-sky-100">
                        <span className="text-[10px] text-slate-500 block font-semibold">Penumpang</span>
                        <span className="font-extrabold text-slate-900 text-xs">
                          Rp {route.tariffPassenger.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                        <span className="text-[10px] text-slate-500 block font-semibold">Motor</span>
                        <span className="font-extrabold text-slate-900 text-xs">
                          {route.tariffMotorbike > 0
                            ? `Rp ${route.tariffMotorbike.toLocaleString('id-ID')}`
                            : 'N/A'}
                        </span>
                      </div>

                      <div className="bg-indigo-50/70 p-2 rounded-xl border border-indigo-100">
                        <span className="text-[10px] text-slate-500 block font-semibold">Mobil</span>
                        <span className="font-extrabold text-slate-900 text-xs">
                          {route.tariffCar > 0 ? `Rp ${route.tariffCar.toLocaleString('id-ID')}` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center space-x-2">
                  <button
                    onClick={() => setDetailModalRoute(route)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center space-x-1"
                  >
                    <Info className="w-3.5 h-3.5 text-slate-500" />
                    <span>Detail Rute</span>
                  </button>

                  <button
                    onClick={() => handleBookRoute(route)}
                    className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center space-x-1 shadow-sm shadow-sky-600/30"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Cari Jadwal</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {detailModalRoute && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-100 text-sky-800 uppercase tracking-wider mb-1">
                  📍 {detailModalRoute.region || 'Indonesia'}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">{detailModalRoute.name}</h3>
              </div>
              <button
                onClick={() => setDetailModalRoute(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              {detailModalRoute.description && (
                <div className="bg-sky-50 p-3 rounded-2xl border border-sky-100 leading-relaxed text-sky-900">
                  {detailModalRoute.description}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Jarak Tempuh</span>
                  <span className="text-sm font-extrabold text-slate-900">{detailModalRoute.distanceKm} KM</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Estimasi Waktu</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    ~{detailModalRoute.estimatedDurationMinutes} Menit
                  </span>
                </div>
              </div>

              {/* Docks Detailed Locations */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <h4 className="font-extrabold text-slate-800 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  <span>Pelabuhan & Dermaga Singgah</span>
                </h4>

                <div className="space-y-2 pt-1">
                  <div>
                    <div className="font-bold text-slate-900">Asal: {detailModalRoute.originDockName}</div>
                  </div>
                  <div className="border-t border-slate-200/80 pt-2">
                    <div className="font-bold text-slate-900">Tujuan: {detailModalRoute.destinationDockName}</div>
                  </div>
                </div>
              </div>

              {/* Vessels operated */}
              {detailModalRoute.vesselTypesAvailable && (
                <div>
                  <span className="font-extrabold text-slate-800 block mb-1">Armada Kapal Tersedia:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {detailModalRoute.vesselTypesAvailable.map((v) => (
                      <span
                        key={v}
                        className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1"
                      >
                        <Ship className="w-3 h-3 text-emerald-600" />
                        <span>{v}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                onClick={() => setDetailModalRoute(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  const r = detailModalRoute;
                  setDetailModalRoute(null);
                  handleBookRoute(r);
                }}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/30 flex items-center space-x-1.5"
              >
                <Calendar className="w-4 h-4" />
                <span>Pesan Tiket & Lihat Jadwal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
