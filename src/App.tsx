import React, { useState, useEffect } from 'react';
import { User, Role, Vessel, Dock, RouteItem, Schedule, Reservation, WeatherReport, NotificationItem } from './types';
import { api } from './lib/api';
import { INITIAL_USERS, INITIAL_VESSELS, INITIAL_DOCKS, INITIAL_ROUTES, INITIAL_SCHEDULES, INITIAL_RESERVATIONS, INITIAL_WEATHER, INITIAL_NOTIFICATIONS } from './data/mockData';

import { Navbar } from './components/Navbar';
import { PassengerHome } from './components/passenger/PassengerHome';
import { VesselTrackerMap } from './components/passenger/VesselTrackerMap';
import { ScheduleList } from './components/passenger/ScheduleList';
import { RouteCatalog } from './components/passenger/RouteCatalog';
import { BookingModal } from './components/passenger/BookingModal';
import { MyTickets } from './components/passenger/MyTickets';
import { WeatherPage } from './components/passenger/WeatherPage';
import { LoginPage } from './components/auth/LoginPage';
import { NotificationDrawer } from './components/NotificationDrawer';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { OfficerScannerPage } from './components/officer/OfficerScannerPage';
import { RoleLinksModal } from './components/common/RoleLinksModal';
import { SupabaseDatabaseModal } from './components/common/SupabaseDatabaseModal';
import { AccountSettingsModal } from './components/common/AccountSettingsModal';

import {
  Home,
  Map,
  Calendar,
  Ticket,
  CloudSun,
  Compass,
  User as UserIcon,
  ShieldCheck,
  ScanLine,
  SlidersHorizontal,
  FileSpreadsheet,
  Share2,
  AlertTriangle,
} from 'lucide-react';

// Helper to parse role and default tab from VITE_APP_ROLE environment variable or current URL
const getAppRoleConfig = (): { role: Role | null; defaultTab?: string; forceLogin: boolean; isFixedPortal: boolean } => {
  const envRoleRaw = (((import.meta as any).env?.VITE_APP_ROLE as string) || '').toLowerCase().trim();
  if (envRoleRaw === 'admin') {
    return { role: 'admin', defaultTab: 'admin_panel', forceLogin: false, isFixedPortal: true };
  }
  if (envRoleRaw === 'officer' || envRoleRaw === 'petugas') {
    return { role: 'officer', defaultTab: 'officer_scanner', forceLogin: false, isFixedPortal: true };
  }
  if (envRoleRaw === 'passenger' || envRoleRaw === 'penumpang' || envRoleRaw === 'pengguna') {
    return { role: 'passenger', defaultTab: 'beranda', forceLogin: false, isFixedPortal: true };
  }

  if (typeof window === 'undefined') return { role: null, forceLogin: false, isFixedPortal: false };
  const pathname = window.location.pathname.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.toLowerCase();
  const roleQuery = searchParams.get('role')?.toLowerCase();
  const modeQuery = searchParams.get('mode')?.toLowerCase();
  const loginQuery = searchParams.get('login')?.toLowerCase();
  const isExplicitLogin =
    pathname.includes('/login') ||
    hash.includes('login') ||
    modeQuery === 'login' ||
    loginQuery === '1' ||
    loginQuery === 'true' ||
    searchParams.has('login');

  if (pathname.includes('/admin') || roleQuery === 'admin' || hash.includes('admin')) {
    return { role: 'admin', defaultTab: 'admin_panel', forceLogin: isExplicitLogin, isFixedPortal: false };
  }
  if (
    pathname.includes('/petugas') ||
    pathname.includes('/officer') ||
    roleQuery === 'officer' ||
    roleQuery === 'petugas' ||
    hash.includes('petugas') ||
    hash.includes('officer')
  ) {
    return { role: 'officer', defaultTab: 'officer_scanner', forceLogin: isExplicitLogin, isFixedPortal: false };
  }
  if (
    pathname.includes('/pengguna') ||
    pathname.includes('/penumpang') ||
    pathname.includes('/passenger') ||
    roleQuery === 'passenger' ||
    roleQuery === 'pengguna' ||
    roleQuery === 'penumpang' ||
    hash.includes('pengguna') ||
    hash.includes('penumpang')
  ) {
    return { role: 'passenger', defaultTab: 'beranda', forceLogin: isExplicitLogin, isFixedPortal: false };
  }

  return { role: null, forceLogin: isExplicitLogin, isFixedPortal: false };
};

export default function App() {
  // Session storage ensures user is automatically logged out when closing or exiting the app
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedSession = sessionStorage.getItem('kapalku_user');
      if (savedSession) return JSON.parse(savedSession);
    } catch (e) {}
    return null;
  });

  const initialRoleConfig = getAppRoleConfig();
  const [targetPortalRole, setTargetPortalRole] = useState<Role>(() => {
    return initialRoleConfig.role || currentUser?.role || 'passenger';
  });

  const [isRoleLinksModalOpen, setIsRoleLinksModalOpen] = useState<boolean>(false);

  const getInitialTab = (user: User | null, urlParsed: { role: Role | null; defaultTab?: string; forceLogin: boolean }): string => {
    // If not logged in, or explicit login URL accessed
    if (!user || urlParsed.forceLogin) return 'login';
    // If user's role does not match the requested role portal URL, direct to login for that role
    if (urlParsed.role && user.role !== urlParsed.role) {
      return 'login';
    }
    if (urlParsed.role && user.role === urlParsed.role && urlParsed.defaultTab) {
      return urlParsed.defaultTab;
    }
    if (user.role === 'admin') return 'admin_panel';
    if (user.role === 'officer') return 'officer_scanner';
    return 'beranda';
  };

  const [autoLogoutNotice, setAutoLogoutNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(getInitialTab(currentUser, initialRoleConfig));

  // Master State
  const [vessels, setVessels] = useState<Vessel[]>(INITIAL_VESSELS);
  const [docks, setDocks] = useState<Dock[]>(INITIAL_DOCKS);
  const [routes, setRoutes] = useState<RouteItem[]>(INITIAL_ROUTES);
  const [schedules, setSchedules] = useState<Schedule[]>(INITIAL_SCHEDULES);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [weatherReports, setWeatherReports] = useState<WeatherReport[]>(INITIAL_WEATHER);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [usersList, setUsersList] = useState<User[]>(INITIAL_USERS);

  // Modals & Search
  const [selectedBookingSchedule, setSelectedBookingSchedule] = useState<Schedule | null>(null);
  const [isBookingWizardOpen, setIsBookingWizardOpen] = useState<boolean>(false);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [trackedVesselName, setTrackedVesselName] = useState<string | undefined>(undefined);
  const [scheduleSearchParams, setScheduleSearchParams] = useState<{
    originDockId?: string;
    destinationDockId?: string;
    travelDate?: string;
    searchTimestamp?: number;
  }>({});

  // Dynamic Document Title based on Configured Role
  useEffect(() => {
    if (targetPortalRole === 'admin') {
      document.title = 'KapalKu - Portal Administrator (Tarif, Rute & Dermaga)';
    } else if (targetPortalRole === 'officer') {
      document.title = 'KapalKu - Portal Petugas Gate & Scanner';
    } else if (targetPortalRole === 'passenger') {
      document.title = 'KapalKu - Tiket Kapal & Jadwal Pelayaran Nusantara';
    } else {
      document.title = 'KapalKu - Sistem Informasi & Tiket Maritim';
    }
  }, [targetPortalRole]);

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
    setTargetPortalRole(user.role);
    try {
      sessionStorage.setItem('kapalku_user', JSON.stringify(user));
      localStorage.removeItem('kapalku_user');
    } catch (e) {}
    setIsAuthModalOpen(false);

    // Sync URL with the authenticated user's role portal
    const targetPath = user.role === 'admin' ? '/admin' : user.role === 'officer' ? '/petugas' : '/pengguna';
    try {
      window.history.pushState({ role: user.role }, '', targetPath);
    } catch (e) {}

    if (user.role === 'admin') {
      setActiveTab('admin_panel');
    } else if (user.role === 'officer') {
      setActiveTab('officer_scanner');
    } else {
      setActiveTab('beranda');
    }
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

  const handleNavigateToPortalRole = (role: Role) => {
    setTargetPortalRole(role);
    const path = role === 'admin' ? '/admin' : role === 'officer' ? '/petugas' : '/pengguna';
    try {
      if (window.location.pathname !== path) {
        window.history.pushState({ role }, '', path);
      }
    } catch (e) {}

    if (currentUser && currentUser.role === role) {
      if (role === 'admin') setActiveTab('admin_panel');
      else if (role === 'officer') setActiveTab('officer_scanner');
      else setActiveTab('beranda');
    } else if (!currentUser) {
      setActiveTab('login');
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const parsed = getAppRoleConfig();
      if (parsed.role) {
        setTargetPortalRole(parsed.role);
        if (parsed.forceLogin || !currentUser || currentUser.role !== parsed.role) {
          setActiveTab('login');
        } else if (currentUser && currentUser.role === parsed.role && parsed.defaultTab) {
          setActiveTab(parsed.defaultTab);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [currentUser]);

  // Initial Data Fetch & Interval Refresh
  const loadAllData = async () => {
    try {
      const [vData, dData, rData, sData, resData, wData, nData, uData] = await Promise.all([
        api.getVessels().catch(() => INITIAL_VESSELS),
        api.getDocks().catch(() => INITIAL_DOCKS),
        api.getRoutes().catch(() => INITIAL_ROUTES),
        api.getSchedules().catch(() => INITIAL_SCHEDULES),
        api.getReservations().catch(() => INITIAL_RESERVATIONS),
        api.getWeather().catch(() => INITIAL_WEATHER),
        api.getNotifications().catch(() => INITIAL_NOTIFICATIONS),
        api.getUsers().catch(() => INITIAL_USERS),
      ]);

      if (vData) setVessels(vData);
      if (dData) setDocks(dData);
      if (rData) setRoutes(rData);
      if (sData) setSchedules(sData);
      if (resData) setReservations(resData);
      if (wData) setWeatherReports(wData);
      if (nData) setNotifications(nData);
      if (uData) setUsersList(uData);
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
            targetRole={targetPortalRole}
            onSelectRolePortal={handleNavigateToPortalRole}
            onOpenRoleLinks={() => setIsRoleLinksModalOpen(true)}
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
            isFixedPortal={initialRoleConfig.isFixedPortal}
          />
        </div>
      ) : (
        <>
          {/* Top Navbar */}
          <Navbar
            unreadCount={unreadNotifs}
            onOpenNotifications={() => setIsNotifOpen(true)}
            currentUser={currentUser}
            onOpenLogin={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenRoleLinks={() => setIsRoleLinksModalOpen(true)}
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
            onOpenAccountSettings={() => setIsAccountModalOpen(true)}
            portalRole={targetPortalRole}
            isFixedPortal={initialRoleConfig.isFixedPortal}
          />

          {/* Role Mismatch Notice if user visits a different role's portal URL */}
          {targetPortalRole && currentUser.role !== targetPortalRole && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Anda sedang aktif sebagai akun <strong>{currentUser.name} ({currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'officer' ? 'Petugas' : 'Pengguna'})</strong>, sedangkan URL yang dibuka adalah <strong>Portal {targetPortalRole === 'admin' ? 'Administrator (/admin)' : targetPortalRole === 'officer' ? 'Petugas (/petugas)' : 'Pengguna (/pengguna)'}</strong>.
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] cursor-pointer shadow-xs"
                >
                  Ganti ke Akun {targetPortalRole === 'admin' ? 'Admin' : targetPortalRole === 'officer' ? 'Petugas' : 'Pengguna'}
                </button>
                <button
                  onClick={() => handleNavigateToPortalRole(currentUser.role)}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-800 rounded-lg font-semibold text-[11px] cursor-pointer shadow-xs"
                >
                  Kembali ke Portal Saya
                </button>
              </div>
            </div>
          )}

          {/* Main Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
            {/* ROLE 1: ADMIN PANEL (TARIF & RUTE) */}
            {activeTab === 'admin_panel' && (
              <AdminDashboard
                routes={routes}
                schedules={schedules}
                vessels={vessels}
                docks={docks}
                reservations={reservations}
                users={usersList}
                currentUser={currentUser}
                onRefreshData={loadAllData}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenRoleLinks={() => setIsRoleLinksModalOpen(true)}
                onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
              />
            )}

            {/* ROLE 2: PETUGAS SCANNER GATE */}
            {activeTab === 'officer_scanner' && (
              <OfficerScannerPage
                currentUser={currentUser}
                reservations={reservations}
                schedules={schedules}
                onRefreshData={loadAllData}
                onOpenRoleLinks={() => setIsRoleLinksModalOpen(true)}
              />
            )}

            {/* ROLE 3: PENGGUNA / PENUMPANG VIEWS */}
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
                onOpenRoleLinks={() => setIsRoleLinksModalOpen(true)}
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
          </main>

          {/* Bottom Navigation Bar Tailored to Active Role */}
          <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200/90 shadow-lg py-2 px-3 sm:px-4 flex items-center justify-around">
            {currentUser.role === 'admin' ? (
              <>
                <button
                  onClick={() => setActiveTab('admin_panel')}
                  className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold cursor-pointer ${
                    activeTab === 'admin_panel' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  <span>Admin Tarif & Rute</span>
                </button>

                <button
                  onClick={() => setActiveTab('officer_scanner')}
                  className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold cursor-pointer ${
                    activeTab === 'officer_scanner' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <ScanLine className="w-5 h-5" />
                  <span>Uji Scanner Gate</span>
                </button>

                <button
                  onClick={() => setActiveTab('peta')}
                  className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold cursor-pointer ${
                    activeTab === 'peta' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Map className="w-5 h-5" />
                  <span>Live Map</span>
                </button>

                <button
                  onClick={() => setActiveTab('beranda')}
                  className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold cursor-pointer ${
                    activeTab === 'beranda' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span>Pratinjau Pengguna</span>
                </button>
              </>
            ) : currentUser.role === 'officer' ? (
              <>
                <button
                  onClick={() => setActiveTab('officer_scanner')}
                  className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold cursor-pointer ${
                    activeTab === 'officer_scanner' ? 'text-cyan-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <ScanLine className="w-5 h-5" />
                  <span>Scanner Barcode</span>
                </button>

                <button
                  onClick={() => setActiveTab('jadwal')}
                  className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold cursor-pointer ${
                    activeTab === 'jadwal' ? 'text-cyan-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                  <span>Jadwal Dermaga</span>
                </button>

                <button
                  onClick={() => setActiveTab('peta')}
                  className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold cursor-pointer ${
                    activeTab === 'peta' ? 'text-cyan-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Map className="w-5 h-5" />
                  <span>Radar Kapal</span>
                </button>
              </>
            ) : (
              <>
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
              </>
            )}

            <button
              onClick={() => {
                if (currentUser) {
                  setIsAccountModalOpen(true);
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold cursor-pointer transition-colors ${
                isAccountModalOpen ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Pengaturan Akun & Profil"
            >
              <UserIcon className="w-5 h-5" />
              <span>Akun Saya</span>
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

      {/* Notifications Drawer */}
      <NotificationDrawer
        notifications={notifications}
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />

      {/* Authentication Modal / Overlay */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[95vh] overflow-y-auto">
            <LoginPage
              currentUser={currentUser}
              onLoginSuccess={handleLoginSuccess}
              targetRole={targetPortalRole}
              onSelectRolePortal={handleNavigateToPortalRole}
              onOpenRoleLinks={() => setIsRoleLinksModalOpen(true)}
              onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
              onClose={() => setIsAuthModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Role Links Modal (Portal Terpisah) */}
      <RoleLinksModal
        isOpen={isRoleLinksModalOpen}
        onClose={() => setIsRoleLinksModalOpen(false)}
        onNavigateToRole={handleNavigateToPortalRole}
        activeRole={currentUser?.role || targetPortalRole}
      />

      {/* Supabase Database Modal */}
      <SupabaseDatabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onRefreshData={loadAllData}
      />

      {/* Account Settings Modal */}
      <AccountSettingsModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={(updated) => {
          setCurrentUser(updated);
          setUsersList((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        }}
        onLogout={handleLogout}
      />
    </div>
  );
}
