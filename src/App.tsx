import React, { useState, useEffect } from 'react';
import { Role, Vessel, Dock, RouteItem, Schedule, Reservation, WeatherReport, NotificationItem, SOSReport, AuditLog } from './types';
import { api } from './lib/api';
import { INITIAL_VESSELS, INITIAL_DOCKS, INITIAL_ROUTES, INITIAL_SCHEDULES, INITIAL_RESERVATIONS, INITIAL_WEATHER, INITIAL_NOTIFICATIONS, INITIAL_SOS, INITIAL_AUDIT_LOGS } from './data/mockData';

import { Navbar } from './components/Navbar';
import { PassengerHome } from './components/passenger/PassengerHome';
import { VesselTrackerMap } from './components/passenger/VesselTrackerMap';
import { ScheduleList } from './components/passenger/ScheduleList';
import { RouteCatalog } from './components/passenger/RouteCatalog';
import { BookingModal } from './components/passenger/BookingModal';
import { MyTickets } from './components/passenger/MyTickets';
import { WeatherPage } from './components/passenger/WeatherPage';
import { SOSModal } from './components/passenger/SOSModal';
import { OperatorDashboard } from './components/operator/OperatorDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { NotificationDrawer } from './components/NotificationDrawer';

import { Home, Map, Calendar, Ticket, CloudSun, Compass } from 'lucide-react';

export default function App() {
  const [activeRole, setActiveRole] = useState<Role>('passenger');
  const [activeTab, setActiveTab] = useState<string>('beranda');

  // Master State
  const [vessels, setVessels] = useState<Vessel[]>(INITIAL_VESSELS);
  const [docks, setDocks] = useState<Dock[]>(INITIAL_DOCKS);
  const [routes, setRoutes] = useState<RouteItem[]>(INITIAL_ROUTES);
  const [schedules, setSchedules] = useState<Schedule[]>(INITIAL_SCHEDULES);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [weatherReports, setWeatherReports] = useState<WeatherReport[]>(INITIAL_WEATHER);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [sosReports, setSosReports] = useState<SOSReport[]>(INITIAL_SOS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  // Modals
  const [selectedBookingSchedule, setSelectedBookingSchedule] = useState<Schedule | null>(null);
  const [isSOSOpen, setIsSOSOpen] = useState<boolean>(false);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);

  // Initial Data Fetch & Interval Refresh
  const loadAllData = async () => {
    try {
      const [vData, dData, rData, sData, resData, wData, nData, sosData, aData] = await Promise.all([
        api.getVessels().catch(() => INITIAL_VESSELS),
        api.getDocks().catch(() => INITIAL_DOCKS),
        api.getRoutes().catch(() => INITIAL_ROUTES),
        api.getSchedules().catch(() => INITIAL_SCHEDULES),
        api.getReservations().catch(() => INITIAL_RESERVATIONS),
        api.getWeather().catch(() => INITIAL_WEATHER),
        api.getNotifications().catch(() => INITIAL_NOTIFICATIONS),
        api.getSOS().catch(() => INITIAL_SOS),
        api.getAudit().catch(() => INITIAL_AUDIT_LOGS),
      ]);

      if (vData) setVessels(vData);
      if (dData) setDocks(dData);
      if (rData) setRoutes(rData);
      if (sData) setSchedules(sData);
      if (resData) setReservations(resData);
      if (wData) setWeatherReports(wData);
      if (nData) setNotifications(nData);
      if (sosData) setSosReports(sosData);
      if (aData) setAuditLogs(aData);
    } catch (err) {
      console.warn('Backend sync warning:', err);
    }
  };

  useEffect(() => {
    loadAllData();
    const timer = setInterval(() => {
      loadAllData();
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Handlers for Operator & Admin actions
  const handleUpdateVesselStatus = async (vesselId: string, status: any) => {
    try {
      const updated = await api.updateVessel(vesselId, { status });
      setVessels((prev) => prev.map((v) => (v.id === vesselId ? updated : v)));
    } catch (err) {
      setVessels((prev) => prev.map((v) => (v.id === vesselId ? { ...v, status } : v)));
    }
  };

  const handleSendGPSUpdate = async (
    vesselId: string,
    lat: number,
    lng: number,
    speedKts: number,
    headingDeg: number,
    status?: string
  ) => {
    try {
      const res = await api.updateGPS({ vesselId, lat, lng, speedKts, headingDeg, status });
      if (res && res.vessel) {
        setVessels((prev) => prev.map((v) => (v.id === vesselId ? res.vessel : v)));
      }
    } catch (err) {
      setVessels((prev) =>
        prev.map((v) => (v.id === vesselId ? { ...v, currentLat: lat, currentLng: lng, speedKts, headingDeg } : v))
      );
    }
  };

  const handleUpdateScheduleStatus = async (scheduleId: string, status: any, reason?: string) => {
    try {
      const updated = await api.updateSchedule(scheduleId, { status, statusReason: reason });
      setSchedules((prev) => prev.map((s) => (s.id === scheduleId ? updated : s)));
    } catch (err) {
      setSchedules((prev) => prev.map((s) => (s.id === scheduleId ? { ...s, status, statusReason: reason } : s)));
    }
  };

  const handleCreateReservation = async (bookingData: any) => {
    const res = await api.createReservation(bookingData);
    setReservations((prev) => [res, ...prev]);
    loadAllData();
    return res;
  };

  const handleSendSOS = async (sosData: Partial<SOSReport>) => {
    const res = await api.sendSOS(sosData);
    setSosReports((prev) => [res, ...prev]);
    loadAllData();
    return res;
  };

  const handleAddVessel = async (vData: Partial<Vessel>) => {
    const res = await api.createVessel(vData);
    setVessels((prev) => [res, ...prev]);
  };

  const handleUpdateWeather = async (id: string, wData: Partial<WeatherReport>) => {
    const res = await api.updateWeather(id, wData);
    setWeatherReports((prev) => prev.map((w) => (w.id === id ? res : w)));
  };

  const handleResolveSOS = async (id: string, status: any) => {
    const res = await api.updateSOS(id, { status });
    setSosReports((prev) => prev.map((s) => (s.id === id ? res : s)));
  };

  const handleBroadcastNotif = async (title: string, message: string, type: any) => {
    const res = await api.createNotification({ title, message, type, userId: 'all' });
    setNotifications((prev) => [res, ...prev]);
  };

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 font-sans flex flex-col">
      {/* Top Navbar */}
      <Navbar
        activeRole={activeRole}
        onRoleChange={(role) => setActiveRole(role)}
        unreadCount={unreadNotifs}
        onOpenNotifications={() => setIsNotifOpen(true)}
        onOpenSOS={() => setIsSOSOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Passenger Mode Views */}
        {activeRole === 'passenger' && (
          <>
            {activeTab === 'beranda' && (
              <PassengerHome
                docks={docks}
                schedules={schedules}
                weatherReports={weatherReports}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onSearchSchedules={() => setActiveTab('jadwal')}
                onSelectBooking={(sch) => setSelectedBookingSchedule(sch)}
              />
            )}

            {activeTab === 'peta' && (
              <VesselTrackerMap vessels={vessels} docks={docks} routes={routes} />
            )}

            {activeTab === 'jadwal' && (
              <ScheduleList
                schedules={schedules}
                docks={docks}
                onSelectBooking={(sch) => setSelectedBookingSchedule(sch)}
              />
            )}

            {activeTab === 'rute' && (
              <RouteCatalog
                routes={routes}
                docks={docks}
                weatherReports={weatherReports}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onSearchSchedules={(origin, dest) => {
                  setActiveTab('jadwal');
                }}
              />
            )}

            {activeTab === 'tiket' && <MyTickets reservations={reservations} />}

            {activeTab === 'cuaca' && <WeatherPage reports={weatherReports} />}

            {activeTab === 'sos' && (
              <div className="bg-white p-6 rounded-3xl border border-red-200 text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  🚨
                </div>
                <h2 className="text-xl font-bold">Panggilan Darurat SOS Pelayaran</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tekan tombol di bawah ini jika Anda berada dalam situasi darurat di atas kapal atau di perairan.
                </p>
                <button
                  onClick={() => setIsSOSOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-3 rounded-2xl text-sm shadow-lg shadow-red-600/30"
                >
                  Buka Menu Darurat SOS
                </button>
              </div>
            )}
          </>
        )}

        {/* Operator Mode View */}
        {activeRole === 'operator' && (
          <OperatorDashboard
            vessels={vessels}
            schedules={schedules}
            reservations={reservations}
            onUpdateVesselStatus={handleUpdateVesselStatus}
            onSendGPSUpdate={handleSendGPSUpdate}
            onUpdateScheduleStatus={handleUpdateScheduleStatus}
          />
        )}

        {/* Admin Syahbandar Mode View */}
        {activeRole === 'admin' && (
          <AdminDashboard
            vessels={vessels}
            docks={docks}
            routes={routes}
            schedules={schedules}
            reservations={reservations}
            weatherReports={weatherReports}
            sosReports={sosReports}
            auditLogs={auditLogs}
            onAddVessel={handleAddVessel}
            onAddDock={async () => {}}
            onAddRoute={async () => {}}
            onAddSchedule={async () => {}}
            onUpdateWeather={handleUpdateWeather}
            onResolveSOS={handleResolveSOS}
            onBroadcastNotif={handleBroadcastNotif}
          />
        )}
      </main>

      {/* Passenger Bottom Navigation Bar (for mobile & quick tab access) */}
      {activeRole === 'passenger' && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200/90 shadow-lg py-2 px-4 flex items-center justify-around">
          <button
            onClick={() => setActiveTab('beranda')}
            className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold ${
              activeTab === 'beranda' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Beranda</span>
          </button>

          <button
            onClick={() => setActiveTab('peta')}
            className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold ${
              activeTab === 'peta' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Map className="w-5 h-5" />
            <span>Peta</span>
          </button>

          <button
            onClick={() => setActiveTab('jadwal')}
            className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold ${
              activeTab === 'jadwal' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>Jadwal</span>
          </button>

          <button
            onClick={() => setActiveTab('rute')}
            className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold ${
              activeTab === 'rute' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span>Rute</span>
          </button>

          <button
            onClick={() => setActiveTab('tiket')}
            className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold ${
              activeTab === 'tiket' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Ticket className="w-5 h-5" />
            <span>Tiket Saya</span>
          </button>

          <button
            onClick={() => setActiveTab('cuaca')}
            className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold ${
              activeTab === 'cuaca' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <CloudSun className="w-5 h-5" />
            <span>Cuaca</span>
          </button>
        </nav>
      )}

      {/* Booking Modal */}
      {selectedBookingSchedule && (
        <BookingModal
          schedule={selectedBookingSchedule}
          onClose={() => setSelectedBookingSchedule(null)}
          onConfirmBooking={handleCreateReservation}
          onSuccessViewTickets={() => setActiveTab('tiket')}
        />
      )}

      {/* SOS Emergency Modal */}
      {isSOSOpen && (
        <SOSModal onClose={() => setIsSOSOpen(false)} onSendSOS={handleSendSOS} />
      )}

      {/* Notifications Drawer */}
      <NotificationDrawer
        notifications={notifications}
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />
    </div>
  );
}
