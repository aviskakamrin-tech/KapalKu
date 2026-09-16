import React, { useState } from 'react';
import { Schedule, RouteItem, Vessel, Dock, VesselType, ScheduleStatus } from '../../types';
import { api } from '../../lib/api';
import {
  Calendar,
  Plus,
  Clock,
  Ship,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Search,
  Compass,
  ArrowRight,
  DollarSign,
} from 'lucide-react';

interface ScheduleManagerProps {
  schedules: Schedule[];
  routes: RouteItem[];
  vessels: Vessel[];
  docks: Dock[];
  onRefreshData: () => void;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  schedules,
  routes,
  vessels,
  docks,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Schedule State
  const [editingScheduleId, setEditingScheduleId] = useState<string>('');
  const [editVesselId, setEditVesselId] = useState<string>('');
  const [editRouteId, setEditRouteId] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editDepartureTime, setEditDepartureTime] = useState<string>('08:00');
  const [editArrivalTime, setEditArrivalTime] = useState<string>('09:00');
  const [editTariffPass, setEditTariffPass] = useState<string>('35000');
  const [editTariffMotor, setEditTariffMotor] = useState<string>('50000');
  const [editTariffCar, setEditTariffCar] = useState<string>('150000');
  const [editMaxPassengers, setEditMaxPassengers] = useState<string>('60');
  const [editStatus, setEditStatus] = useState<ScheduleStatus>('scheduled');

  // New Schedule Form
  const [formVesselId, setFormVesselId] = useState('');
  const [formRouteId, setFormRouteId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDepartureTime, setFormDepartureTime] = useState('08:00');
  const [formArrivalTime, setFormArrivalTime] = useState('09:00');
  const [formTariffPass, setFormTariffPass] = useState('35000');
  const [formTariffMotor, setFormTariffMotor] = useState('50000');
  const [formTariffCar, setFormTariffCar] = useState('150000');
  const [formMaxPassengers, setFormMaxPassengers] = useState('60');
  const [formStatus, setFormStatus] = useState<ScheduleStatus>('scheduled');

  const handleOpenCreateModal = () => {
    const defaultRoute = routes[0];
    const defaultVessel = vessels[0];
    if (defaultRoute) {
      setFormRouteId(defaultRoute.id);
      setFormTariffPass(String(defaultRoute.tariffPassenger));
      setFormTariffMotor(String(defaultRoute.tariffMotorbike));
      setFormTariffCar(String(defaultRoute.tariffCar));
    } else {
      setFormRouteId('');
    }
    if (defaultVessel) {
      setFormVesselId(defaultVessel.id);
      setFormMaxPassengers(String(defaultVessel.capacityPassengers || 60));
    } else {
      setFormVesselId('');
    }
    setFormDate(new Date().toISOString().split('T')[0]);
    setIsCreateModalOpen(true);
  };

  const filteredSchedules = schedules.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.vesselName.toLowerCase().includes(q) ||
      s.originDockName.toLowerCase().includes(q) ||
      s.destinationDockName.toLowerCase().includes(q) ||
      s.date.includes(q)
    );
  });

  const handleCreateRouteSelect = (routeId: string) => {
    setFormRouteId(routeId);
    const selectedRoute = routes.find((r) => r.id === routeId);
    if (selectedRoute) {
      setFormTariffPass(String(selectedRoute.tariffPassenger));
      setFormTariffMotor(String(selectedRoute.tariffMotorbike));
      setFormTariffCar(String(selectedRoute.tariffCar));
    }
  };

  const handleEditRouteSelect = (routeId: string) => {
    setEditRouteId(routeId);
    const selectedRoute = routes.find((r) => r.id === routeId);
    if (selectedRoute) {
      setEditTariffPass(String(selectedRoute.tariffPassenger));
      setEditTariffMotor(String(selectedRoute.tariffMotorbike));
      setEditTariffCar(String(selectedRoute.tariffCar));
    }
  };

  const handleOpenEditModal = (sch: Schedule) => {
    setEditingScheduleId(sch.id);
    setEditVesselId(sch.vesselId || vessels.find(v => v.name === sch.vesselName)?.id || vessels[0]?.id || '');
    setEditRouteId(sch.routeId || routes[0]?.id || '');
    setEditDate(sch.date || new Date().toISOString().split('T')[0]);
    setEditDepartureTime(sch.departureTime || '08:00');
    setEditArrivalTime(sch.estimatedArrivalTime || '09:00');
    setEditTariffPass(String(sch.tariffPassenger || 35000));
    setEditTariffMotor(String(sch.tariffMotorbike || 50000));
    setEditTariffCar(String(sch.tariffCar || 150000));
    setEditMaxPassengers(String(sch.maxPassengers || 60));
    setEditStatus(sch.status || 'scheduled');
    setIsEditModalOpen(true);
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const vessel = vessels.find((v) => v.id === formVesselId);
    const route = routes.find((r) => r.id === formRouteId);

    if (!vessel || !route) {
      alert('Pilih armada kapal dan jalur rute yang valid');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createSchedule({
        vesselId: vessel.id,
        vesselName: vessel.name,
        vesselType: vessel.type,
        routeId: route.id,
        originDockName: route.originDockName,
        destinationDockName: route.destinationDockName,
        date: formDate,
        departureTime: formDepartureTime,
        estimatedArrivalTime: formArrivalTime,
        tariffPassenger: Number(formTariffPass) || 35000,
        tariffMotorbike: Number(formTariffMotor) || 50000,
        tariffCar: Number(formTariffCar) || 150000,
        status: formStatus,
        maxPassengers: Number(formMaxPassengers) || vessel.capacityPassengers || 60,
      });

      setStatusMessage({ type: 'success', text: `Jadwal baru untuk kapal ${vessel.name} (${route.name}) berhasil diterbitkan.` });
      setIsCreateModalOpen(false);
      onRefreshData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal membuat jadwal' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEditSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScheduleId) return;

    const vessel = vessels.find((v) => v.id === editVesselId);
    const route = routes.find((r) => r.id === editRouteId);

    if (!vessel || !route) {
      alert('Pilih armada kapal dan jalur pelayaran yang valid');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.updateSchedule(editingScheduleId, {
        vesselId: vessel.id,
        vesselName: vessel.name,
        vesselType: vessel.type,
        routeId: route.id,
        originDockName: route.originDockName,
        destinationDockName: route.destinationDockName,
        date: editDate,
        departureTime: editDepartureTime,
        estimatedArrivalTime: editArrivalTime,
        status: editStatus,
        tariffPassenger: Number(editTariffPass),
        tariffMotorbike: Number(editTariffMotor),
        tariffCar: Number(editTariffCar),
        maxPassengers: Number(editMaxPassengers),
      });

      setStatusMessage({ type: 'success', text: `Jadwal kapal ${vessel.name} pada rute ${route.name} berhasil diperbarui!` });
      setIsEditModalOpen(false);
      onRefreshData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal mengubah jadwal' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (id: string, name: string) => {
    if (!window.confirm(`Hapus jadwal pelayaran ${name}?`)) return;
    try {
      await api.deleteSchedule(id);
      setStatusMessage({ type: 'success', text: `Jadwal ${name} telah dihapus.` });
      onRefreshData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal menghapus jadwal' });
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
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
      )}

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari jadwal kapal, dermaga, atau tanggal..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-1.5 cursor-pointer shrink-0 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Jadwal Keberangkatan Baru</span>
        </button>
      </div>

      {/* Schedules Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3 px-4">Armada Kapal</th>
                <th className="py-3 px-4">Jalur Pelayaran</th>
                <th className="py-3 px-4">Tanggal & Jam</th>
                <th className="py-3 px-4">Tarif (Org / Mtr / Mbl)</th>
                <th className="py-3 px-4">Kapasitas Muatan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Belum Ada Jadwal Pelayaran Kapal</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Daftar jadwal masih kosong. Jadwal kapal hanya akan muncul setelah Anda menerbitkannya melalui tombol di bawah.
                        </p>
                      </div>
                      <button
                        onClick={handleOpenCreateModal}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center space-x-1.5 cursor-pointer transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Buat Jadwal Keberangkatan Baru</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((sch) => {
                  return (
                    <tr key={sch.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <Ship className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div>
                            <div>{sch.vesselName}</div>
                            <span className="text-[10px] text-slate-500 font-normal">{sch.vesselType}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{sch.originDockName}</div>
                        <div className="text-[10px] text-slate-500 font-medium">➔ {sch.destinationDockName}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {sch.departureTime} - {sch.estimatedArrivalTime}
                        </div>
                        <div className="text-[10px] text-slate-500">{sch.date}</div>
                      </td>

                      <td className="py-3.5 px-4 font-medium">
                        <div className="space-y-0.5">
                          <div className="text-emerald-700 font-bold">Rp {sch.tariffPassenger?.toLocaleString('id-ID')}</div>
                          <div className="text-[10px] text-slate-500">
                            Mtr: Rp {sch.tariffMotorbike?.toLocaleString('id-ID')} | Mbl: Rp {sch.tariffCar?.toLocaleString('id-ID')}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {sch.bookedPassengers} / {sch.maxPassengers} Penumpang
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {sch.bookedMotorbikes} Motor | {sch.bookedCars} Mobil
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            sch.status === 'scheduled' || sch.status === 'on_time'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sch.status === 'boarding'
                              ? 'bg-sky-100 text-sky-800 animate-pulse'
                              : sch.status === 'delayed'
                              ? 'bg-amber-100 text-amber-800'
                              : sch.status === 'completed'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {sch.status === 'scheduled' && 'Terjadwal'}
                          {sch.status === 'boarding' && 'Boarding'}
                          {sch.status === 'on_time' && 'Berlayar'}
                          {sch.status === 'delayed' && 'Delay'}
                          {sch.status === 'cancelled' && 'Batal'}
                          {sch.status === 'completed' && 'Selesai'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEditModal(sch)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                            title="Edit Jadwal & Jalur"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(sch.id, sch.vesselName)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            title="Hapus Jadwal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Ubah Jadwal & Ganti Jalur Pelayaran */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Ubah Jadwal & Jalur Pelayaran</h3>
                  <p className="text-xs text-slate-500">Ganti jalur pelayaran, armada kapal, waktu, dan tarif</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditSchedule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Jalur Pelayaran <span className="text-red-500">*</span>
                </label>
                <select
                  value={editRouteId}
                  onChange={(e) => handleEditRouteSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-950 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.originDockName} ➔ {r.destinationDockName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Armada Kapal <span className="text-red-500">*</span>
                </label>
                <select
                  value={editVesselId}
                  onChange={(e) => {
                    setEditVesselId(e.target.value);
                    const selVessel = vessels.find(v => v.id === e.target.value);
                    if (selVessel && selVessel.capacityPassengers) {
                      setEditMaxPassengers(String(selVessel.capacityPassengers));
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white outline-none"
                  required
                >
                  {vessels.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.type}) - Kapasitas: {v.capacityPassengers} Penumpang
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Berangkat <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={editDepartureTime}
                    onChange={(e) => setEditDepartureTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimasi Tiba <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={editArrivalTime}
                    onChange={(e) => setEditArrivalTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Tarif Tiket Jadwal Ini (IDR)</span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">Penumpang (Rp)</label>
                    <input
                      type="number"
                      value={editTariffPass}
                      onChange={(e) => setEditTariffPass(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">Motor (Rp)</label>
                    <input
                      type="number"
                      value={editTariffMotor}
                      onChange={(e) => setEditTariffMotor(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">Mobil (Rp)</label>
                    <input
                      type="number"
                      value={editTariffCar}
                      onChange={(e) => setEditTariffCar(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Pelayaran
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ScheduleStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white outline-none"
                  >
                    <option value="scheduled">Terjadwal</option>
                    <option value="boarding">Boarding (Pintu Dibuka)</option>
                    <option value="on_time">Berlayar</option>
                    <option value="delayed">Delay</option>
                    <option value="cancelled">Batal</option>
                    <option value="completed">Selesai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kapasitas Maks Penumpang
                  </label>
                  <input
                    type="number"
                    value={editMaxPassengers}
                    onChange={(e) => setEditMaxPassengers(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-none"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan Jadwal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Jadwal Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Buat Jadwal Pelayaran Baru</h3>
                  <p className="text-xs text-slate-500">Tetapkan kapal, jalur pelayaran, jam keberangkatan, dan tarif</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Jalur Rute Pelayaran <span className="text-red-500">*</span>
                </label>
                <select
                  value={formRouteId}
                  disabled={routes.length === 0}
                  onChange={(e) => handleCreateRouteSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-indigo-50/50 disabled:bg-slate-100 disabled:text-slate-400 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-950 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  {routes.length === 0 ? (
                    <option value="">Belum ada rute (Tambahkan via menu Atur Rute & Tarif Tiket)</option>
                  ) : (
                    <>
                      <option value="">-- Pilih Jalur Pelayaran --</option>
                      {routes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.originDockName} ➔ {r.destinationDockName})
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Armada Kapal <span className="text-red-500">*</span>
                </label>
                <select
                  value={formVesselId}
                  disabled={vessels.length === 0}
                  onChange={(e) => {
                    setFormVesselId(e.target.value);
                    const selVessel = vessels.find(v => v.id === e.target.value);
                    if (selVessel && selVessel.capacityPassengers) {
                      setFormMaxPassengers(String(selVessel.capacityPassengers));
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white outline-none"
                  required
                >
                  {vessels.length === 0 ? (
                    <option value="">Belum ada armada kapal terdaftar</option>
                  ) : (
                    <>
                      <option value="">-- Pilih Kapal --</option>
                      {vessels.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.type}) - Kapasitas: {v.capacityPassengers} Penumpang
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Berangkat <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formDepartureTime}
                    onChange={(e) => setFormDepartureTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimasi Tiba <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formArrivalTime}
                    onChange={(e) => setFormArrivalTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Tarif Tiket Jadwal Ini (IDR)</span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">Penumpang (Rp)</label>
                    <input
                      type="number"
                      value={formTariffPass}
                      onChange={(e) => setFormTariffPass(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">Motor (Rp)</label>
                    <input
                      type="number"
                      value={formTariffMotor}
                      onChange={(e) => setFormTariffMotor(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">Mobil (Rp)</label>
                    <input
                      type="number"
                      value={formTariffCar}
                      onChange={(e) => setFormTariffCar(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Awal
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ScheduleStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white outline-none"
                  >
                    <option value="scheduled">Terjadwal</option>
                    <option value="boarding">Boarding (Pintu Dibuka)</option>
                    <option value="on_time">Berlayar</option>
                    <option value="delayed">Delay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kapasitas Maks Penumpang
                  </label>
                  <input
                    type="number"
                    value={formMaxPassengers}
                    onChange={(e) => setFormMaxPassengers(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-none"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menerbitkan...' : 'Terbitkan Jadwal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
