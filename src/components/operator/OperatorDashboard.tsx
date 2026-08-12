import React, { useState, useEffect } from 'react';
import { Vessel, Schedule, Reservation } from '../../types';
import { Ship, Play, Square, AlertTriangle, Clock, Users, Navigation, CheckCircle2, RefreshCw, Send, Radio } from 'lucide-react';

interface OperatorDashboardProps {
  vessels: Vessel[];
  schedules: Schedule[];
  reservations: Reservation[];
  onUpdateVesselStatus: (vesselId: string, status: 'Bertambat' | 'Dalam Perjalanan' | 'Delay' | 'Batal') => Promise<void>;
  onSendGPSUpdate: (vesselId: string, lat: number, lng: number, speedKts: number, headingDeg: number, status?: string) => Promise<void>;
  onUpdateScheduleStatus: (scheduleId: string, status: any, reason?: string) => Promise<void>;
}

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({
  vessels,
  schedules,
  reservations,
  onUpdateVesselStatus,
  onSendGPSUpdate,
  onUpdateScheduleStatus,
}) => {
  const [selectedVesselId, setSelectedVesselId] = useState<string>(vessels[0]?.id || '');
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);
  const [delayMinutes, setDelayMinutes] = useState<number>(30);
  const [delayReason, setDelayReason] = useState<string>('Perbaikan teknis ringan / Alur sungai dangkal');
  const [showDelayModal, setShowDelayModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('Cuaca buruk & gelombang tinggi');

  const selectedVessel = vessels.find((v) => v.id === selectedVesselId) || vessels[0];
  const assignedSchedules = schedules.filter((s) => s.vesselId === selectedVesselId);
  const activeSchedule = assignedSchedules[0];
  const manifestPassengers = reservations.filter((r) => r.scheduleId === activeSchedule?.id);

  // GPS Simulation Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isGpsActive && selectedVessel) {
      interval = setInterval(() => {
        // Nudge lat/lng slightly
        const newLat = Number((selectedVessel.currentLat + (Math.random() - 0.4) * 0.0006).toFixed(5));
        const newLng = Number((selectedVessel.currentLng + (Math.random() - 0.3) * 0.0006).toFixed(5));
        const speed = Number((11 + Math.random() * 3).toFixed(1));

        onSendGPSUpdate(selectedVessel.id, newLat, newLng, speed, selectedVessel.headingDeg, 'Dalam Perjalanan');
      }, 4000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGpsActive, selectedVessel]);

  const handleStartJourney = async () => {
    if (!selectedVessel) return;
    await onUpdateVesselStatus(selectedVessel.id, 'Dalam Perjalanan');
    setIsGpsActive(true);
    if (activeSchedule) {
      await onUpdateScheduleStatus(activeSchedule.id, 'on_time', 'Kapal telah berangkat');
    }
  };

  const handleEndJourney = async () => {
    if (!selectedVessel) return;
    setIsGpsActive(false);
    await onUpdateVesselStatus(selectedVessel.id, 'Bertambat');
    if (activeSchedule) {
      await onUpdateScheduleStatus(activeSchedule.id, 'completed', 'Pelayaran selesai, bertambat di dermaga');
    }
  };

  const handleReportDelay = async () => {
    if (!activeSchedule || !selectedVessel) return;
    await onUpdateVesselStatus(selectedVessel.id, 'Delay');
    await onUpdateScheduleStatus(activeSchedule.id, 'delayed', `Keterlambatan ±${delayMinutes} menit: ${delayReason}`);
    setShowDelayModal(false);
  };

  const handleReportCancel = async () => {
    if (!activeSchedule || !selectedVessel) return;
    await onUpdateVesselStatus(selectedVessel.id, 'Batal');
    await onUpdateScheduleStatus(activeSchedule.id, 'cancelled', cancelReason);
    setShowCancelModal(false);
  };

  if (!selectedVessel) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* Operator Welcome Header */}
      <div className="bg-[#0F2C59] text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Ship className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-mono text-sky-300 font-bold uppercase tracking-wider block">
              Portal Nakhoda & Operator Kapal
            </span>
            <h1 className="text-xl font-extrabold">{selectedVessel.operatorName}</h1>
            <p className="text-xs text-sky-200">
              Pengelolaan Jadwal, GPS Tracking & Manifest Penumpang Real-Time
            </p>
          </div>
        </div>

        {/* Vessel Selector */}
        <div className="bg-sky-950/80 p-2 rounded-2xl border border-sky-800 w-full md:w-auto">
          <label className="block text-[10px] text-sky-300 font-bold uppercase mb-1">
            Pilih Kapal Terdaftar:
          </label>
          <select
            value={selectedVesselId}
            onChange={(e) => {
              setSelectedVesselId(e.target.value);
              setIsGpsActive(false);
            }}
            className="bg-sky-900 text-white text-xs font-bold px-3 py-2 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            {vessels.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.type} - Reg: {v.registrationNumber})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vessel Control Status Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-sky-600 uppercase bg-sky-50 px-2.5 py-1 rounded-md">
                  {selectedVessel.type}
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-2">{selectedVessel.name}</h2>
                <p className="text-xs text-slate-500 font-mono">Reg: {selectedVessel.registrationNumber}</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Status Terkini</span>
                <span
                  className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-black mt-1 ${
                    selectedVessel.status === 'Dalam Perjalanan'
                      ? 'bg-sky-100 text-sky-800 animate-pulse'
                      : selectedVessel.status === 'Bertambat'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedVessel.status === 'Delay'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selectedVessel.status === 'Dalam Perjalanan' && '🔵 Dalam Perjalanan'}
                  {selectedVessel.status === 'Bertambat' && '🟢 Bertambat'}
                  {selectedVessel.status === 'Delay' && '🟡 Delay'}
                  {selectedVessel.status === 'Batal' && '🔴 Batal'}
                </span>
              </div>
            </div>

            {/* Start / End Journey Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                disabled={selectedVessel.status === 'Dalam Perjalanan' || isGpsActive}
                onClick={handleStartJourney}
                className={`p-5 rounded-2xl font-extrabold text-sm flex items-center justify-center space-x-3 transition-all shadow-md ${
                  selectedVessel.status === 'Dalam Perjalanan'
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 active:scale-95'
                }`}
              >
                <Play className="w-6 h-6 fill-current" />
                <div className="text-left">
                  <div className="text-base">🟢 MULAI PERJALANAN</div>
                  <div className="text-[10px] font-normal opacity-90">
                    Aktifkan Tracking GPS & Status Berlayar
                  </div>
                </div>
              </button>

              <button
                disabled={selectedVessel.status === 'Bertambat' && !isGpsActive}
                onClick={handleEndJourney}
                className={`p-5 rounded-2xl font-extrabold text-sm flex items-center justify-center space-x-3 transition-all shadow-md ${
                  selectedVessel.status === 'Bertambat' && !isGpsActive
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30 active:scale-95'
                }`}
              >
                <Square className="w-6 h-6 fill-current" />
                <div className="text-left">
                  <div className="text-base">🔴 AKHIRI PERJALANAN</div>
                  <div className="text-[10px] font-normal opacity-90">
                    Hentikan GPS & Ubah Status Bertambat
                  </div>
                </div>
              </button>
            </div>

            {/* GPS Live Status Indicator */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isGpsActive ? 'bg-sky-500 animate-ping' : 'bg-slate-400'
                  }`}
                />
                <div>
                  <span className="font-bold text-slate-800">
                    Status GPS Tracking: {isGpsActive ? 'Aktif Mengirim Koordinat' : 'Standby / Non-Aktif'}
                  </span>
                  <div className="text-[11px] text-slate-500">
                    Posisi: {selectedVessel.currentLat.toFixed(5)}, {selectedVessel.currentLng.toFixed(5)} ({selectedVessel.speedKts} knot)
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold text-slate-400">
                Update: {selectedVessel.lastUpdated}
              </span>
            </div>

            {/* Report Delay or Cancellation Action Row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700">Laporan Kendala Pelayaran:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowDelayModal(true)}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold px-3 py-2 rounded-xl text-xs transition-colors"
                >
                  🟡 Laporkan Delay
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="bg-red-100 hover:bg-red-200 text-red-800 font-bold px-3 py-2 rounded-xl text-xs transition-colors"
                >
                  🔴 Laporkan Batal
                </button>
              </div>
            </div>
          </div>

          {/* Passenger Manifest Table */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-sky-600" />
                  <span>Manifest Penumpang Terdaftar ({manifestPassengers.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar penumpang yang memiliki tiket valid untuk perjalanan ini
                </p>
              </div>
            </div>

            {manifestPassengers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl text-xs">
                Belum ada reservasi penumpang terdaftar untuk jadwal pelayaran ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-3">Kode Booking</th>
                      <th className="p-3">Nama Penumpang</th>
                      <th className="p-3">Jumlah Orang</th>
                      <th className="p-3">Kendaraan</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {manifestPassengers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-sky-700">{m.bookingCode}</td>
                        <td className="p-3 text-slate-900 font-bold">{m.userName} ({m.userPhone})</td>
                        <td className="p-3">{m.passengersCount} Orang</td>
                        <td className="p-3">
                          {m.motorbikesCount > 0 ? `${m.motorbikesCount} Motor ` : ''}
                          {m.carsCount > 0 ? `${m.carsCount} Mobil` : ''}
                          {m.motorbikesCount === 0 && m.carsCount === 0 ? '-' : ''}
                        </td>
                        <td className="p-3">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {m.reservationStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Assigned Voyage Details Sidebar */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3">
              Jadwal Pelayaran Aktif
            </h3>

            {activeSchedule ? (
              <div className="space-y-3 text-xs">
                <div className="bg-sky-50 p-3 rounded-xl border border-sky-100 space-y-1">
                  <span className="text-[10px] text-sky-800 font-bold block uppercase">Rute</span>
                  <p className="font-bold text-slate-900 text-sm">
                    {activeSchedule.originDockName} → {activeSchedule.destinationDockName}
                  </p>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tanggal:</span>
                  <span className="font-bold text-slate-800">{activeSchedule.date}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Jam Keberangkatan:</span>
                  <span className="font-bold text-slate-800">{activeSchedule.departureTime} WITA</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Estimasi Tiba:</span>
                  <span className="font-bold text-slate-800">{activeSchedule.estimatedArrivalTime} WITA</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Kapasitas Kursi Terisi:</span>
                  <span className="font-bold text-slate-800">
                    {activeSchedule.bookedPassengers} / {activeSchedule.maxPassengers} orang
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Tidak ada jadwal aktif untuk kapal ini.</p>
            )}
          </div>
        </div>
      </div>

      {/* Delay Modal */}
      {showDelayModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 border border-slate-100 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">Laporkan Keterlambatan (Delay)</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Perkiraan Keterlambatan (Menit)</label>
              <input
                type="number"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Alasan Delay</label>
              <textarea
                rows={2}
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setShowDelayModal(false)}
                className="w-1/2 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleReportDelay}
                className="w-1/2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl text-xs"
              >
                Kirim Laporan Delay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 border border-slate-100 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">Laporkan Pembatalan Pelayaran</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Alasan Pembatalan</label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-1/2 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleReportCancel}
                className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-xs"
              >
                Kirim Pembatalan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
