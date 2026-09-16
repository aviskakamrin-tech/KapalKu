import React, { useState } from 'react';
import { Dock, RegionIndonesia, DockRole } from '../../types';
import { api } from '../../lib/api';
import { PRESET_NATIONAL_DOCKS } from '../../data/mockData';
import {
  Anchor,
  Plus,
  Edit2,
  Trash2,
  Search,
  MapPin,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Phone,
  Building2,
  Check,
  X,
  Navigation,
  Globe,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
} from 'lucide-react';

interface DockMasterManagerProps {
  docks: Dock[];
  onRefreshData: () => void;
}

const REGIONS: RegionIndonesia[] = [
  'Kalimantan',
  'Jawa & Bali',
  'Sumatera',
  'Sulawesi',
  'Nusa Tenggara',
  'Maluku & Papua',
];

const AVAILABLE_FACILITIES = [
  'Loket Tiket Resmi',
  'Ruang Tunggu Ber-AC',
  'Dermaga Feri Ro-Ro',
  'Dermaga Speedboat Cepat',
  'Dermaga Klotok / Kayu',
  'Parkir Kendaraan Luas',
  'Posko Syahbandar / SAR',
  'Musholla & Toilet Bersih',
  'Kantin & Rest Area',
  'Mesin Boarding Pass',
];

export const DockMasterManager: React.FC<DockMasterManagerProps> = ({
  docks,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('Semua');
  const [roleFilter, setRoleFilter] = useState<string>('Semua');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State for Create
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<DockRole>('both');
  const [formRegion, setFormRegion] = useState<RegionIndonesia>('Kalimantan');
  const [formProvince, setFormProvince] = useState('Kalimantan Timur');
  const [formCity, setFormCity] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Perbaikan' | 'Non-Aktif'>('Aktif');
  const [formFacilities, setFormFacilities] = useState<string[]>([
    'Loket Tiket Resmi',
    'Ruang Tunggu Ber-AC',
  ]);
  const [formPhone, setFormPhone] = useState('0812-3456-7890');

  // Form State for Edit
  const [editingDockId, setEditingDockId] = useState('');
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<DockRole>('both');
  const [editRegion, setEditRegion] = useState<RegionIndonesia>('Kalimantan');
  const [editProvince, setEditProvince] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editStatus, setEditStatus] = useState<'Aktif' | 'Perbaikan' | 'Non-Aktif'>('Aktif');
  const [editFacilities, setEditFacilities] = useState<string[]>([]);
  const [editPhone, setEditPhone] = useState('');
  const [existingLat, setExistingLat] = useState(-1.2721);
  const [existingLng, setExistingLng] = useState(116.8190);

  // Filtered Docks
  const filteredDocks = docks.filter((d) => {
    const matchQuery =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.province && d.province.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.city && d.city.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchRegion = regionFilter === 'Semua' || d.region === regionFilter;
    const matchRole =
      roleFilter === 'Semua' ||
      (roleFilter === 'both' && (!d.dockRole || d.dockRole === 'both')) ||
      (roleFilter === 'origin_only' && d.dockRole === 'origin_only') ||
      (roleFilter === 'destination_only' && d.dockRole === 'destination_only');

    return matchQuery && matchRegion && matchRole;
  });

  // KPI calculations
  const totalDocks = docks.length;
  const originDocksCount = docks.filter((d) => !d.dockRole || d.dockRole === 'both' || d.dockRole === 'origin_only').length;
  const destDocksCount = docks.filter((d) => !d.dockRole || d.dockRole === 'both' || d.dockRole === 'destination_only').length;
  const uniqueRegions = Array.from(new Set(docks.map((d) => d.region).filter(Boolean))).length;

  const showNotification = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  const handleFacilityToggle = (facility: string, isEditing: boolean = false) => {
    if (isEditing) {
      setEditFacilities((prev) =>
        prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
      );
    } else {
      setFormFacilities((prev) =>
        prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
      );
    }
  };

  const handleAutoGPS = (region: RegionIndonesia, isEditing: boolean = false) => {
    const presets: Record<RegionIndonesia, { lat: number; lng: number; prov: string; city: string }> = {
      Kalimantan: { lat: -1.2721, lng: 116.819, prov: 'Kalimantan Timur', city: 'Balikpapan' },
      'Jawa & Bali': { lat: -5.9328, lng: 105.9997, prov: 'Banten', city: 'Cilegon' },
      Sumatera: { lat: 5.5614, lng: 95.2831, prov: 'Aceh', city: 'Banda Aceh' },
      Sulawesi: { lat: -5.1322, lng: 119.4082, prov: 'Sulawesi Selatan', city: 'Makassar' },
      'Nusa Tenggara': { lat: -8.4901, lng: 119.8802, prov: 'Nusa Tenggara Timur', city: 'Labuan Bajo' },
      'Maluku & Papua': { lat: -0.8711, lng: 131.2501, prov: 'Papua Barat Daya', city: 'Sorong' },
    };

    const target = presets[region];
    if (isEditing) {
      if (!editProvince) setEditProvince(target.prov);
      if (!editCity) setEditCity(target.city);
    } else {
      setFormProvince(target.prov);
      setFormCity(target.city);
    }
  };

  const handleCreateDock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showNotification('error', 'Nama dermaga wajib diisi.');
      return;
    }

    const presets: Record<RegionIndonesia, { lat: number; lng: number }> = {
      Kalimantan: { lat: -1.2721, lng: 116.819 },
      'Jawa & Bali': { lat: -5.9328, lng: 105.9997 },
      Sumatera: { lat: 5.5614, lng: 95.2831 },
      Sulawesi: { lat: -5.1322, lng: 119.4082 },
      'Nusa Tenggara': { lat: -8.4901, lng: 119.8802 },
      'Maluku & Papua': { lat: -0.8711, lng: 131.2501 },
    };
    const regionCoords = presets[formRegion] || { lat: -1.25, lng: 116.82 };

    setIsSubmitting(true);
    try {
      await api.createDock({
        name: formName.trim(),
        dockRole: formRole,
        region: formRegion,
        province: formProvince.trim() || 'Kalimantan Timur',
        city: formCity.trim() || undefined,
        address: formAddress.trim() || 'Pesisir Dermaga Resmi',
        lat: regionCoords.lat,
        lng: regionCoords.lng,
        status: formStatus,
        facilities: formFacilities,
        contactPhone: formPhone.trim() || '0812-3456-7890',
      });

      showNotification('success', `Dermaga "${formName}" berhasil ditambahkan ke database!`);
      setIsCreateModalOpen(false);
      setFormName('');
      setFormAddress('');
      setFormCity('');
      onRefreshData();
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal menambahkan dermaga.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (dock: Dock) => {
    setEditingDockId(dock.id);
    setEditName(dock.name);
    setEditRole(dock.dockRole || 'both');
    setEditRegion(dock.region || 'Kalimantan');
    setEditProvince(dock.province || 'Kalimantan Timur');
    setEditCity(dock.city || '');
    setEditAddress(dock.address || '');
    setExistingLat(dock.lat || -1.25);
    setExistingLng(dock.lng || 116.82);
    setEditStatus(dock.status || 'Aktif');
    setEditFacilities(dock.facilities || ['Loket Tiket Resmi', 'Ruang Tunggu']);
    setEditPhone(dock.contactPhone || '0812-3456-7890');
    setIsEditModalOpen(true);
  };

  const handleUpdateDock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showNotification('error', 'Nama dermaga wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.updateDock(editingDockId, {
        name: editName.trim(),
        dockRole: editRole,
        region: editRegion,
        province: editProvince.trim(),
        city: editCity.trim() || undefined,
        address: editAddress.trim(),
        lat: existingLat,
        lng: existingLng,
        status: editStatus,
        facilities: editFacilities,
        contactPhone: editPhone.trim(),
      });

      showNotification('success', `Data dermaga "${editName}" berhasil diperbarui!`);
      setIsEditModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal memperbarui dermaga.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDock = async (dock: Dock) => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus dermaga "${dock.name}"?\n\nDermaga ini tidak akan lagi tersedia untuk pilihan pencarian jadwal keberangkatan atau kedatangan penumpang.`
    );
    if (!confirmDelete) return;

    try {
      await api.deleteDock(dock.id);
      showNotification('success', `Dermaga "${dock.name}" berhasil dihapus.`);
      onRefreshData();
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal menghapus dermaga.');
    }
  };

  const handleImportPresetPair = async (pairName: string, docksToAdd: Dock[]) => {
    setIsSubmitting(true);
    try {
      for (const d of docksToAdd) {
        await api.createDock({
          name: d.name,
          address: d.address,
          lat: d.lat,
          lng: d.lng,
          status: d.status,
          province: d.province,
          region: d.region,
          city: d.city,
          dockRole: d.dockRole || 'both',
          facilities: d.facilities || ['Loket Tiket', 'Ruang Tunggu'],
          contactPhone: '0812-0000-0000',
        });
      }
      showNotification('success', `Pasangan dermaga (${pairName}) berhasil ditambahkan ke portal.`);
      setIsPresetModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal memuat preset dermaga.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between shadow-xl transition-all animate-in fade-in duration-300 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          <div className="flex items-center space-x-3">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            )}
            <span className="text-sm font-semibold">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-white/80 hover:text-white text-xs font-bold px-2 py-1"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Header & Overview KPIs */}
      <div className="bg-gradient-to-r from-[#071E3D] via-[#0F2C59] to-[#1E3E62] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-sky-800/40">
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-sky-500/20 text-sky-200 border border-sky-400/30 rounded-full text-xs font-medium mb-3">
              <Anchor className="w-3.5 h-3.5 text-sky-300" />
              <span>Master Data Pelabuhan & Dermaga Penyeberangan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Kelola Dermaga Asal & Tujuan
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-2xl leading-relaxed">
              Daftarkan dermaga keberangkatan (asal) dan dermaga kedatangan (tujuan). Pilihan dermaga di portal cari jadwal dan reservasi tiket penumpang hanya akan muncul setelah ditambahkan di sini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsPresetModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-sky-900/60 hover:bg-sky-800 text-sky-200 border border-sky-600/50 rounded-xl text-sm font-semibold transition-all shadow-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Contoh Pasangan Dermaga</span>
            </button>
            <button
              onClick={() => {
                setFormRegion('Kalimantan');
                handleAutoGPS('Kalimantan', false);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-900/40 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Dermaga Baru</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-sky-800/60">
          <div className="bg-sky-950/50 p-4 rounded-2xl border border-sky-800/40 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-sky-200 font-medium mb-1">
              <span>Total Dermaga</span>
              <Anchor className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-white">{totalDocks}</div>
            <div className="text-[11px] text-slate-300 mt-0.5">Terdaftar resmi</div>
          </div>

          <div className="bg-sky-950/50 p-4 rounded-2xl border border-sky-800/40 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-sky-200 font-medium mb-1">
              <span>Dermaga Asal</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300">{originDocksCount}</div>
            <div className="text-[11px] text-slate-300 mt-0.5">Siap keberangkatan</div>
          </div>

          <div className="bg-sky-950/50 p-4 rounded-2xl border border-sky-800/40 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-sky-200 font-medium mb-1">
              <span>Dermaga Tujuan</span>
              <ArrowDownLeft className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-sky-300">{destDocksCount}</div>
            <div className="text-[11px] text-slate-300 mt-0.5">Titik kedatangan</div>
          </div>

          <div className="bg-sky-950/50 p-4 rounded-2xl border border-sky-800/40 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-sky-200 font-medium mb-1">
              <span>Wilayah Aktif</span>
              <Globe className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300">{uniqueRegions}</div>
            <div className="text-[11px] text-slate-300 mt-0.5">Kepulauan Indonesia</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama dermaga, kota, provinsi..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-800 placeholder-slate-400 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Region Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Wilayah:</span>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="Semua">Semua Wilayah</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Peran:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="Semua">Semua Peran</option>
              <option value="both">Asal & Tujuan (Dua Arah)</option>
              <option value="origin_only">Asal Saja (Keberangkatan)</option>
              <option value="destination_only">Tujuan Saja (Kedatangan)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Docks List or Empty State */}
      {docks.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-12 text-center border-2 border-dashed border-sky-300 shadow-sm">
          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-sky-100">
            <Anchor className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Belum Ada Dermaga yang Ditambahkan</h3>
          <p className="text-slate-500 text-sm max-w-lg mx-auto mt-2 leading-relaxed">
            Sistem pencarian jadwal penumpang saat ini tidak menampilkan pilihan asal dan tujuan karena belum ada dermaga yang didaftarkan oleh admin.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={() => {
                setFormRegion('Kalimantan');
                handleAutoGPS('Kalimantan', false);
                setIsCreateModalOpen(true);
              }}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Dermaga Pertama</span>
            </button>
            <button
              onClick={() => setIsPresetModalOpen(true)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all cursor-pointer inline-flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Muat Contoh Pasangan Dermaga Resmi</span>
            </button>
          </div>
        </div>
      ) : filteredDocks.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-sm">
          Tidak ada dermaga yang cocok dengan kata kunci atau filter yang dipilih.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredDocks.map((dock) => {
            const role = dock.dockRole || 'both';
            return (
              <div
                key={dock.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Status indicator bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    dock.status === 'Aktif'
                      ? 'bg-emerald-500'
                      : dock.status === 'Perbaikan'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />

                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        role === 'both'
                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                          : role === 'origin_only'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}
                    >
                      {role === 'both' && <ArrowRightLeft className="w-3 h-3" />}
                      {role === 'origin_only' && <ArrowUpRight className="w-3 h-3" />}
                      {role === 'destination_only' && <ArrowDownLeft className="w-3 h-3" />}
                      <span>
                        {role === 'both'
                          ? 'Dermaga Asal & Tujuan'
                          : role === 'origin_only'
                          ? 'Dermaga Asal Saja'
                          : 'Dermaga Tujuan Saja'}
                      </span>
                    </span>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        dock.status === 'Aktif'
                          ? 'bg-emerald-50 text-emerald-700'
                          : dock.status === 'Perbaikan'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {dock.status}
                    </span>
                  </div>

                  {/* Dock Name & Location */}
                  <h3 className="text-base font-bold text-slate-800 group-hover:text-sky-700 transition-colors leading-snug">
                    {dock.name}
                  </h3>

                  <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span className="leading-tight line-clamp-2">{dock.address}</span>
                    </div>

                    <div className="flex items-center space-x-3 text-slate-500 pt-1">
                      <span className="inline-flex items-center space-x-1">
                        <Globe className="w-3.5 h-3.5 text-sky-500" />
                        <span>{dock.province || dock.region || 'Indonesia'}</span>
                      </span>
                      {dock.city && (
                        <span className="inline-flex items-center space-x-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dock.city}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Facilities Chips */}
                  {dock.facilities && dock.facilities.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {dock.facilities.slice(0, 3).map((f, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium"
                        >
                          {f}
                        </span>
                      ))}
                      {dock.facilities.length > 3 && (
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px]">
                          +{dock.facilities.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">ID: {dock.id}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(dock)}
                      className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Dermaga"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDock(dock)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Dermaga"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Tambah Dermaga Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 bg-sky-100 text-sky-700 rounded-xl flex items-center justify-center">
                  <Anchor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Tambah Dermaga Baru</h3>
                  <p className="text-xs text-slate-500">Daftarkan dermaga asal atau dermaga tujuan baru</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDock} className="space-y-4 mt-4">
              {/* Nama Dermaga */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Dermaga / Pelabuhan *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Dermaga Semayang (Balikpapan)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                />
              </div>

              {/* Peran Dermaga */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Peran Dermaga (Ketersediaan di Pencarian Tiket) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormRole('both')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      formRole === 'both'
                        ? 'border-sky-500 bg-sky-50/70 text-sky-900 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-sky-600" />
                      <span>Asal & Tujuan</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">Bisa untuk berangkat & tiba</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole('origin_only')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      formRole === 'origin_only'
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Asal Saja</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">Hanya titik keberangkatan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole('destination_only')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      formRole === 'destination_only'
                        ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1">
                      <ArrowDownLeft className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Tujuan Saja</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">Hanya titik kedatangan</span>
                  </button>
                </div>
              </div>

              {/* Wilayah & Provinsi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Wilayah Kepulauan *
                  </label>
                  <select
                    value={formRegion}
                    onChange={(e) => {
                      const reg = e.target.value as RegionIndonesia;
                      setFormRegion(reg);
                      handleAutoGPS(reg, false);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Provinsi *
                  </label>
                  <input
                    type="text"
                    required
                    value={formProvince}
                    onChange={(e) => setFormProvince(e.target.value)}
                    placeholder="Contoh: Kalimantan Timur"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Kota/Kabupaten & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kota / Kabupaten
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Contoh: Kota Balikpapan"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status Operasional
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                  >
                    <option value="Aktif">Aktif (Beroperasi Normal)</option>
                    <option value="Perbaikan">Perbaikan / Pemeliharaan</option>
                    <option value="Non-Aktif">Non-Aktif (Ditutup Sementara)</option>
                  </select>
                </div>
              </div>

              {/* Alamat Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Alamat Lengkap / Pesisir
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Contoh: Jl. Yos Sudarso No. 1, Prapatan, Balikpapan Kota"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                />
              </div>

              {/* Fasilitas Dermaga */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Fasilitas & Layanan Dermaga
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_FACILITIES.map((facility) => {
                    const isChecked = formFacilities.includes(facility);
                    return (
                      <label
                        key={facility}
                        className={`flex items-center space-x-2 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-sky-50/70 border-sky-300 text-sky-900 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleFacilityToggle(facility, false)}
                          className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                        />
                        <span className="truncate">{facility}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Dermaga</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Dermaga */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Edit Data Dermaga</h3>
                  <p className="text-xs text-slate-500">Perbarui nama, peran, alamat, dan fasilitas dermaga</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDock} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Dermaga / Pelabuhan *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Peran Dermaga *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRole('both')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      editRole === 'both'
                        ? 'border-sky-500 bg-sky-50/70 text-sky-900 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-sky-600" />
                      <span>Asal & Tujuan</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">Dua arah (Berangkat & Tiba)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole('origin_only')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      editRole === 'origin_only'
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Asal Saja</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">Hanya keberangkatan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole('destination_only')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      editRole === 'destination_only'
                        ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1">
                      <ArrowDownLeft className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Tujuan Saja</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">Hanya kedatangan</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Wilayah Kepulauan
                  </label>
                  <select
                    value={editRegion}
                    onChange={(e) => setEditRegion(e.target.value as RegionIndonesia)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Provinsi
                  </label>
                  <input
                    type="text"
                    value={editProvince}
                    onChange={(e) => setEditProvince(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kota / Kabupaten
                  </label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Perbaikan">Perbaikan</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Alamat Lengkap
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Fasilitas & Layanan Dermaga
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_FACILITIES.map((facility) => {
                    const isChecked = editFacilities.includes(facility);
                    return (
                      <label
                        key={facility}
                        className={`flex items-center space-x-2 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-sky-50/70 border-sky-300 text-sky-900 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleFacilityToggle(facility, true)}
                          className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                        />
                        <span className="truncate">{facility}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Preset Pasangan Dermaga Resmi */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Contoh Pasangan Dermaga Nusantara</h3>
                  <p className="text-xs text-slate-500">Pilih pasangan dermaga resmi untuk diimpor cepat</p>
                </div>
              </div>
              <button
                onClick={() => setIsPresetModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                Anda dapat menambahkan pasangan dermaga di bawah ini untuk menguji fitur pencarian jadwal penumpang secara cepat:
              </p>

              {/* Preset 1: Balikpapan - Penajam */}
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-sky-400 bg-slate-50 hover:bg-sky-50/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">Kalimantan</span>
                    <span className="text-sm font-bold text-slate-800">Dermaga Semayang & Dermaga Penajam</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    📍 Balikpapan ⇄ Penajam Paser Utara (Kawasan IKN Nusantara)
                  </p>
                </div>
                <button
                  disabled={isSubmitting}
                  onClick={() =>
                    handleImportPresetPair('Balikpapan - Penajam', [
                      PRESET_NATIONAL_DOCKS[0], // Semayang
                      PRESET_NATIONAL_DOCKS[1], // Penajam
                    ])
                  }
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer"
                >
                  + Tambahkan Pasangan Ini
                </button>
              </div>

              {/* Preset 2: Merak - Bakauheni */}
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-sky-400 bg-slate-50 hover:bg-sky-50/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">Jawa - Sumatera</span>
                    <span className="text-sm font-bold text-slate-800">Pelabuhan Merak & Pelabuhan Bakauheni</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    📍 Cilegon Banten ⇄ Lampung Selatan (Lintas Selat Sunda)
                  </p>
                </div>
                <button
                  disabled={isSubmitting}
                  onClick={() =>
                    handleImportPresetPair('Merak - Bakauheni', [
                      PRESET_NATIONAL_DOCKS[6], // Merak
                      PRESET_NATIONAL_DOCKS[12], // Bakauheni
                    ])
                  }
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer"
                >
                  + Tambahkan Pasangan Ini
                </button>
              </div>

              {/* Preset 3: Ketapang - Gilimanuk */}
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-sky-400 bg-slate-50 hover:bg-sky-50/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Jawa - Bali</span>
                    <span className="text-sm font-bold text-slate-800">Pelabuhan Ketapang & Pelabuhan Gilimanuk</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    📍 Banyuwangi Jawa Timur ⇄ Jembrana Bali (Selat Bali)
                  </p>
                </div>
                <button
                  disabled={isSubmitting}
                  onClick={() =>
                    handleImportPresetPair('Ketapang - Gilimanuk', [
                      PRESET_NATIONAL_DOCKS[7], // Ketapang
                      PRESET_NATIONAL_DOCKS[8], // Gilimanuk
                    ])
                  }
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer"
                >
                  + Tambahkan Pasangan Ini
                </button>
              </div>

              {/* Preset 4: Sanur - Buyuk Nusa Penida */}
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-sky-400 bg-slate-50 hover:bg-sky-50/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Bali</span>
                    <span className="text-sm font-bold text-slate-800">Dermaga Sanur & Dermaga Buyuk (Nusa Penida)</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    📍 Denpasar Bali ⇄ Pulau Nusa Penida (Speedboat Cepat)
                  </p>
                </div>
                <button
                  disabled={isSubmitting}
                  onClick={() =>
                    handleImportPresetPair('Sanur - Nusa Penida', [
                      PRESET_NATIONAL_DOCKS[9], // Sanur
                      PRESET_NATIONAL_DOCKS[10], // Buyuk
                    ])
                  }
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer"
                >
                  + Tambahkan Pasangan Ini
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsPresetModalOpen(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
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
