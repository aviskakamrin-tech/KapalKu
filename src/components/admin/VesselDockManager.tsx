import React, { useState } from 'react';
import { Vessel, Dock, VesselType, VesselStatus, RegionIndonesia } from '../../types';
import { api } from '../../lib/api';
import {
  Ship,
  Anchor,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  MapPin,
  Users,
  Compass,
} from 'lucide-react';

interface VesselDockManagerProps {
  vessels: Vessel[];
  docks: Dock[];
  onRefreshData: () => void;
}

export const VesselDockManager: React.FC<VesselDockManagerProps> = ({
  vessels,
  docks,
  onRefreshData,
}) => {
  const [subTab, setSubTab] = useState<'vessels' | 'docks'>('vessels');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Vessel Form State
  const [isVesselModalOpen, setIsVesselModalOpen] = useState(false);
  const [vesselName, setVesselName] = useState('');
  const [vesselReg, setVesselReg] = useState('');
  const [vesselType, setVesselType] = useState<VesselType>('Feri');
  const [vesselCapacity, setVesselCapacity] = useState('265');
  const [vesselMotorbikes, setVesselMotorbikes] = useState('60');
  const [vesselCars, setVesselCars] = useState('25');
  const [vesselTrucks, setVesselTrucks] = useState('12');
  const [vesselRoutes, setVesselRoutes] = useState('');
  const [vesselOperator, setVesselOperator] = useState('PT ASDP Indonesia Ferry (Persero)');
  const [vesselPhone, setVesselPhone] = useState('0811-4090-265');

  // Dock Form State
  const [isDockModalOpen, setIsDockModalOpen] = useState(false);
  const [dockName, setDockName] = useState('');
  const [dockAddress, setDockAddress] = useState('');
  const [dockLat, setDockLat] = useState('-4.6853');
  const [dockLng, setDockLng] = useState('122.0298');
  const [dockRegion, setDockRegion] = useState<RegionIndonesia>('Sulawesi');
  const [dockProvince, setDockProvince] = useState('Sulawesi Tenggara');

  const handleCreateVessel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createVessel({
        name: vesselName,
        registrationNumber: vesselReg || `REG-${Date.now().toString().slice(-6)}`,
        type: vesselType,
        capacityPassengers: Number(vesselCapacity) || 40,
        capacityMotorbikes: Number(vesselMotorbikes) || 0,
        capacityCars: Number(vesselCars) || 0,
        capacityTrucks: Number(vesselTrucks) || 0,
        operatingRoutesDescription: vesselRoutes,
        operatorName: vesselOperator,
        operatorPhone: vesselPhone,
        status: 'Bertambat',
      });
      setStatusMessage({ type: 'success', text: `Armada kapal ${vesselName} berhasil didaftarkan.` });
      setIsVesselModalOpen(false);
      setVesselName('');
      setVesselReg('');
      setVesselRoutes('');
      onRefreshData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal mendaftarkan kapal' });
    }
  };

  const handleCreateDock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDock({
        name: dockName,
        address: dockAddress,
        lat: Number(dockLat) || -1.25,
        lng: Number(dockLng) || 116.8,
        region: dockRegion,
        province: dockProvince,
        status: 'Aktif',
      });
      setStatusMessage({ type: 'success', text: `Dermaga ${dockName} berhasil ditambahkan.` });
      setIsDockModalOpen(false);
      onRefreshData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal menambahkan dermaga' });
    }
  };

  const handleDeleteVessel = async (id: string, name: string) => {
    if (!window.confirm(`Hapus data kapal ${name}?`)) return;
    try {
      await api.deleteVessel(id);
      setStatusMessage({ type: 'success', text: `Kapal ${name} dihapus.` });
      onRefreshData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal menghapus kapal' });
    }
  };

  const handleDeleteDock = async (id: string, name: string) => {
    if (!window.confirm(`Hapus data dermaga ${name}?`)) return;
    try {
      await api.deleteDock(id);
      setStatusMessage({ type: 'success', text: `Dermaga ${name} dihapus.` });
      onRefreshData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal menghapus dermaga' });
    }
  };

  return (
    <div className="space-y-4">
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
      )}

      {/* Sub tabs & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setSubTab('vessels')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'vessels' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ship className="w-4 h-4" />
            <span>Armada Kapal ({vessels.length})</span>
          </button>
          <button
            onClick={() => setSubTab('docks')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'docks' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Anchor className="w-4 h-4" />
            <span>Dermaga & Pelabuhan ({docks.length})</span>
          </button>
        </div>

        {subTab === 'vessels' ? (
          <button
            onClick={() => setIsVesselModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Daftarkan Kapal Baru</span>
          </button>
        ) : (
          <button
            onClick={() => setIsDockModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Dermaga Baru</span>
          </button>
        )}
      </div>

      {/* Vessels Grid */}
      {subTab === 'vessels' && (
        vessels.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center shadow-sm">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 shadow-inner">
                <Ship className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base">Belum Ada Armada Kapal Terdaftar</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Daftar armada kapal masih kosong. Silakan daftarkan kapal feri, speedboat, atau klotok baru untuk mulai menjadwalkan pelayaran.
                </p>
              </div>
              <button
                onClick={() => setIsVesselModalOpen(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30 inline-flex items-center space-x-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Daftarkan Kapal Pertama</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vessels.map((vsl) => (
              <div key={vsl.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {vsl.type}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base mt-1">{vsl.name}</h4>
                    <div className="text-[10px] text-slate-500 font-mono">No. Reg: {vsl.registrationNumber}</div>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      vsl.status === 'Dalam Perjalanan'
                        ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                        : vsl.status === 'Bertambat'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {vsl.status}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100">
                  <div>
                    <div className="text-[9px] text-slate-500 font-medium">Penumpang</div>
                    <div className="font-bold text-slate-800 text-xs">{vsl.capacityPassengers} Org</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 font-medium">Motor</div>
                    <div className="font-bold text-slate-800 text-xs">{vsl.capacityMotorbikes || 0} Unit</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 font-medium">Mobil</div>
                    <div className="font-bold text-slate-800 text-xs">{vsl.capacityCars || 0} Unit</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 font-medium">Truk</div>
                    <div className="font-bold text-slate-800 text-xs">{vsl.capacityTrucks || 0} Unit</div>
                  </div>
                </div>

                {vsl.operatingRoutesDescription && (
                  <div className="text-[11px] text-indigo-950 bg-indigo-50/80 p-2 rounded-xl border border-indigo-100/80 flex items-start space-x-2">
                    <Compass className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-indigo-900 block text-[10px]">Rute Pelayanan:</span>
                      <span className="font-medium text-slate-700 leading-tight">{vsl.operatingRoutesDescription}</span>
                    </div>
                  </div>
                )}

                <div className="text-xs text-slate-600 space-y-1">
                  <div>
                    <span className="text-slate-400">Operator: </span>
                    <span className="font-medium text-slate-800">{vsl.operatorName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Kontak: </span>
                    <span className="font-mono text-slate-700">{vsl.operatorPhone}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleDeleteVessel(vsl.id, vsl.name)}
                    className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center space-x-1 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Kapal</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Docks Grid */}
      {subTab === 'docks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docks.map((dock) => (
            <div key={dock.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
                    {dock.region || 'Kalimantan'}
                  </span>
                  <h4 className="font-bold text-slate-900 text-base mt-1">{dock.name}</h4>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {dock.status}
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="flex items-start space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{dock.address}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Koordinat: {dock.lat.toFixed(4)}, {dock.lng.toFixed(4)}
                </div>
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleDeleteDock(dock.id, dock.name)}
                  className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center space-x-1 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Dermaga</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Vessel */}
      {isVesselModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-900">Daftarkan Kapal Baru</h3>

            {/* Quick Templates from Pelabuhan Ferry Kampung Baru */}
            <div className="bg-sky-50 border border-sky-200 p-2.5 rounded-2xl space-y-1.5">
              <span className="text-[10px] font-bold text-sky-900 block">Isi Cepat Data Kapal Ferry Resmi Kampung Baru:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setVesselName('KMP Oputa Yi Ko');
                    setVesselReg('PK-OPUTA-265-SULTRA');
                    setVesselType('Feri');
                    setVesselCapacity('265');
                    setVesselMotorbikes('80');
                    setVesselCars('30');
                    setVesselTrucks('15');
                    setVesselRoutes('Kasipute – Pising (3x seminggu, 3 jam, 32 Mil) & Kasipute – Tondasi (2x seminggu, 2 jam, 20 Mil)');
                    setVesselOperator('PT ASDP Indonesia Ferry (Persero)');
                    setVesselPhone('0811-4090-265');
                  }}
                  className="py-1.5 px-2 bg-white hover:bg-sky-100 text-sky-900 border border-sky-300 rounded-xl text-[10px] font-bold transition-all text-center cursor-pointer shadow-xs"
                >
                  ⚡ KMP Oputa Yi Ko (265 Org)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVesselName('KMP Bontoharu');
                    setVesselReg('PK-BONTO-350-SULTRA');
                    setVesselType('Feri');
                    setVesselCapacity('350');
                    setVesselMotorbikes('120');
                    setVesselCars('45');
                    setVesselTrucks('20');
                    setVesselRoutes('Kasipute – Sikeli (6 jam, 60 Mil)');
                    setVesselOperator('PT ASDP Indonesia Ferry (Persero)');
                    setVesselPhone('0811-4090-350');
                  }}
                  className="py-1.5 px-2 bg-white hover:bg-sky-100 text-sky-900 border border-sky-300 rounded-xl text-[10px] font-bold transition-all text-center cursor-pointer shadow-xs"
                >
                  ⚡ KMP Bontoharu (350 Org)
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateVessel} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kapal</label>
                <input
                  type="text"
                  value={vesselName}
                  onChange={(e) => setVesselName(e.target.value)}
                  placeholder="Contoh: SB Borneo Jaya Express"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kapal</label>
                  <select
                    value={vesselType}
                    onChange={(e) => setVesselType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none font-bold"
                  >
                    <option value="Feri">Feri (Ro-Ro)</option>
                    <option value="Speedboat">Speedboat</option>
                    <option value="Klotok">Klotok</option>
                    <option value="Kapal Perintis">Kapal Perintis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kapasitas Penumpang (Org)</label>
                  <input
                    type="number"
                    value={vesselCapacity}
                    onChange={(e) => setVesselCapacity(e.target.value)}
                    placeholder="Contoh: 265 atau 350"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kapasitas Motor</label>
                  <input
                    type="number"
                    value={vesselMotorbikes}
                    onChange={(e) => setVesselMotorbikes(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kapasitas Mobil</label>
                  <input
                    type="number"
                    value={vesselCars}
                    onChange={(e) => setVesselCars(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kapasitas Truk</label>
                  <input
                    type="number"
                    value={vesselTrucks}
                    onChange={(e) => setVesselTrucks(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rute & Layanan Operasi</label>
                <input
                  type="text"
                  value={vesselRoutes}
                  onChange={(e) => setVesselRoutes(e.target.value)}
                  placeholder="Contoh: Kasipute – Pising (3x seminggu) & Kasipute – Tondasi (2x seminggu)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Perusahaan / Operator</label>
                <input
                  type="text"
                  value={vesselOperator}
                  onChange={(e) => setVesselOperator(e.target.value)}
                  placeholder="Contoh: PT ASDP Indonesia Ferry (Persero)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVesselModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Simpan Kapal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dock */}
      {isDockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-900">Tambah Dermaga / Pelabuhan</h3>
            <form onSubmit={handleCreateDock} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Dermaga</label>
                <input
                  type="text"
                  value={dockName}
                  onChange={(e) => setDockName(e.target.value)}
                  placeholder="Contoh: Dermaga IKN Sepaku"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  value={dockAddress}
                  onChange={(e) => setDockAddress(e.target.value)}
                  placeholder="Jl. Pelabuhan Laut..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDockModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Simpan Dermaga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
