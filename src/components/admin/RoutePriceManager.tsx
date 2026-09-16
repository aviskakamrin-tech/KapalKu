import React, { useState } from 'react';
import { RouteItem, Dock, RegionIndonesia } from '../../types';
import { api } from '../../lib/api';
import {
  Compass,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  DollarSign,
  Clock,
  Navigation,
  Sparkles,
  Search,
  Filter,
  ArrowRightLeft,
  Wand2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface RoutePriceManagerProps {
  routes: RouteItem[];
  docks: Dock[];
  onRefreshData: () => void;
}

export const RoutePriceManager: React.FC<RoutePriceManagerProps> = ({
  routes,
  docks,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('Semua');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Route State
  const [editingRouteId, setEditingRouteId] = useState<string>('');
  const [editOriginDockId, setEditOriginDockId] = useState<string>('');
  const [editDestDockId, setEditDestDockId] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editDistanceKm, setEditDistanceKm] = useState<string>('32');
  const [editDistanceMiles, setEditDistanceMiles] = useState<string>('20');
  const [editDurationMin, setEditDurationMin] = useState<string>('120');
  const [editTariffPass, setEditTariffPass] = useState<string>('45000');
  const [editTariffChild, setEditTariffChild] = useState<string>('7000');
  const [editTariffMotor, setEditTariffMotor] = useState<string>('92000');
  const [editTariffCar, setEditTariffCar] = useState<string>('941000');
  const [editTariffTruck, setEditTariffTruck] = useState<string>('1507000');
  const [editStatus, setEditStatus] = useState<'Operasional' | 'Ditutup' | 'Waspada'>('Operasional');
  const [editRegion, setEditRegion] = useState<RegionIndonesia>('Sulawesi');
  const [editFrequency, setEditFrequency] = useState<string>('3 Kali Seminggu');
  const [editDescription, setEditDescription] = useState<string>('Pelayaran feri penumpang dan muatan kendaraan');

  // New Route Form State
  const [formName, setFormName] = useState('');
  const [formOriginDockId, setFormOriginDockId] = useState(docks[0]?.id || '');
  const [formDestDockId, setFormDestDockId] = useState(docks[1]?.id || '');
  const [formDistanceKm, setFormDistanceKm] = useState('32');
  const [formDistanceMiles, setFormDistanceMiles] = useState('20');
  const [formDurationMin, setFormDurationMin] = useState('120');
  const [formTariffPass, setFormTariffPass] = useState('45000');
  const [formTariffChild, setFormTariffChild] = useState('7000');
  const [formTariffMotor, setFormTariffMotor] = useState('92000');
  const [formTariffCar, setFormTariffCar] = useState('941000');
  const [formTariffTruck, setFormTariffTruck] = useState('1507000');
  const [formStatus, setFormStatus] = useState<'Operasional' | 'Ditutup' | 'Waspada'>('Operasional');
  const [formRegion, setFormRegion] = useState<RegionIndonesia>('Sulawesi');
  const [formFrequency, setFormFrequency] = useState('3 Kali Seminggu');
  const [formDescription, setFormDescription] = useState('Pelayaran feri penumpang dan muatan kendaraan');

  const filteredRoutes = routes.filter((r) => {
    const matchQuery =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.originDockName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.destinationDockName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRegion = regionFilter === 'Semua' || r.region === regionFilter;
    return matchQuery && matchRegion;
  });

  // Open Edit Modal with selected route data
  const handleOpenEditModal = (route: RouteItem) => {
    setEditingRouteId(route.id);
    setEditOriginDockId(route.originDockId || docks.find(d => d.name === route.originDockName)?.id || docks[0]?.id || '');
    setEditDestDockId(route.destinationDockId || docks.find(d => d.name === route.destinationDockName)?.id || docks[1]?.id || '');
    setEditName(route.name);
    setEditDistanceKm(String(route.distanceKm || 15));
    setEditDistanceMiles(route.distanceMiles !== undefined ? String(route.distanceMiles) : '');
    setEditDurationMin(String(route.estimatedDurationMinutes || 45));
    setEditTariffPass(String(route.tariffPassenger || 35000));
    setEditTariffChild(route.tariffChild !== undefined ? String(route.tariffChild) : '');
    setEditTariffMotor(String(route.tariffMotorbike || 50000));
    setEditTariffCar(String(route.tariffCar || 150000));
    setEditTariffTruck(route.tariffTruck !== undefined ? String(route.tariffTruck) : '');
    setEditStatus(route.status);
    setEditRegion((route.region as RegionIndonesia) || 'Sulawesi');
    setEditFrequency(route.frequencyText || 'Tiap 30-45 menit');
    setEditDescription(route.description || 'Pelayaran reguler feri dan penumpang');
    setIsEditModalOpen(true);
  };

  // Helper to swap origin and destination for Edit
  const handleSwapEditDocks = () => {
    const prevOrigin = editOriginDockId;
    const prevDest = editDestDockId;
    setEditOriginDockId(prevDest);
    setEditDestDockId(prevOrigin);

    const originDock = docks.find((d) => d.id === prevDest);
    const destDock = docks.find((d) => d.id === prevOrigin);
    if (originDock && destDock) {
      setEditName(`${originDock.name.split('(')[0].trim()} ➔ ${destDock.name.split('(')[0].trim()}`);
    }
  };

  // Helper to auto-generate name for Edit
  const handleAutoGenerateEditName = () => {
    const originDock = docks.find((d) => d.id === editOriginDockId);
    const destDock = docks.find((d) => d.id === editDestDockId);
    if (originDock && destDock) {
      setEditName(`${originDock.name.split('(')[0].trim()} ➔ ${destDock.name.split('(')[0].trim()}`);
      if (originDock.region) {
        setEditRegion(originDock.region);
      }
    }
  };

  // Helper to swap origin and destination for Create
  const handleSwapCreateDocks = () => {
    const prevOrigin = formOriginDockId;
    const prevDest = formDestDockId;
    setFormOriginDockId(prevDest);
    setFormDestDockId(prevOrigin);

    const originDock = docks.find((d) => d.id === prevDest);
    const destDock = docks.find((d) => d.id === prevOrigin);
    if (originDock && destDock) {
      setFormName(`${originDock.name.split('(')[0].trim()} ➔ ${destDock.name.split('(')[0].trim()}`);
    }
  };

  // Helper to auto-generate name for Create
  const handleAutoGenerateCreateName = () => {
    const originDock = docks.find((d) => d.id === formOriginDockId);
    const destDock = docks.find((d) => d.id === formDestDockId);
    if (originDock && destDock) {
      setFormName(`${originDock.name.split('(')[0].trim()} ➔ ${destDock.name.split('(')[0].trim()}`);
      if (originDock.region) {
        setFormRegion(originDock.region);
      }
    }
  };

  const handleSaveEditRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRouteId) return;

    const originDock = docks.find((d) => d.id === editOriginDockId);
    const destDock = docks.find((d) => d.id === editDestDockId);

    if (!originDock || !destDock) {
      alert('Pilih dermaga asal dan tujuan yang valid');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalName = editName.trim() || `${originDock.name.split('(')[0].trim()} ➔ ${destDock.name.split('(')[0].trim()}`;

      await api.updateRoute(editingRouteId, {
        name: finalName,
        originDockId: originDock.id,
        originDockName: originDock.name,
        destinationDockId: destDock.id,
        destinationDockName: destDock.name,
        distanceKm: Number(editDistanceKm) || 15,
        distanceMiles: editDistanceMiles ? Number(editDistanceMiles) : undefined,
        estimatedDurationMinutes: Number(editDurationMin) || 45,
        tariffPassenger: Number(editTariffPass) || 35000,
        tariffChild: editTariffChild ? Number(editTariffChild) : undefined,
        tariffMotorbike: Number(editTariffMotor) || 50000,
        tariffCar: Number(editTariffCar) || 150000,
        tariffTruck: editTariffTruck ? Number(editTariffTruck) : undefined,
        status: editStatus,
        region: editRegion,
        frequencyText: editFrequency,
        description: editDescription,
      });

      setStatusMessage({ type: 'success', text: `Jalur pelayaran "${finalName}" berhasil diperbarui!` });
      setIsEditModalOpen(false);
      onRefreshData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal memperbarui jalur pelayaran' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    const originDock = docks.find((d) => d.id === formOriginDockId);
    const destDock = docks.find((d) => d.id === formDestDockId);

    if (!originDock || !destDock) {
      alert('Pilih dermaga asal dan tujuan');
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedName = formName.trim() || `${originDock.name.split('(')[0].trim()} ➔ ${destDock.name.split('(')[0].trim()}`;
      await api.createRoute({
        name: generatedName,
        originDockId: originDock.id,
        originDockName: originDock.name,
        destinationDockId: destDock.id,
        destinationDockName: destDock.name,
        distanceKm: Number(formDistanceKm) || 10,
        distanceMiles: formDistanceMiles ? Number(formDistanceMiles) : undefined,
        estimatedDurationMinutes: Number(formDurationMin) || 45,
        tariffPassenger: Number(formTariffPass) || 35000,
        tariffChild: formTariffChild ? Number(formTariffChild) : undefined,
        tariffMotorbike: Number(formTariffMotor) || 50000,
        tariffCar: Number(formTariffCar) || 150000,
        tariffTruck: formTariffTruck ? Number(formTariffTruck) : undefined,
        status: formStatus,
        region: formRegion,
        frequencyText: formFrequency,
        description: formDescription,
        vesselTypesAvailable: ['Feri', 'Speedboat'],
      });

      setStatusMessage({ type: 'success', text: `Jalur pelayaran baru "${generatedName}" berhasil ditambahkan.` });
      setIsCreateModalOpen(false);
      // Reset form
      setFormName('');
      onRefreshData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal membuat jalur pelayaran' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoute = async (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus jalur pelayaran ${name}?`)) return;
    try {
      await api.deleteRoute(id);
      setStatusMessage({ type: 'success', text: `Jalur pelayaran "${name}" berhasil dihapus.` });
      onRefreshData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal menghapus jalur pelayaran' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
      )}

      {/* Control Bar: Search, Filter, and Add Route */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari rute, dermaga asal, atau tujuan..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:bg-white outline-none font-medium"
            >
              <option value="Semua">Semua Wilayah</option>
              <option value="Kalimantan">Kalimantan</option>
              <option value="Jawa & Bali">Jawa & Bali</option>
              <option value="Sumatera">Sumatera</option>
              <option value="Sulawesi">Sulawesi</option>
              <option value="Nusa Tenggara">Nusa Tenggara</option>
              <option value="Maluku & Papua">Maluku & Papua</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            if (docks.length >= 2) {
              setFormOriginDockId(docks[0].id);
              setFormDestDockId(docks[1].id);
              setFormName(`${docks[0].name.split('(')[0].trim()} ➔ ${docks[1].name.split('(')[0].trim()}`);
            }
            setIsCreateModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-1.5 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Jalur / Rute Baru</span>
        </button>
      </div>

      {/* Routes Grid & Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoutes.map((route) => {
          return (
            <div
              key={route.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all p-5 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header: Name & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {route.region || 'Kalimantan'}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-1 line-clamp-1">
                      {route.name}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 ${
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

                {/* Docks & Path */}
                <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate font-semibold text-slate-800">
                      Asal: <span className="font-normal text-slate-600">{route.originDockName}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="truncate font-semibold text-slate-800">
                      Tujuan: <span className="font-normal text-slate-600">{route.destinationDockName}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                    <span className="flex items-center space-x-1 font-medium">
                      <Navigation className="w-3.5 h-3.5 text-indigo-500" />
                      <span>
                        {route.distanceMiles ? `${route.distanceMiles} Mil (${route.distanceKm} km)` : `${route.distanceKm} km`}
                      </span>
                    </span>
                    <span className="flex items-center space-x-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        ± {Math.floor(route.estimatedDurationMinutes / 60) > 0 ? `${Math.floor(route.estimatedDurationMinutes / 60)} Jam ` : ''}
                        {route.estimatedDurationMinutes % 60 > 0 ? `${route.estimatedDurationMinutes % 60} Menit` : ''}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Tarif Tiket Resmi</span>
                    </span>
                    <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
                      {route.frequencyText || 'Reguler'}
                    </span>
                  </div>

                  <div className={`grid gap-1.5 text-center ${route.tariffChild || route.tariffTruck ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-3'}`}>
                    <div className="bg-sky-50/80 p-2 rounded-xl border border-sky-100">
                      <div className="text-[10px] text-sky-700 font-medium">Dewasa</div>
                      <div className="text-xs font-black text-slate-900 mt-0.5">
                        Rp {route.tariffPassenger?.toLocaleString('id-ID')}
                      </div>
                    </div>

                    {route.tariffChild !== undefined && (
                      <div className="bg-emerald-50/80 p-2 rounded-xl border border-emerald-100">
                        <div className="text-[10px] text-emerald-700 font-medium">Anak-Anak</div>
                        <div className="text-xs font-black text-slate-900 mt-0.5">
                          Rp {route.tariffChild?.toLocaleString('id-ID')}
                        </div>
                      </div>
                    )}

                    <div className="bg-amber-50/80 p-2 rounded-xl border border-amber-100">
                      <div className="text-[10px] text-amber-700 font-medium">Motor</div>
                      <div className="text-xs font-black text-slate-900 mt-0.5">
                        Rp {route.tariffMotorbike?.toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="bg-indigo-50/80 p-2 rounded-xl border border-indigo-100">
                      <div className="text-[10px] text-indigo-700 font-medium">Mobil</div>
                      <div className="text-xs font-black text-slate-900 mt-0.5">
                        Rp {route.tariffCar?.toLocaleString('id-ID')}
                      </div>
                    </div>

                    {route.tariffTruck !== undefined && (
                      <div className="bg-purple-50/80 p-2 rounded-xl border border-purple-100">
                        <div className="text-[10px] text-purple-700 font-medium">Mobil Truk</div>
                        <div className="text-xs font-black text-slate-900 mt-0.5">
                          Rp {route.tariffTruck?.toLocaleString('id-ID')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-3">
                <button
                  onClick={() => handleOpenEditModal(route)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Ganti Jalur / Edit Rute</span>
                </button>

                <button
                  onClick={() => handleDeleteRoute(route.id, route.name)}
                  className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-xl flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Ganti Jalur Pelayaran & Edit Rute (Komprehensif) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Ganti Jalur Pelayaran & Edit Rute</h3>
                  <p className="text-xs text-slate-500">Ubah dermaga asal/tujuan, nama rute, tarif tiket, dan parameter operasional</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditRoute} className="space-y-4">
              {/* Origin & Destination with Swap Button */}
              <div className="bg-indigo-50/40 p-3.5 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Konfigurasi Jalur & Dermaga</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleSwapEditDocks}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg flex items-center space-x-1 cursor-pointer transition-all shadow-xs"
                    title="Tukar dermaga asal dan tujuan"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Tukar Asal ⇄ Tujuan</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dermaga Asal (Keberangkatan) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editOriginDockId}
                      onChange={(e) => {
                        setEditOriginDockId(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                      required
                    >
                      {docks.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.region || d.province})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dermaga Tujuan (Kedatangan) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editDestDockId}
                      onChange={(e) => {
                        setEditDestDockId(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                      required
                    >
                      {docks.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.region || d.province})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Name field with Auto-Generate */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Nama Jalur / Rute Pelayaran <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateEditName}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Auto-isi dari Dermaga</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Contoh: Balikpapan ➔ Penajam PP"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Jarak, Durasi & Wilayah */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jarak (Mil Laut)
                  </label>
                  <input
                    type="number"
                    value={editDistanceMiles}
                    onChange={(e) => setEditDistanceMiles(e.target.value)}
                    placeholder="Contoh: 20 atau 32"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jarak Tempuh (Km)
                  </label>
                  <input
                    type="number"
                    value={editDistanceKm}
                    onChange={(e) => setEditDistanceKm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimasi (Menit)
                  </label>
                  <input
                    type="number"
                    value={editDurationMin}
                    onChange={(e) => setEditDurationMin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    min="5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wilayah Kepulauan
                  </label>
                  <select
                    value={editRegion}
                    onChange={(e) => setEditRegion(e.target.value as RegionIndonesia)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-none font-medium"
                  >
                    <option value="Sulawesi">Sulawesi</option>
                    <option value="Kalimantan">Kalimantan</option>
                    <option value="Jawa & Bali">Jawa & Bali</option>
                    <option value="Sumatera">Sumatera</option>
                    <option value="Nusa Tenggara">Nusa Tenggara</option>
                    <option value="Maluku & Papua">Maluku & Papua</option>
                  </select>
                </div>
              </div>

              {/* Tarif Tiket */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Struktur Besaran Tarif Resmi (IDR)</span>
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Dewasa (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={editTariffPass}
                      onChange={(e) => setEditTariffPass(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Anak-Anak (Rp)
                    </label>
                    <input
                      type="number"
                      value={editTariffChild}
                      onChange={(e) => setEditTariffChild(e.target.value)}
                      placeholder="Contoh: 7000"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Motor (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={editTariffMotor}
                      onChange={(e) => setEditTariffMotor(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Mobil (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={editTariffCar}
                      onChange={(e) => setEditTariffCar(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Mobil Truk (Rp)
                    </label>
                    <input
                      type="number"
                      value={editTariffTruck}
                      onChange={(e) => setEditTariffTruck(e.target.value)}
                      placeholder="Contoh: 1507000"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Frekuensi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Operasional Jalur
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-none font-bold"
                  >
                    <option value="Operasional">Operasional (Normal)</option>
                    <option value="Waspada">Waspada (Cuaca/Gelombang)</option>
                    <option value="Ditutup">Ditutup Sementara</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Frekuensi Keberangkatan
                  </label>
                  <input
                    type="text"
                    value={editFrequency}
                    onChange={(e) => setEditFrequency(e.target.value)}
                    placeholder="Contoh: Tiap 30-45 menit"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan / Catatan Operasional
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Informasi tambahan untuk penumpang..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan Jalur'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Jalur / Rute Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Tambah Jalur Pelayaran & Tarif Baru</h3>
                  <p className="text-xs text-slate-500">Konfigurasikan rute kapal baru, dermaga asal & tujuan, dan besaran tarif tiket</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoute} className="space-y-4">
              <div className="bg-indigo-50/40 p-3.5 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Konfigurasi Jalur & Dermaga</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleSwapCreateDocks}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg flex items-center space-x-1 cursor-pointer transition-all shadow-xs"
                    title="Tukar dermaga asal dan tujuan"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Tukar Asal ⇄ Tujuan</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dermaga Asal (Keberangkatan) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formOriginDockId}
                      onChange={(e) => setFormOriginDockId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                      required
                    >
                      {docks.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.region || d.province})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dermaga Tujuan (Kedatangan) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formDestDockId}
                      onChange={(e) => setFormDestDockId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                      required
                    >
                      {docks.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.region || d.province})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Nama Rute / Jalur (Opsional)
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateCreateName}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Auto-isi dari Dermaga</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Balikpapan Express ➔ Penajam PP"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Struktur Besaran Tarif Resmi (IDR)</span>
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Dewasa (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formTariffPass}
                      onChange={(e) => setFormTariffPass(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Anak-Anak (Rp)
                    </label>
                    <input
                      type="number"
                      value={formTariffChild}
                      onChange={(e) => setFormTariffChild(e.target.value)}
                      placeholder="Contoh: 7000"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Motor (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formTariffMotor}
                      onChange={(e) => setFormTariffMotor(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Mobil (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formTariffCar}
                      onChange={(e) => setFormTariffCar(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Mobil Truk (Rp)
                    </label>
                    <input
                      type="number"
                      value={formTariffTruck}
                      onChange={(e) => setFormTariffTruck(e.target.value)}
                      placeholder="Contoh: 1507000"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jarak (Mil Laut)
                  </label>
                  <input
                    type="number"
                    value={formDistanceMiles}
                    onChange={(e) => setFormDistanceMiles(e.target.value)}
                    placeholder="Contoh: 20"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jarak Tempuh (Km)
                  </label>
                  <input
                    type="number"
                    value={formDistanceKm}
                    onChange={(e) => setFormDistanceKm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimasi (Menit)
                  </label>
                  <input
                    type="number"
                    value={formDurationMin}
                    onChange={(e) => setFormDurationMin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wilayah Kepulauan
                  </label>
                  <select
                    value={formRegion}
                    onChange={(e) => setFormRegion(e.target.value as RegionIndonesia)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-none font-medium"
                  >
                    <option value="Sulawesi">Sulawesi</option>
                    <option value="Kalimantan">Kalimantan</option>
                    <option value="Jawa & Bali">Jawa & Bali</option>
                    <option value="Sumatera">Sumatera</option>
                    <option value="Nusa Tenggara">Nusa Tenggara</option>
                    <option value="Maluku & Papua">Maluku & Papua</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Operasional
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-none font-bold"
                  >
                    <option value="Operasional">Operasional (Normal)</option>
                    <option value="Waspada">Waspada (Cuaca/Gelombang)</option>
                    <option value="Ditutup">Ditutup Sementara</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Frekuensi Keberangkatan
                  </label>
                  <input
                    type="text"
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value)}
                    placeholder="Contoh: Tiap 30-45 menit"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Terbitkan Jalur & Tarif'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
