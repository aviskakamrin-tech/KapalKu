import React, { useState, useEffect } from 'react';
import { User, Vessel, Dock, RouteItem, Schedule, Reservation, WeatherReport, NotificationItem, SOSReport } from './types';
import { api } from './lib/api';
import { INITIAL_VESSELS, INITIAL_DOCKS, INITIAL_ROUTES, INITIAL_SCHEDULES, INITIAL_RESERVATIONS, INITIAL_WEATHER, INITIAL_NOTIFICATIONS, INITIAL_SOS } from './data/mockData';

import { Navbar } from './components/Navbar';
import { PassengerHome } from './components/passenger/PassengerHome';
import { VesselTrackerMap } from './components/passenger/VesselTrackerMap';
import { ScheduleList } from './components/passenger/ScheduleList';
import { RouteCatalog } from './components/passenger/RouteCatalog';
import { BookingModal } from './components/passenger/BookingModal';
import { MyTickets } from './components/passenger/MyTickets';
import { WeatherPage } from './components/passenger/WeatherPage';
import { SOSModal } from './components/passenger/SOSModal';
import { LoginPage } from './components/auth/LoginPage';
import { NotificationDrawer } from './components/NotificationDrawer';

import { Home, Map, Calendar, Ticket, CloudSun, Compass, User as UserIcon, ShieldCheck } from 'lucide-react';

export default function App() {
  // Session storage ensures user is automatically logged out when closing or exiting the app
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedSession = sessionStorage.getItem('kapalku_user');
      if (savedSession) return JSON.parse(savedSession);
    } catch (e) {}
    return null;
  });

  const [autoLogoutNotice, setAutoLogoutNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(currentUser ? 'beranda' : 'login');

  // Master State
  const [vessels, setVessels] = useState<Vessel[]>(INITIAL_VESSELS);
  const [docks, setDocks] = useState<Dock[]>(INITIAL_DOCKS);
  const [routes, setRoutes] = useState<RouteItem[]>(INITIAL_ROUTES);
  const [schedules, setSchedules] = useState<Schedule[]>(INITIAL_SCHEDULES);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [weatherReports, setWeatherReports] = useState<WeatherReport[]>(INITIAL_WEATHER);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [, setSosReports] = useState<SOSReport[]>(INITIAL_SOS);

  // Modals & Search
  const [selectedBookingSchedule, setSelectedBookingSchedule] = useState<Schedule | null>(null);
  const [isBookingWizardOpen, setIsBookingWizardOpen] = useState<boolean>(false);
  const [isSOSOpen, setIsSOSOpen] = useState<boolean>(false);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [trackedVesselName, setTrackedVesselName] = useState<string | undefined>(undefined);
  const [scheduleSearchParams, setScheduleSearchParams] = useState<{
    originDockId?: string;
    destinationDockId?: string;
    travelDate?: string;
    searchTimestamp?: number;
  }>({});

  // Auto Log-Out on Exit & Inactivity (Keamanan Privasi)
  useEffect(() => {
    if (!currentUser) return;

    // 15 menit batas waktu tidak aktif
    const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
    let timerId: any = null;

    const performAutoLogout = (reason: string) => {
      setCurrentUser(null);
      try {
        sessionStorage.removeItem('kapalku_user');
        localStorage.removeItem('kapalku_user');
      } catch (e) {}
      setActiveTab('login');
      setAutoLogoutNotice(reason);
    };

    const resetTimer = () => {
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => {
        performAutoLogout('Sesi Anda telah diamankan dan ditutup otomatis karena tidak aktif selama 15 menit demi privasi Anda.');
      }, INACTIVITY_TIMEOUT_MS);
    };

    resetTimer();

    // Event listeners to detect activity
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, resetTimer, { passive: true });
    });

    // Auto logout when page or app is closed / unloaded
    const handleAppExit = () => {
      try {
        sessionStorage.removeItem('kapalku_user');
        localStorage.removeItem('kapalku_user');
      } catch (e) {}
    };

    window.addEventListener('pagehide', handleAppExit);
    window.addEventListener('beforeunload', handleAppExit);

    return () => {
      if (timerId) clearTimeout(timerId);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, resetTimer);
      });
      window.removeEventListener('pagehide', handleAppExit);
      window.removeEventListener('beforeunload', handleAppExit);
    };
  }, [currentUser]);

  const handleTrackVessel = (vesselName: string) => {
    setTrackedVesselName(vesselName);
    setActiveTab('peta');
  };

  const handleSearchSchedules = (originDockId: string, destinationDockId: string, travelDate: string) => {
    setScheduleSearchParams({
      originDockId,
      destinationDockId,
      travelDate,
      searchTimestamp: Date.now(),
    });
    setActiveTab('jadwal');
  };

  // Handlers for Auth
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setAutoLogoutNotice(null);
    try {
      sessionStorage.setItem('kapalku_user', JSON.stringify(user));
      localStorage.removeItem('kapalku_user');
    } catch (e) {}
    setIsAuthModalOpen(false);
    setActiveTab('beranda');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAutoLogoutNotice(null);
    try {
      sessionStorage.removeItem('kapalku_user');
      localStorage.removeItem('kapalku_user');
    } catch (e) {}
    setActiveTab('login');
  };

  // Initial Data Fetch & Interval Refresh
  const loadAllData = async () => {
    try {
      const [vData, dData, rData, sData, resData, wData, nData, sosData] = await Promise.all([
        api.getVessels().catch(() => INITIAL_VESSELS),
        api.getDocks().catch(() => INITIAL_DOCKS),
        api.getRoutes().catch(() => INITIAL_ROUTES),
        api.getSchedules().catch(() => INITIAL_SCHEDULES),
        api.getReservations().catch(() => INITIAL_RESERVATIONS),
        api.getWeather().catch(() => INITIAL_WEATHER),
        api.getNotifications().catch(() => INITIAL_NOTIFICATIONS),
        api.getSOS().catch(() => INITIAL_SOS),
      ]);

      if (vData) setVessels(vData);
      if (dData) setDocks(dData);
      if (rData) setRoutes(rData);
      if (sData) setSchedules(sData);
      if (resData) setReservations(resData);
      if (wData) setWeatherReports(wData);
      if (nData) setNotifications(nData);
      if (sosData) setSosReports(sosData);
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

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 font-sans flex flex-col">
      {/* If not logged in or on login tab, show ONLY the clean login/register page */}
      {!currentUser || activeTab === 'login' || activeTab === 'masuk' ? (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-3 sm:p-6 bg-gradient-to-br from-[#071E3D] via-[#0F2C59] to-[#1E3E62]">
          {autoLogoutNotice && (
            <div className="w-full max-w-md mx-auto mb-3 p-3.5 bg-sky-950/90 border border-emerald-500/50 text-emerald-100 rounded-2xl text-xs flex items-center justify-between shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="leading-snug">{autoLogoutNotice}</span>
              </div>
              <button
                onClick={() => setAutoLogoutNotice(null)}
                className="text-emerald-300 hover:text-white font-bold ml-2 text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
          <LoginPage
            currentUser={currentUser}
            onLoginSuccess={handleLoginSuccess}
          />
        </div>
      ) : (
        <>
          {/* Top Navbar */}
          <Navbar
            unreadCount={unreadNotifs}
            onOpenNotifications={() => setIsNotifOpen(true)}
            onOpenSOS={() => setIsSOSOpen(true)}
            currentUser={currentUser}
            onOpenLogin={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />

          {/* Main Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
            {activeTab === 'beranda' && (
              <PassengerHome
                docks={docks}
                schedules={schedules}
                weatherReports={weatherReports}
                reservations={reservations}
                currentUser={currentUser}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onSearchSchedules={handleSearchSchedules}
                onSelectBooking={(sch) => setSelectedBookingSchedule(sch)}
                onTrackVessel={handleTrackVessel}
              />
            )}

            {activeTab === 'peta' && (
              <VesselTrackerMap
                vessels={vessels}
                docks={docks}
                routes={routes}
                schedules={schedules}
                reservations={reservations}
                initialVesselName={trackedVesselName}
                onOpenBookingWizard={() => setIsBookingWizardOpen(true)}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'jadwal' && (
              <ScheduleList
                schedules={schedules}
                docks={docks}
                searchParams={scheduleSearchParams}
                onClearSearchParams={() => setScheduleSearchParams({})}
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
                  handleSearchSchedules(origin, dest, '');
                }}
              />
            )}

            {activeTab === 'tiket' && (
              <MyTickets
                reservations={reservations}
                onOpenBookingWizard={() => setIsBookingWizardOpen(true)}
                onRefreshReservations={loadAllData}
                onTrackVessel={handleTrackVessel}
              />
            )}

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
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-3 rounded-2xl text-sm shadow-lg shadow-red-600/30 cursor-pointer"
                >
                  Buka Menu Darurat SOS
                </button>
              </div>
            )}
          </main>

          {/* Passenger Bottom Navigation Bar */}
          <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200/90 shadow-lg py-2 px-3 sm:px-4 flex items-center justify-around">
            <button
              onClick={() => setActiveTab('beranda')}
              className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold cursor-pointer ${
                activeTab === 'beranda' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Beranda</span>
            </button>

            <button
              onClick={() => setActiveTab('peta')}
              className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold cursor-pointer ${
                activeTab === 'peta' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Map className="w-5 h-5" />
              <span>Live Map</span>
            </button>

            <button
              onClick={() => setActiveTab('jadwal')}
              className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold cursor-pointer ${
                activeTab === 'jadwal' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>Jadwal</span>
            </button>

            <button
              onClick={() => setActiveTab('rute')}
              className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold cursor-pointer ${
                activeTab === 'rute' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Compass className="w-5 h-5" />
              <span>Rute</span>
            </button>

            <button
              onClick={() => setActiveTab('tiket')}
              className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold cursor-pointer ${
                activeTab === 'tiket' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Ticket className="w-5 h-5" />
              <span>Tiket</span>
            </button>

            <button
              onClick={() => setActiveTab('cuaca')}
              className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold cursor-pointer ${
                activeTab === 'cuaca' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <CloudSun className="w-5 h-5" />
              <span>Cuaca</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex flex-col items-center space-y-0.5 text-[10px] font-bold text-red-400 hover:text-red-600 cursor-pointer"
              title="Keluar dari akun"
            >
              <UserIcon className="w-5 h-5" />
              <span>Keluar</span>
            </button>
          </nav>
        </>
      )}

      {/* Booking Modal / Wizard */}
      {(selectedBookingSchedule || isBookingWizardOpen) && (
        <BookingModal
          schedule={selectedBookingSchedule}
          docks={docks}
          routes={routes}
          allSchedules={schedules}
          currentUser={currentUser}
          onClose={() => {
            setSelectedBookingSchedule(null);
            setIsBookingWizardOpen(false);
          }}
          onConfirmBooking={handleCreateReservation}
          onSuccessViewTickets={() => {
            setSelectedBookingSchedule(null);
            setIsBookingWizardOpen(false);
            setActiveTab('tiket');
          }}
          onTrackVessel={handleTrackVessel}
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

      {/* Authentication Modal / Overlay */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <LoginPage
              currentUser={currentUser}
              onLoginSuccess={handleLoginSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
}
