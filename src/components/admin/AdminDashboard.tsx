import React, { useState } from 'react';
import { Vessel, Dock, RouteItem, Schedule, Reservation, WeatherReport, SOSReport, AuditLog } from '../../types';
import { Ship, Anchor, Navigation, Calendar, Ticket, Map, CloudSun, ShieldAlert, Bell, Users, FileText, CheckCircle2, AlertTriangle, Plus, RefreshCw, X, Radio } from 'lucide-react';

interface AdminDashboardProps {
  vessels: Vessel[];
  docks: Dock[];
  routes: RouteItem[];
  schedules: Schedule[];
  reservations: Reservation[];
  weatherReports: WeatherReport[];
  sosReports: SOSReport[];
  auditLogs: AuditLog[];
  onAddVessel: (data: Partial<Vessel>) => Promise<void>;
  onAddDock: (data: Partial<Dock>) => Promise<void>;
  onAddRoute: (data: Partial<RouteItem>) => Promise<void>;
  onAddSchedule: (data: Partial<Schedule>) => Promise<void>;
  onUpdateWeather: (id: string, data: Partial<WeatherReport>) => Promise<void>;
  onResolveSOS: (id: string, status: 'Baru' | 'Dalam Penanganan' | 'Selesai') => Promise<void>;
  onBroadcastNotif: (title: string, message: string, type: any) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  vessels,
  docks,
  routes,
  schedules,
  reservations,
  weatherReports,
  sosReports,
  auditLogs,
  onAddVessel,
  onAddDock,
  onAddRoute,
  onAddSchedule,
  onUpdateWeather,
  onResolveSOS,
  onBroadcastNotif,
}) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals state
  const [showVesselModal, setShowVesselModal] = useState<boolean>(false);
  const [newVesselName, setNewVesselName] = useState<string>('');
  const [newVesselType, setNewVesselType] = useState<any>('Feri');
  const [newVesselReg, setNewVesselReg] = useState<string>('');
  const [newVesselCap, setNewVesselCap] = useState<number>(30);

  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [notifTitle, setNotifTitle] = useState<string>('');
  const [notifMessage, setNotifMessage] = useState<string>('');

  const sailingVessels = vessels.filter((v) => v.status === 'Dalam Perjalanan').length;
  const delayedVessels = vessels.filter((v) => v.status === 'Delay').length + schedules.filter((s) => s.status === 'delayed').length;
  const cancelledVessels = vessels.filter((v) => v.status === 'Batal').length + schedules.filter((s) => s.status === 'cancelled').length;
  const openSOS = sosReports.filter((s) => s.status !== 'Selesai').length;

  const handleCreateVessel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVesselName) return;
    await onAddVessel({
      name: newVesselName,
      type: newVesselType,
      registrationNumber: newVesselReg || `KPL-${Date.now().toString().slice(-4)}`,
      capacityPassengers: newVesselCap,
      capacityMotorbikes: 10,
      capacityCars: 2,
      status: 'Bertambat',
      operatorName: 'Captain Syahbandar',
      operatorPhone: '0811-0000-1111',
      speedKts: 0,
      headingDeg: 0,
      currentLat: -1.2721,
      currentLng: 116.8190,
    });
    setNewVesselName('');
    setShowVesselModal(false);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) return;
    await onBroadcastNotif(notifTitle, notifMessage, 'weather');
    setNotifTitle('');
    setNotifMessage('');
    setShowBroadcastModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Admin Top Header */}
      <div className="bg-[#0F2C59] text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg">
            🛡️
          </div>
          <div>
            <span className="text-xs font-mono text-sky-300 font-bold uppercase tracking-wider block">
              Sistem Informasi Syahbandar & Otoritas Pelabuhan
            </span>
            <h1 className="text-xl font-extrabold">Drs. Hendra Syahbandar</h1>
            <p className="text-xs text-sky-200">
              Pengawasan Keselamatan Pelayaran, Persetujuan SPB & Tanggap Darurat Laut
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowBroadcastModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95"
        >
          <Bell className="w-4 h-4" />
          <span>Kirim Pengumuman Syahbandar</span>
        </button>
      </div>

      {/* Admin Submenu Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto flex items-center space-x-1">
        {[
          { id: 'dashboard', label: '1. Dashboard', icon: Anchor },
          { id: 'kapal', label: '2. Data Kapal', icon: Ship },
          { id: 'dermaga', label: '3. Data Dermaga', icon: Map },
          { id: 'rute', label: '4. Data Rute', icon: Navigation },
          { id: 'jadwal', label: '5. Jadwal', icon: Calendar },
          { id: 'reservasi', label: '6. Reservasi', icon: Ticket },
          { id: 'cuaca', label: '7. Cuaca & Gelombang', icon: CloudSun },
          { id: 'sos', label: `8. Laporan SOS (${openSOS})`, icon: ShieldAlert },
          { id: 'audit', label: '9. Audit Log', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content 1: Overview Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Armada Aktif</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{vessels.length} Kapal</div>
              <span className="text-[10px] text-emerald-600 font-semibold">{sailingVessels} Berlayar</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Reservasi Hari Ini</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{reservations.length} Tiket</div>
              <span className="text-[10px] text-sky-600 font-semibold">Terkonfirmasi</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Kendala Pelayaran</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{delayedVessels} Delay</div>
              <span className="text-[10px] text-red-500 font-semibold">{cancelledVessels} Batal</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-sm bg-red-50/20">
              <span className="text-[10px] text-red-600 font-bold block uppercase">Panggilan SOS Aktif</span>
              <div className="text-2xl font-black text-red-600 mt-1">{openSOS} Panggilan</div>
              <span className="text-[10px] text-red-700 font-bold">Penanganan Darurat</span>
            </div>
          </div>

          {/* Active Vessels Status Table */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base">Monitoring Armada & Status Pelayaran</h3>
              <button
                onClick={() => setShowVesselModal(true)}
                className="bg-sky-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kapal</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">Nama Kapal</th>
                    <th className="p-3">Jenis</th>
                    <th className="p-3">Registrasi</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Kecepatan</th>
                    <th className="p-3">Update Terakhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {vessels.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{v.name}</td>
                      <td className="p-3">{v.type}</td>
                      <td className="p-3 font-mono text-slate-500">{v.registrationNumber}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            v.status === 'Dalam Perjalanan'
                              ? 'bg-sky-100 text-sky-800'
                              : v.status === 'Bertambat'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="p-3">{v.speedKts} knot</td>
                      <td className="p-3 text-slate-500">{v.lastUpdated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Data Kapal */}
      {activeTab === 'kapal' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-900 text-base">Master Data Kapal & Operator</h3>
            <button
              onClick={() => setShowVesselModal(true)}
              className="bg-sky-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Data Kapal</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vessels.map((v) => (
              <div key={v.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">{v.name}</h4>
                    <span className="text-[10px] font-mono text-slate-500">{v.registrationNumber}</span>
                  </div>
                  <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    {v.type}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div><strong>Kapasitas:</strong> {v.capacityPassengers} Orang, {v.capacityMotorbikes} Motor</div>
                  <div><strong>Nakhoda:</strong> {v.operatorName} ({v.operatorPhone})</div>
                  <div><strong>Status:</strong> <span className="font-bold">{v.status}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 7: Cuaca & Gelombang */}
      {activeTab === 'cuaca' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base">Kelola Peringatan Cuaca BMKG</h3>
          <p className="text-xs text-slate-500">
            Perbarui status keselamatan perairan dan himbauan resmi Syahbandar
          </p>

          <div className="space-y-4">
            {weatherReports.map((w) => (
              <div key={w.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 text-xs">
                <div className="flex justify-between items-center font-bold text-slate-900 text-sm">
                  <span>Rute: {w.routeName}</span>
                  <select
                    value={w.status}
                    onChange={(e) => onUpdateWeather(w.id, { status: e.target.value as any })}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold"
                  >
                    <option value="Aman">🟢 Aman</option>
                    <option value="Waspada">🟡 Waspada</option>
                    <option value="Siaga">🟠 Siaga</option>
                    <option value="Berbahaya">🔴 Berbahaya</option>
                  </select>
                </div>
                <p className="text-slate-600">{w.officialAdvice}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 8: Laporan SOS Emergency Queue */}
      {activeTab === 'sos' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base text-red-600 flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <span>Pusat Tanggap Darurat SOS Laut ({sosReports.length})</span>
          </h3>

          <div className="space-y-4">
            {sosReports.map((s) => (
              <div
                key={s.id}
                className={`p-5 rounded-2xl border space-y-3 ${
                  s.status === 'Baru'
                    ? 'border-red-400 bg-red-50/60 ring-1 ring-red-300'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-red-600 bg-white px-2 py-0.5 rounded border border-red-200">
                      {s.emergencyType}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-base mt-1">
                      Pelapor: {s.userName} ({s.userPhone})
                    </h4>
                  </div>

                  <select
                    value={s.status}
                    onChange={(e) => onResolveSOS(s.id, e.target.value as any)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold"
                  >
                    <option value="Baru">🔴 Baru</option>
                    <option value="Dalam Penanganan">🟡 Dalam Penanganan</option>
                    <option value="Selesai">🟢 Selesai</option>
                  </select>
                </div>

                <div className="text-xs text-slate-700 space-y-1">
                  <div><strong>Kapal / Lokasi:</strong> {s.vesselName}</div>
                  <div><strong>Koordinat GPS:</strong> {s.lat.toFixed(5)}, {s.lng.toFixed(5)}</div>
                  <div><strong>Keterangan:</strong> {s.description}</div>
                  <div className="text-[10px] text-slate-400">Waktu: {s.createdAt}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 9: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base">Audit Log Aktivitas Syahbandar & Operator</h3>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between">
                <div>
                  <span className="font-bold text-slate-900">{log.actorName}</span>{' '}
                  <span className="text-slate-500">({log.action}): {log.details}</span>
                </div>
                <span className="font-mono text-slate-400 text-[10px]">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Add Vessel */}
      {showVesselModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateVessel} className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base">Tambah Data Kapal Baru</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kapal</label>
              <input
                type="text"
                required
                value={newVesselName}
                onChange={(e) => setNewVesselName(e.target.value)}
                placeholder="mis: KM Borneo Express 02"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kapal</label>
              <select
                value={newVesselType}
                onChange={(e) => setNewVesselType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
              >
                <option value="Klotok">Klotok</option>
                <option value="Speedboat">Speedboat</option>
                <option value="Feri">Feri Tradisional</option>
                <option value="Kapal Perintis">Kapal Perintis</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Registrasi / Pas Kecil</label>
              <input
                type="text"
                value={newVesselReg}
                onChange={(e) => setNewVesselReg(e.target.value)}
                placeholder="mis: KPL-BPN-2026-99"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kapasitas Penumpang (Orang)</label>
              <input
                type="number"
                value={newVesselCap}
                onChange={(e) => setNewVesselCap(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowVesselModal(false)}
                className="w-1/2 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="w-1/2 bg-sky-600 text-white font-bold py-3 rounded-xl text-xs"
              >
                Simpan Kapal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Broadcast Notification */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSendBroadcast} className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base">Kirim Pengumuman Syahbandar</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Judul Pengumuman</label>
              <input
                type="text"
                required
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="mis: ⚠️ Himbauan Penundaan Pelayaran"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Isi Pesan Notifikasi</label>
              <textarea
                rows={3}
                required
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                placeholder="Tuliskan pengumuman resmi..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="w-1/2 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="w-1/2 bg-amber-500 text-slate-950 font-bold py-3 rounded-xl text-xs"
              >
                Kirim Pengumuman
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
