import React, { useState, useEffect } from 'react';
import {
  Vessel,
  Dock,
  RouteItem,
  Schedule,
  Reservation,
  WeatherReport,
  SOSReport,
  AuditLog,
  User,
} from '../../types';
import { api } from '../../lib/api';
import {
  Ship,
  Anchor,
  Navigation,
  Calendar,
  Ticket,
  Map,
  CloudSun,
  ShieldAlert,
  Bell,
  Users,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  X,
  Radio,
  ScanLine,
  UserPlus,
  Search,
  Check,
  Building2,
  Lock,
  Phone,
  Mail,
} from 'lucide-react';

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

  // Scanner State
  const [scanCodeInput, setScanCodeInput] = useState<string>('');
  const [scannedResult, setScannedResult] = useState<{
    valid: boolean;
    reservation?: Reservation;
    message: string;
  } | null>(null);
  const [isCheckingTicket, setIsCheckingTicket] = useState<boolean>(false);
  const [checkInStatusMsg, setCheckInStatusMsg] = useState<string | null>(null);

  // User Management State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserPhone, setNewUserPhone] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<'passenger' | 'operator' | 'admin'>('passenger');
  const [newUserAgency, setNewUserAgency] = useState<string>('');
  const [newUserNIP, setNewUserNIP] = useState<string>('');
  const [userRegisterMsg, setUserRegisterMsg] = useState<string>('');

  // Modals state
  const [showVesselModal, setShowVesselModal] = useState<boolean>(false);
  const [newVesselName, setNewVesselName] = useState<string>('');
  const [newVesselType, setNewVesselType] = useState<any>('Feri');
  const [newVesselReg, setNewVesselReg] = useState<string>('');
  const [newVesselCap, setNewVesselCap] = useState<number>(30);

  // Route Modal
  const [showRouteModal, setShowRouteModal] = useState<boolean>(false);
  const [newRouteName, setNewRouteName] = useState<string>('');
  const [newRouteOriginId, setNewRouteOriginId] = useState<string>('');
  const [newRouteDestId, setNewRouteDestId] = useState<string>('');
  const [newRouteTariff, setNewRouteTariff] = useState<number>(25000);
  const [newRouteDuration, setNewRouteDuration] = useState<number>(45);

  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [notifTitle, setNotifTitle] = useState<string>('');
  const [notifMessage, setNotifMessage] = useState<string>('');

  const sailingVessels = vessels.filter((v) => v.status === 'Dalam Perjalanan').length;
  const delayedVessels =
    vessels.filter((v) => v.status === 'Delay').length +
    schedules.filter((s) => s.status === 'delayed').length;
  const cancelledVessels =
    vessels.filter((v) => v.status === 'Batal').length +
    schedules.filter((s) => s.status === 'cancelled').length;
  const openSOS = sosReports.filter((s) => s.status !== 'Selesai').length;

  // Fetch users list
  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsersList(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Handle Validate / Scan Ticket
  const handleValidateTicket = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scanCodeInput.trim()) return;

    setIsCheckingTicket(true);
    setCheckInStatusMsg(null);
    try {
      const res = await api.validateTicket(scanCodeInput.trim());
      setScannedResult(res);
    } catch (err: any) {
      setScannedResult({
        valid: false,
        message: err.message || 'Tiket tidak ditemukan di database.',
      });
    } finally {
      setIsCheckingTicket(false);
    }
  };

  // Handle Boarding Check-in
  const handleCheckInTicket = async (code: string) => {
    setIsCheckingTicket(true);
    try {
      const res = await api.checkInTicket(code, 'Drs. Hendra (Syahbandar)');
      setCheckInStatusMsg(res.message);
      setScannedResult((prev) =>
        prev
          ? {
              ...prev,
              reservation: res.reservation,
              message: '✅ Berhasil Check-In! Penumpang dipersilakan menuju ke kapal.',
            }
          : null
      );
    } catch (err: any) {
      setCheckInStatusMsg(err.message || 'Gagal melakukan check-in');
    } finally {
      setIsCheckingTicket(false);
    }
  };

  // Handle Create User Account
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserRegisterMsg('');
    try {
      const res = await api.register({
        name: newUserName,
        email: newUserEmail,
        phone: newUserPhone,
        password: 'password123',
        role: newUserRole,
        agencyOrVessel: newUserAgency || undefined,
        nipOrLicense: newUserNIP || undefined,
      });

      setUserRegisterMsg(`✅ Akun ${res.user.name} (${res.user.role}) berhasil didaftarkan!`);
      loadUsers();
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPhone('');
      setNewUserAgency('');
      setNewUserNIP('');
      setTimeout(() => {
        setShowAddUserModal(false);
        setUserRegisterMsg('');
      }, 1500);
    } catch (err: any) {
      setUserRegisterMsg(`❌ ${err.message || 'Gagal mendaftarkan akun'}`);
    }
  };

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
      currentLng: 116.819,
    });
    setNewVesselName('');
    setShowVesselModal(false);
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    const originDock = docks.find((d) => d.id === newRouteOriginId);
    const destDock = docks.find((d) => d.id === newRouteDestId);
    if (!originDock || !destDock) return;

    await onAddRoute({
      name: newRouteName || `${originDock.name} - ${destDock.name}`,
      originDockId: originDock.id,
      originDockName: originDock.name,
      destinationDockId: destDock.id,
      destinationDockName: destDock.name,
      distanceKm: 25,
      estimatedDurationMinutes: newRouteDuration,
      tariffPassenger: newRouteTariff,
      tariffMotorbike: Math.round(newRouteTariff * 0.8),
      tariffCar: Math.round(newRouteTariff * 3.5),
      status: 'Operasional',
      region: originDock.region || 'Kalimantan',
    });
    setShowRouteModal(false);
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
              Pengawasan Keselamatan Pelayaran, Persetujuan SPB, Validasi Tiket & Pendaftaran Akun
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('scanner')}
            className="bg-sky-500 hover:bg-sky-400 text-white font-extrabold px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            <span>Scan QR Gate</span>
          </button>
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span>Kirim Pengumuman</span>
          </button>
        </div>
      </div>

      {/* Admin Submenu Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto flex items-center space-x-1">
        {[
          { id: 'dashboard', label: '1. Dashboard', icon: Anchor },
          { id: 'scanner', label: '2. Pemindai Tiket QR', icon: ScanLine },
          { id: 'users', label: '3. Akun Pengguna', icon: Users },
          { id: 'kapal', label: '4. Data Kapal', icon: Ship },
          { id: 'dermaga', label: '5. Data Dermaga', icon: Map },
          { id: 'rute', label: '6. Data Rute', icon: Navigation },
          { id: 'jadwal', label: '7. Jadwal', icon: Calendar },
          { id: 'reservasi', label: '8. Reservasi', icon: Ticket },
          { id: 'cuaca', label: '9. Cuaca & Gelombang', icon: CloudSun },
          { id: 'sos', label: `10. Laporan SOS (${openSOS})`, icon: ShieldAlert },
          { id: 'audit', label: '11. Audit Log', icon: FileText },
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
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Reservasi</span>
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

          {/* Quick Scanner Box on Dashboard */}
          <div className="bg-gradient-to-br from-[#0F2C59] to-[#1E40AF] p-6 rounded-3xl text-white shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold flex items-center space-x-2">
                  <ScanLine className="w-5 h-5 text-sky-400" />
                  <span>Gerbang Pemindai Tiket & Boarding Gate</span>
                </h3>
                <p className="text-xs text-sky-200 mt-0.5">
                  Masukkan kode booking atau scan QR Code boarding pass calon penumpang.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('scanner')}
                className="py-2 px-4 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold"
              >
                Buka Pemindai Penuh
              </button>
            </div>
          </div>

          {/* Active Vessels Status Table */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base">Monitoring Status Kapal Real-time</h3>
              <button
                onClick={() => setShowVesselModal(true)}
                className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kapal</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 font-semibold text-[10px]">
                  <tr>
                    <th className="p-3">Nama Kapal</th>
                    <th className="p-3">Tipe</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Kecepatan</th>
                    <th className="p-3">Nakhoda</th>
                    <th className="p-3">Koordinat GPS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vessels.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{v.name}</td>
                      <td className="p-3">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600">
                          {v.type}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            v.status === 'Dalam Perjalanan'
                              ? 'bg-emerald-100 text-emerald-800'
                              : v.status === 'Delay'
                              ? 'bg-amber-100 text-amber-800'
                              : v.status === 'Batal'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono">{v.speedKts} kts</td>
                      <td className="p-3 text-slate-600">{v.operatorName}</td>
                      <td className="p-3 font-mono text-[10px] text-slate-500">
                        {v.currentLat.toFixed(4)}, {v.currentLng.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Pemindai Tiket & QR Code Scanner */}
      {activeTab === 'scanner' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center space-x-2">
                <ScanLine className="w-5 h-5 text-sky-600" />
                <span>Pemindai Tiket & Validasi Boarding Gate</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Gunakan scanner barcode / kamera atau masukkan Kode Booking untuk memverifikasi tiket penumpang.
              </p>
            </div>

            {/* Search Input Box */}
            <form onSubmit={handleValidateTicket} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={scanCodeInput}
                  onChange={(e) => setScanCodeInput(e.target.value)}
                  placeholder="Scan atau ketik Kode Booking (mis: KK-20260818-1234)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={isCheckingTicket}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {isCheckingTicket ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ScanLine className="w-4 h-4" />
                    <span>Verifikasi</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Test Codes */}
            {reservations.length > 0 && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[11px] text-slate-500 font-bold">Kode Sampel Cepat:</span>
                {reservations.slice(0, 4).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setScanCodeInput(r.bookingCode);
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-sky-100 text-sky-800 rounded-lg text-[11px] font-mono font-bold border border-slate-200"
                  >
                    {r.bookingCode} ({r.userName.split(' ')[0]})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Validation Result Box */}
          {scannedResult && (
            <div
              className={`p-6 rounded-3xl border shadow-md space-y-4 animate-in zoom-in-95 duration-200 ${
                scannedResult.valid
                  ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-200'
                  : 'bg-red-50 border-red-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
                      scannedResult.valid ? 'bg-emerald-600' : 'bg-red-600'
                    }`}
                  >
                    {scannedResult.valid ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">
                      {scannedResult.valid ? 'Tiket Valid & Terverifikasi' : 'Tiket Tidak Valid'}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">{scannedResult.message}</p>
                  </div>
                </div>

                {scannedResult.reservation && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      scannedResult.reservation.checkInStatus === 'Sudah Check-In (Boarded)'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {scannedResult.reservation.checkInStatus || 'Belum Check-In'}
                  </span>
                )}
              </div>

              {/* Scanned Reservation Details */}
              {scannedResult.reservation && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">KODE BOOKING</span>
                      <span className="font-mono font-black text-sky-800 text-sm">
                        {scannedResult.reservation.bookingCode}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">NAMA KAPAL</span>
                      <span className="font-bold text-slate-900">{scannedResult.reservation.vesselName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">RUTE DERMAGA</span>
                      <span className="font-bold text-slate-900 truncate block">
                        {scannedResult.reservation.originDockName} → {scannedResult.reservation.destinationDockName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">JADWAL KEBERANGKATAN</span>
                      <span className="font-bold text-slate-900">
                        {scannedResult.reservation.travelDate} ({scannedResult.reservation.departureTime})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">PENANGGUNG JAWAB</span>
                      <span className="font-bold text-slate-900">
                        {scannedResult.reservation.userName} ({scannedResult.reservation.userPhone})
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">JUMLAH PENUMPANG</span>
                      <span className="font-bold text-slate-900">
                        {scannedResult.reservation.passengersCount} Orang
                        {scannedResult.reservation.motorbikesCount > 0 ? ` + ${scannedResult.reservation.motorbikesCount} Motor` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">PINTU GATE</span>
                      <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {scannedResult.reservation.gateNumber || 'GATE 1A'}
                      </span>
                    </div>
                  </div>

                  {checkInStatusMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl font-bold">
                      {checkInStatusMsg}
                    </div>
                  )}

                  {/* Check-in Button */}
                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleCheckInTicket(scannedResult.reservation!.bookingCode)}
                      disabled={
                        isCheckingTicket ||
                        scannedResult.reservation.checkInStatus === 'Sudah Check-In (Boarded)'
                      }
                      className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {scannedResult.reservation.checkInStatus === 'Sudah Check-In (Boarded)'
                          ? 'Sudah Boarding'
                          : 'Proses Check-In & Izinkan Naik Kapal'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Manajemen Akun Pengguna & Pendaftaran Baru */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center space-x-2">
                <Users className="w-5 h-5 text-sky-600" />
                <span>Daftar Akun Pengguna Maritim</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola hak akses untuk Penumpang, Operator Kapal / Nakhoda, dan Syahbandar Pelabuhan.
              </p>
            </div>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftarkan Akun Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 font-semibold text-[10px]">
                <tr>
                  <th className="p-3">Nama Pengguna</th>
                  <th className="p-3">Email / Kontak</th>
                  <th className="p-3">Peran (Role)</th>
                  <th className="p-3">Kapal / Instansi</th>
                  <th className="p-3">NIP / No Ijazah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900 flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="p-3 text-slate-600">
                      <div>{u.email}</div>
                      <div className="text-[10px] text-slate-400">{u.phone}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-amber-100 text-amber-800'
                            : u.role === 'operator'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role === 'admin'
                          ? 'Syahbandar (Admin)'
                          : u.role === 'operator'
                          ? 'Nakhoda (Operator)'
                          : 'Penumpang'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{u.agencyOrVessel || '-'}</td>
                    <td className="p-3 font-mono text-slate-500">{u.nipOrLicense || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 4: Data Kapal */}
      {activeTab === 'kapal' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-900 text-base">Database Armada Kapal Nusantara</h3>
            <button
              onClick={() => setShowVesselModal(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kapal</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vessels.map((v) => (
              <div key={v.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
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
                  <div>
                    <strong>Kapasitas:</strong> {v.capacityPassengers} Orang, {v.capacityMotorbikes} Motor
                  </div>
                  <div>
                    <strong>Nakhoda:</strong> {v.operatorName} ({v.operatorPhone})
                  </div>
                  <div>
                    <strong>Status:</strong> <span className="font-bold">{v.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 6: Data Rute */}
      {activeTab === 'rute' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Rute Pelayaran Antar-Pulau & Sungai</h3>
              <p className="text-xs text-slate-500">Kelola trayek resmi dan tarif batas atas Kemenhub</p>
            </div>
            <button
              onClick={() => setShowRouteModal(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Rute</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {routes.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div className="flex justify-between items-start font-bold text-slate-900 text-sm">
                  <span>{r.name}</span>
                  <span className="text-sky-700">Rp {r.tariffPassenger.toLocaleString('id-ID')}</span>
                </div>
                <div className="text-slate-500 space-y-0.5 text-[11px]">
                  <div>Asal: {r.originDockName}</div>
                  <div>Tujuan: {r.destinationDockName}</div>
                  <div>Estimasi Durasi: {r.estimatedDurationMinutes} Menit ({r.distanceKm} km)</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 7: Jadwal */}
      {activeTab === 'jadwal' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base">Jadwal Keberangkatan Pelayaran</h3>
          <div className="space-y-2">
            {schedules.map((s) => (
              <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900">{s.vesselName}</span>
                  <span className="text-slate-500 block">{s.originDockName} → {s.destinationDockName} ({s.departureTime})</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sky-700">Rp {s.tariffPassenger.toLocaleString('id-ID')}</span>
                  <span className="text-[10px] text-slate-400 block">Terisi: {s.bookedPassengers}/{s.maxPassengers}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 8: Reservasi */}
      {activeTab === 'reservasi' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base">Daftar Tiket & Reservasi Masuk</h3>
          <div className="space-y-3">
            {reservations.map((r) => (
              <div key={r.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded">{r.bookingCode}</span>
                    <span className="font-bold text-slate-900">{r.vesselName}</span>
                  </div>
                  <div className="text-slate-600">
                    Pemesan: <strong>{r.userName}</strong> ({r.userPhone}) | {r.passengersCount} Orang
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    {r.originDockName} → {r.destinationDockName} ({r.travelDate})
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="font-bold text-sky-700">Rp {r.totalPrice.toLocaleString('id-ID')}</div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.checkInStatus === 'Sudah Check-In (Boarded)'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {r.checkInStatus || 'Belum Check-In'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 9: Cuaca BMKG */}
      {activeTab === 'cuaca' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base">Kelola Peringatan Cuaca BMKG</h3>
          <p className="text-xs text-slate-500">Perbarui status keselamatan perairan dan himbauan resmi Syahbandar</p>
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

      {/* Tab Content 10: SOS Emergency */}
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
                  <div><strong>Keterangan:</strong> {s.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 11: Audit Log */}
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

      {/* Modal Add User */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateUser} className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-sky-600" />
                <span>Daftarkan Akun Pengguna Baru</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {userRegisterMsg && (
              <div className="p-3 bg-slate-100 border border-slate-200 text-xs rounded-xl font-bold">
                {userRegisterMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Peran Akun (Role)</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
              >
                <option value="passenger">Penumpang Umum</option>
                <option value="operator">Nakhoda / Operator Kapal</option>
                <option value="admin">Syahbandar / Otoritas Pelabuhan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="mis: Capt. Hasan Basri"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email / Kontak</label>
              <input
                type="email"
                required
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="hasan@maritim.id"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
              <input
                type="text"
                required
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
                placeholder="0812-3456-7890"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
              />
            </div>

            {newUserRole === 'operator' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kapal yang Dikelola</label>
                <input
                  type="text"
                  value={newUserAgency}
                  onChange={(e) => setNewUserAgency(e.target.value)}
                  placeholder="mis: KM Borneo Express 01"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                />
              </div>
            )}

            {newUserRole === 'admin' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kantor KSOP / UPP</label>
                <input
                  type="text"
                  value={newUserAgency}
                  onChange={(e) => setNewUserAgency(e.target.value)}
                  placeholder="mis: KSOP Kelas I Balikpapan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                />
              </div>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="w-1/2 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="w-1/2 bg-sky-600 text-white font-bold py-3 rounded-xl text-xs"
              >
                Daftarkan Akun
              </button>
            </div>
          </form>
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
                placeholder="mis: KM Express Bahari 9C"
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
                <option value="Feri">Feri Ro-Ro ASDP</option>
                <option value="Speedboat">Speedboat Cepat</option>
                <option value="Kapal Perintis">Kapal Perintis PELNI</option>
                <option value="Klotok">Klotok Tradisional</option>
              </select>
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

      {/* Modal Add Route */}
      {showRouteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateRoute} className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base">Tambah Rute Pelayaran Baru</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dermaga Asal</label>
              <select
                required
                value={newRouteOriginId}
                onChange={(e) => setNewRouteOriginId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
              >
                <option value="">Pilih Dermaga Asal</option>
                {docks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dermaga Tujuan</label>
              <select
                required
                value={newRouteDestId}
                onChange={(e) => setNewRouteDestId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
              >
                <option value="">Pilih Dermaga Tujuan</option>
                {docks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tarif Penumpang (Rp)</label>
              <input
                type="number"
                value={newRouteTariff}
                onChange={(e) => setNewRouteTariff(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRouteModal(false)}
                className="w-1/2 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="w-1/2 bg-sky-600 text-white font-bold py-3 rounded-xl text-xs"
              >
                Simpan Rute
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
                placeholder="mis: ⚠️ Himbauan Penundaan Pelayaran Selat Sunda"
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
