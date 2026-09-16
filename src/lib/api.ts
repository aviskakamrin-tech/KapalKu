import { User, AuthResponse, Vessel, Dock, RouteItem, Schedule, Reservation, WeatherReport, NotificationItem, SOSReport, AuditLog } from '../types';
import {
  INITIAL_USERS,
  INITIAL_VESSELS,
  INITIAL_DOCKS,
  INITIAL_ROUTES,
  INITIAL_SCHEDULES,
  INITIAL_RESERVATIONS,
  INITIAL_WEATHER,
  INITIAL_NOTIFICATIONS,
  INITIAL_SOS,
  INITIAL_AUDIT_LOGS,
} from '../data/mockData';

// Storage Keys
const STORAGE_KEYS = {
  USERS: 'kapalku_local_users',
  VESSELS: 'kapalku_local_vessels_bombana_v8',
  DOCKS: 'kapalku_local_docks_bombana_v8',
  ROUTES: 'kapalku_local_routes_bombana_v8',
  SCHEDULES: 'kapalku_local_schedules_bombana_v8',
  RESERVATIONS: 'kapalku_local_reservations_bombana_v8',
  WEATHER: 'kapalku_local_weather',
  NOTIFICATIONS: 'kapalku_local_notifications',
  SOS: 'kapalku_local_sos',
  AUDIT: 'kapalku_local_audit',
};

// Safe local storage helpers
function getLocal<T>(key: string, initialData: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(raw) as T;
  } catch (e) {
    return initialData;
  }
}

function setLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    // quota or privacy mode handling
  }
}

// In-Memory / LocalStorage synchronized state
let localUsers: User[] = getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
let localVessels: Vessel[] = getLocal(STORAGE_KEYS.VESSELS, INITIAL_VESSELS);
let localDocks: Dock[] = getLocal(STORAGE_KEYS.DOCKS, INITIAL_DOCKS);
let localRoutes: RouteItem[] = getLocal(STORAGE_KEYS.ROUTES, INITIAL_ROUTES);
let localSchedules: Schedule[] = getLocal(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
let localReservations: Reservation[] = getLocal(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS);
let localWeather: WeatherReport[] = getLocal(STORAGE_KEYS.WEATHER, INITIAL_WEATHER);
let localNotifications: NotificationItem[] = getLocal(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
let localSOS: SOSReport[] = getLocal(STORAGE_KEYS.SOS, INITIAL_SOS);
let localAudit: AuditLog[] = getLocal(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);

// Helper log
function addAuditLog(actorName: string, action: string, details: string) {
  const newLog: AuditLog = {
    id: `log_${Date.now()}`,
    actorName,
    actorRole: 'passenger',
    action,
    details,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA',
  };
  localAudit = [newLog, ...localAudit];
  setLocal(STORAGE_KEYS.AUDIT, localAudit);
}

// Resilient fetch wrapper with automatic fallback on 405 / 404 / Network error
async function safeFetch<T>(
  url: string,
  options: RequestInit | undefined,
  fallbackFn: () => T | Promise<T>
): Promise<T> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      // 405 Method Not Allowed, 404 Not Found, etc.
      return await fallbackFn();
    }
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await fallbackFn();
  } catch (err) {
    // Network failure, offline, or CORS issue
    return await fallbackFn();
  }
}

export const api = {
  // ================= AUTH =================
  getUsers: async (): Promise<User[]> => {
    return safeFetch('/api/users', undefined, () => {
      localUsers = getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
      return localUsers;
    });
  },

  login: async (data: { identifier: string; password?: string; role?: string }): Promise<AuthResponse> => {
    const cleanId = String(data.identifier || '').trim();
    if (!cleanId) {
      throw new Error('Nama, email, atau nomor HP wajib diisi.');
    }

    return safeFetch(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        // Fallback login logic
        localUsers = getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
        const cleanIdLower = cleanId.toLowerCase();
        const cleanPhone = cleanId.replace(/[^0-9]/g, '');

        // 1. Find existing
        let matchedUser = localUsers.find(
          (u) =>
            u.email.toLowerCase() === cleanIdLower ||
            (cleanPhone && u.phone.replace(/[^0-9]/g, '') === cleanPhone) ||
            u.name.toLowerCase() === cleanIdLower
        );

        // 2. Partial match
        if (!matchedUser) {
          matchedUser = localUsers.find(
            (u) =>
              u.name.toLowerCase().includes(cleanIdLower) ||
              (u.email && u.email.toLowerCase().includes(cleanIdLower))
          );
        }

        // 3. Create if not found
        if (!matchedUser) {
          let derivedName = cleanId;
          if (cleanId.includes('@')) {
            const prefix = cleanId.split('@')[0];
            derivedName = prefix
              .replace(/[._-]/g, ' ')
              .replace(/\b\w/g, (c: string) => c.toUpperCase());
          } else if (cleanId.match(/^[0-9+]/)) {
            derivedName = `Penumpang ${cleanId.slice(-4)}`;
          }

          matchedUser = {
            id: `usr_${Date.now()}`,
            name: derivedName,
            email: cleanId.includes('@') ? cleanIdLower : `${cleanIdLower.replace(/[^a-z0-9]/g, '') || 'pengguna'}@kapalku.id`,
            phone: cleanId.match(/^[0-9+]/) ? cleanId : '0812-0000-0000',
            role: (data.role as any) || 'passenger',
            avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
          };

          localUsers = [matchedUser, ...localUsers];
          setLocal(STORAGE_KEYS.USERS, localUsers);
        }

        // If role was explicitly specified in request and existing user role differs, update it
        if (data.role && matchedUser.role !== (data.role as any)) {
          matchedUser = { ...matchedUser, role: data.role as any };
          const uIdx = localUsers.findIndex((u) => u.id === matchedUser?.id);
          if (uIdx !== -1) {
            localUsers[uIdx] = matchedUser;
            setLocal(STORAGE_KEYS.USERS, localUsers);
          }
        }

        addAuditLog(matchedUser.name, 'USER_LOGIN', `Login sukses (${matchedUser.role}): ${matchedUser.name}`);

        return {
          user: matchedUser,
          token: `token_${matchedUser.id}_${Date.now()}`,
          message: `Selamat datang di KapalKu, ${matchedUser.name}!`,
        };
      }
    );
  },

  register: async (data: {
    name: string;
    email?: string;
    phone?: string;
    role?: string;
    password?: string;
  }): Promise<AuthResponse> => {
    const { name, email, phone } = data;
    if (!name || (!email && !phone)) {
      throw new Error('Nama lengkap dan Email atau Nomor HP wajib diisi.');
    }

    return safeFetch(
      '/api/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        localUsers = getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);

        const existingUser = localUsers.find(
          (u) =>
            (email && u.email.toLowerCase() === email.trim().toLowerCase()) ||
            (phone && u.phone.replace(/[^0-9]/g, '') === phone.trim().replace(/[^0-9]/g, ''))
        );

        if (existingUser) {
          return {
            user: existingUser,
            token: `token_${existingUser.id}_${Date.now()}`,
            message: `Akun sudah terdaftar. Selamat datang kembali, ${existingUser.name}!`,
          };
        }

        const newUser: User = {
          id: `usr_${Date.now()}`,
          name: name.trim(),
          email: email ? email.trim().toLowerCase() : `${phone?.replace(/[^0-9]/g, '') || 'user'}@kapalku.id`,
          phone: phone ? phone.trim() : '0812-0000-0000',
          role: (data.role as any) || 'passenger',
          avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        };

        localUsers = [newUser, ...localUsers];
        setLocal(STORAGE_KEYS.USERS, localUsers);

        // Add welcome notification
        const welcomeNotif: NotificationItem = {
          id: `notif_${Date.now()}`,
          userId: newUser.id,
          title: '🎉 Selamat Datang di KapalKu',
          message: `Halo ${newUser.name}, akun penumpang Anda telah aktif. Nikmati kemudahan jadwal, live map kapal, dan tiket resmi.`,
          type: 'ship',
          read: false,
          createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        localNotifications = [welcomeNotif, ...localNotifications];
        setLocal(STORAGE_KEYS.NOTIFICATIONS, localNotifications);

        addAuditLog(newUser.name, 'USER_REGISTER', `Pendaftaran akun baru: ${newUser.name}`);

        return {
          user: newUser,
          token: `token_${newUser.id}_${Date.now()}`,
          message: `Pendaftaran berhasil! Selamat datang di KapalKu, ${newUser.name}`,
        };
      }
    );
  },

  // ================= VESSELS =================
  getVessels: async (): Promise<Vessel[]> => {
    return safeFetch('/api/vessels', undefined, () => {
      localVessels = getLocal(STORAGE_KEYS.VESSELS, INITIAL_VESSELS);
      return localVessels;
    });
  },

  createVessel: async (data: Partial<Vessel>): Promise<Vessel> => {
    return safeFetch(
      '/api/vessels',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const newVessel: Vessel = {
          id: `vsl_${Date.now()}`,
          name: data.name || 'Kapal Baru',
          registrationNumber: data.registrationNumber || `REG-${Date.now().toString().slice(-4)}`,
          type: data.type || 'Speedboat',
          capacityPassengers: data.capacityPassengers || 50,
          capacityMotorbikes: data.capacityMotorbikes || 0,
          capacityCars: data.capacityCars || 0,
          capacityTrucks: data.capacityTrucks || 0,
          operatingRoutesDescription: data.operatingRoutesDescription || '',
          status: data.status || 'Bertambat',
          operatorId: data.operatorId || 'op_default',
          operatorName: data.operatorName || 'Operator Laut',
          operatorPhone: data.operatorPhone || '0812-0000-0000',
          speedKts: 0,
          headingDeg: 0,
          currentLat: data.currentLat || -4.6853,
          currentLng: data.currentLng || 122.0298,
          lastUpdated: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        localVessels = [newVessel, ...localVessels];
        setLocal(STORAGE_KEYS.VESSELS, localVessels);
        return newVessel;
      }
    );
  },

  updateVessel: async (id: string, data: Partial<Vessel>): Promise<Vessel> => {
    return safeFetch(
      `/api/vessels/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const idx = localVessels.findIndex((v) => v.id === id);
        if (idx !== -1) {
          localVessels[idx] = { ...localVessels[idx], ...data, lastUpdated: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) };
          setLocal(STORAGE_KEYS.VESSELS, localVessels);
          return localVessels[idx];
        }
        throw new Error('Vessel not found');
      }
    );
  },

  updateGPS: async (data: { vesselId: string; lat: number; lng: number; speedKts?: number; headingDeg?: number; status?: string }): Promise<{ success: boolean; vessel: Vessel }> => {
    return safeFetch(
      '/api/gps/update',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const idx = localVessels.findIndex((v) => v.id === data.vesselId);
        if (idx !== -1) {
          localVessels[idx] = {
            ...localVessels[idx],
            currentLat: data.lat,
            currentLng: data.lng,
            speedKts: data.speedKts !== undefined ? data.speedKts : localVessels[idx].speedKts,
            headingDeg: data.headingDeg !== undefined ? data.headingDeg : localVessels[idx].headingDeg,
            status: (data.status as any) || localVessels[idx].status,
            lastUpdated: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          };
          setLocal(STORAGE_KEYS.VESSELS, localVessels);
          return { success: true, vessel: localVessels[idx] };
        }
        throw new Error('Vessel not found');
      }
    );
  },

  // ================= DOCKS =================
  getDocks: async (): Promise<Dock[]> => {
    return safeFetch('/api/docks', undefined, () => {
      localDocks = getLocal(STORAGE_KEYS.DOCKS, INITIAL_DOCKS);
      return localDocks;
    });
  },

  createDock: async (data: Partial<Dock>): Promise<Dock> => {
    return safeFetch(
      '/api/docks',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const newDock: Dock = {
          id: `dock_${Date.now()}`,
          name: data.name || 'Dermaga Baru',
          address: data.address || 'Alamat Dermaga',
          lat: data.lat || -1.2500,
          lng: data.lng || 116.8200,
          status: data.status || 'Aktif',
          province: data.province || 'Kalimantan Timur',
          region: data.region || 'Kalimantan',
          city: data.city || '',
          dockRole: data.dockRole || 'both',
          facilities: data.facilities || [],
          contactPhone: data.contactPhone || '',
        };
        localDocks = [newDock, ...localDocks];
        setLocal(STORAGE_KEYS.DOCKS, localDocks);
        return newDock;
      }
    );
  },

  updateDock: async (id: string, data: Partial<Dock>): Promise<Dock> => {
    return safeFetch(
      `/api/docks/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const idx = localDocks.findIndex((d) => d.id === id);
        if (idx !== -1) {
          localDocks[idx] = { ...localDocks[idx], ...data };
          setLocal(STORAGE_KEYS.DOCKS, localDocks);
          return localDocks[idx];
        }
        throw new Error('Dermaga tidak ditemukan');
      }
    );
  },

  deleteDock: async (id: string): Promise<boolean> => {
    return safeFetch(
      `/api/docks/${id}`,
      { method: 'DELETE' },
      () => {
        localDocks = localDocks.filter((d) => d.id !== id);
        setLocal(STORAGE_KEYS.DOCKS, localDocks);
        return true;
      }
    );
  },

  deleteVessel: async (id: string): Promise<boolean> => {
    return safeFetch(
      `/api/vessels/${id}`,
      { method: 'DELETE' },
      () => {
        localVessels = localVessels.filter((v) => v.id !== id);
        setLocal(STORAGE_KEYS.VESSELS, localVessels);
        return true;
      }
    );
  },

  // ================= ROUTES =================
  getRoutes: async (): Promise<RouteItem[]> => {
    return safeFetch('/api/routes', undefined, () => {
      localRoutes = getLocal(STORAGE_KEYS.ROUTES, INITIAL_ROUTES);
      return localRoutes;
    });
  },

  createRoute: async (data: Partial<RouteItem>): Promise<RouteItem> => {
    return safeFetch(
      '/api/routes',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const newRoute: RouteItem = {
          id: `route_${Date.now()}`,
          name: data.name || `${data.originDockName || 'Asal'} ➔ ${data.destinationDockName || 'Tujuan'}`,
          originDockId: data.originDockId || 'dock_1',
          originDockName: data.originDockName || 'Dermaga Asal',
          destinationDockId: data.destinationDockId || 'dock_2',
          destinationDockName: data.destinationDockName || 'Dermaga Tujuan',
          distanceKm: data.distanceKm || 10,
          distanceMiles: data.distanceMiles !== undefined ? Number(data.distanceMiles) : undefined,
          estimatedDurationMinutes: data.estimatedDurationMinutes || 45,
          tariffPassenger: Number(data.tariffPassenger) || 35000,
          tariffChild: data.tariffChild !== undefined ? Number(data.tariffChild) : undefined,
          tariffMotorbike: Number(data.tariffMotorbike) || 50000,
          tariffCar: Number(data.tariffCar) || 150000,
          tariffTruck: data.tariffTruck !== undefined ? Number(data.tariffTruck) : undefined,
          status: data.status || 'Operasional',
          region: data.region || 'Sulawesi',
          vesselTypesAvailable: data.vesselTypesAvailable || ['Speedboat', 'Feri'],
          frequencyText: data.frequencyText || 'Tiap 30-60 menit',
          description: data.description || 'Jalur pelayaran reguler antar dermaga',
        };
        localRoutes = [newRoute, ...localRoutes];
        setLocal(STORAGE_KEYS.ROUTES, localRoutes);
        addAuditLog('Admin', 'ROUTE_CREATE', `Membuat rute: ${newRoute.name} (Tarif Penumpang: Rp ${newRoute.tariffPassenger.toLocaleString('id-ID')})`);
        return newRoute;
      }
    );
  },

  updateRoute: async (id: string, data: Partial<RouteItem>): Promise<RouteItem> => {
    return safeFetch(
      `/api/routes/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const idx = localRoutes.findIndex((r) => r.id === id);
        if (idx !== -1) {
          localRoutes[idx] = {
            ...localRoutes[idx],
            ...data,
            tariffPassenger: data.tariffPassenger !== undefined ? Number(data.tariffPassenger) : localRoutes[idx].tariffPassenger,
            tariffChild: data.tariffChild !== undefined ? Number(data.tariffChild) : localRoutes[idx].tariffChild,
            tariffMotorbike: data.tariffMotorbike !== undefined ? Number(data.tariffMotorbike) : localRoutes[idx].tariffMotorbike,
            tariffCar: data.tariffCar !== undefined ? Number(data.tariffCar) : localRoutes[idx].tariffCar,
            tariffTruck: data.tariffTruck !== undefined ? Number(data.tariffTruck) : localRoutes[idx].tariffTruck,
            distanceMiles: data.distanceMiles !== undefined ? Number(data.distanceMiles) : localRoutes[idx].distanceMiles,
          };
          setLocal(STORAGE_KEYS.ROUTES, localRoutes);
          addAuditLog('Admin', 'ROUTE_UPDATE', `Update rute/tarif: ${localRoutes[idx].name}`);
          return localRoutes[idx];
        }
        throw new Error('Rute tidak ditemukan');
      }
    );
  },

  deleteRoute: async (id: string): Promise<boolean> => {
    return safeFetch(
      `/api/routes/${id}`,
      { method: 'DELETE' },
      () => {
        const target = localRoutes.find((r) => r.id === id);
        localRoutes = localRoutes.filter((r) => r.id !== id);
        setLocal(STORAGE_KEYS.ROUTES, localRoutes);
        if (target) {
          addAuditLog('Admin', 'ROUTE_DELETE', `Menghapus rute: ${target.name}`);
        }
        return true;
      }
    );
  },

  // ================= SCHEDULES =================
  getSchedules: async (): Promise<Schedule[]> => {
    return safeFetch('/api/schedules', undefined, () => {
      localSchedules = getLocal(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
      return localSchedules;
    });
  },

  createSchedule: async (data: Partial<Schedule>): Promise<Schedule> => {
    return safeFetch(
      '/api/schedules',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const newSchedule: Schedule = {
          id: `sch_${Date.now()}`,
          vesselId: data.vesselId || 'vsl_1',
          vesselName: data.vesselName || 'Kapal Terjadwal',
          vesselType: data.vesselType || 'Speedboat',
          routeId: data.routeId || 'route_1',
          originDockName: data.originDockName || 'Dermaga Asal',
          destinationDockName: data.destinationDockName || 'Dermaga Tujuan',
          date: data.date || new Date().toISOString().split('T')[0],
          departureTime: data.departureTime || '08:00',
          estimatedArrivalTime: data.estimatedArrivalTime || '09:00',
          tariffPassenger: Number(data.tariffPassenger) || 35000,
          tariffChild: data.tariffChild !== undefined ? Number(data.tariffChild) : undefined,
          tariffMotorbike: Number(data.tariffMotorbike) || 50000,
          tariffCar: Number(data.tariffCar) || 150000,
          tariffTruck: data.tariffTruck !== undefined ? Number(data.tariffTruck) : undefined,
          status: data.status || 'scheduled',
          bookedPassengers: 0,
          maxPassengers: data.maxPassengers || 60,
          bookedMotorbikes: 0,
          bookedCars: 0,
          bookedTrucks: 0,
        };
        localSchedules = [newSchedule, ...localSchedules];
        setLocal(STORAGE_KEYS.SCHEDULES, localSchedules);
        addAuditLog('Admin', 'SCHEDULE_CREATE', `Membuat jadwal: ${newSchedule.vesselName} (${newSchedule.originDockName} → ${newSchedule.destinationDockName})`);
        return newSchedule;
      }
    );
  },

  updateSchedule: async (id: string, data: Partial<Schedule>): Promise<Schedule> => {
    return safeFetch(
      `/api/schedules/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const idx = localSchedules.findIndex((s) => s.id === id);
        if (idx !== -1) {
          localSchedules[idx] = {
            ...localSchedules[idx],
            ...data,
            tariffPassenger: data.tariffPassenger !== undefined ? Number(data.tariffPassenger) : localSchedules[idx].tariffPassenger,
            tariffChild: data.tariffChild !== undefined ? Number(data.tariffChild) : localSchedules[idx].tariffChild,
            tariffMotorbike: data.tariffMotorbike !== undefined ? Number(data.tariffMotorbike) : localSchedules[idx].tariffMotorbike,
            tariffCar: data.tariffCar !== undefined ? Number(data.tariffCar) : localSchedules[idx].tariffCar,
            tariffTruck: data.tariffTruck !== undefined ? Number(data.tariffTruck) : localSchedules[idx].tariffTruck,
          };
          setLocal(STORAGE_KEYS.SCHEDULES, localSchedules);
          addAuditLog('Admin', 'SCHEDULE_UPDATE', `Update jadwal: ${localSchedules[idx].vesselName}`);
          return localSchedules[idx];
        }
        throw new Error('Jadwal tidak ditemukan');
      }
    );
  },

  deleteSchedule: async (id: string): Promise<boolean> => {
    return safeFetch(
      `/api/schedules/${id}`,
      { method: 'DELETE' },
      () => {
        const target = localSchedules.find((s) => s.id === id);
        localSchedules = localSchedules.filter((s) => s.id !== id);
        setLocal(STORAGE_KEYS.SCHEDULES, localSchedules);
        if (target) {
          addAuditLog('Admin', 'SCHEDULE_DELETE', `Menghapus jadwal kapal: ${target.vesselName}`);
        }
        return true;
      }
    );
  },

  // ================= RESERVATIONS / TICKETS =================
  getReservations: async (): Promise<Reservation[]> => {
    return safeFetch('/api/reservations', undefined, () => {
      localReservations = getLocal(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS);
      return localReservations;
    });
  },

  createReservation: async (data: {
    scheduleId: string;
    userId?: string;
    userName: string;
    userPhone: string;
    userEmail?: string;
    passengersCount: number;
    motorbikesCount?: number;
    carsCount?: number;
    passengersList?: Array<{ name: string; idNumber: string; type: 'Dewasa' | 'Anak'; seatNumber?: string }>;
    vehiclePlate?: string;
    vehicleType?: string;
    paymentMethod?: string;
  }): Promise<Reservation> => {
    return safeFetch(
      '/api/reservations',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        localSchedules = getLocal(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
        localReservations = getLocal(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS);

        const schedule = localSchedules.find((s) => s.id === data.scheduleId) || localSchedules[0];
        const pCount = data.passengersCount || 1;
        const mCount = data.motorbikesCount || 0;
        const cCount = data.carsCount || 0;

        const totalAmount =
          pCount * (schedule?.tariffPassenger || 35000) +
          mCount * (schedule?.tariffMotorbike || 50000) +
          cCount * (schedule?.tariffCar || 150000);

        const bookingCode = `KPK-${Math.floor(100000 + Math.random() * 900000)}`;

        const newReservation: Reservation = {
          id: `res_${Date.now()}`,
          bookingCode,
          scheduleId: data.scheduleId,
          userId: data.userId || 'usr_pass_1',
          userName: data.userName,
          userPhone: data.userPhone,
          userEmail: data.userEmail || 'penumpang@kapalku.id',
          vesselName: schedule?.vesselName || 'KMP Jawatutu',
          vesselType: schedule?.vesselType || 'Feri',
          originDockName: schedule?.originDockName || 'Dermaga Semayang',
          destinationDockName: schedule?.destinationDockName || 'Dermaga Penajam',
          travelDate: schedule?.date || new Date().toISOString().split('T')[0],
          departureTime: schedule?.departureTime || '08:00',
          passengersCount: pCount,
          motorbikesCount: mCount,
          carsCount: cCount,
          totalPrice: totalAmount,
          reservationStatus: 'Terkonfirmasi',
          paymentStatus: 'Lunas',
          checkInStatus: 'Belum Check-In',
          paymentMethod: data.paymentMethod || 'QRIS Nasional (NMID 9360012)',
          createdAt: new Date().toLocaleDateString('id-ID') + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=KAPALKU-${bookingCode}-${encodeURIComponent(data.userName)}`,
          passengersList: data.passengersList || [{ name: data.userName, idNumber: '6471020000000001', type: 'Dewasa', seatNumber: 'A-12' }],
          vehiclePlate: data.vehiclePlate,
          vehicleType: data.vehicleType,
        };

        // Update schedule counts
        if (schedule) {
          const schIdx = localSchedules.findIndex((s) => s.id === schedule.id);
          if (schIdx !== -1) {
            localSchedules[schIdx].bookedPassengers += pCount;
            localSchedules[schIdx].bookedMotorbikes += mCount;
            localSchedules[schIdx].bookedCars += cCount;
            setLocal(STORAGE_KEYS.SCHEDULES, localSchedules);
          }
        }

        localReservations = [newReservation, ...localReservations];
        setLocal(STORAGE_KEYS.RESERVATIONS, localReservations);

        // Add Notification
        const notif: NotificationItem = {
          id: `notif_${Date.now()}`,
          userId: newReservation.userId,
          title: '🎫 Tiket Kapal Berhasil Diterbitkan',
          message: `E-Ticket kode ${bookingCode} untuk ${newReservation.vesselName} (${newReservation.originDockName} → ${newReservation.destinationDockName}) siap digunakan.`,
          type: 'booking',
          read: false,
          createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        localNotifications = [notif, ...localNotifications];
        setLocal(STORAGE_KEYS.NOTIFICATIONS, localNotifications);

        addAuditLog(data.userName, 'BOOKING_CREATE', `Pemesanan tiket ${bookingCode} (${newReservation.vesselName})`);

        return newReservation;
      }
    );
  },

  validateTicket: async (code: string): Promise<{
    valid: boolean;
    status: 'VALID' | 'ALREADY_CHECKED_IN' | 'UNPAID' | 'CANCELLED' | 'NOT_FOUND';
    reservation?: Reservation;
    message: string;
  }> => {
    return safeFetch(
      '/api/reservations/validate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      },
      () => {
        localReservations = getLocal(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS);
        const raw = String(code || '').trim().toUpperCase();
        
        // Extract KPK-XXXXXX or find by ID / raw string
        const kpkMatch = raw.match(/KPK-\d+/i) || raw.match(/KPK\d+/i);
        const searchCode = kpkMatch ? kpkMatch[0].replace('KPK', 'KPK-').replace('--', '-') : raw;

        const found = localReservations.find(
          (r) =>
            r.bookingCode.toUpperCase() === searchCode.toUpperCase() ||
            r.bookingCode.toUpperCase() === raw ||
            r.id.toUpperCase() === raw ||
            (r.qrCodeUrl && r.qrCodeUrl.toUpperCase().includes(raw))
        );

        if (!found) {
          return {
            valid: false,
            status: 'NOT_FOUND',
            message: `Tiket dengan kode "${raw}" tidak ditemukan dalam sistem manifes pelayaran.`,
          };
        }

        if (found.reservationStatus === 'Dibatalkan' || found.paymentStatus === 'Dibatalkan') {
          return {
            valid: false,
            status: 'CANCELLED',
            reservation: found,
            message: `Tiket telah DIBATALKAN: ${found.cancellationReason || 'Permintaan pembatalan'}. Tidak diizinkan naik kapal.`,
          };
        }

        if (found.paymentStatus !== 'Lunas') {
          return {
            valid: false,
            status: 'UNPAID',
            reservation: found,
            message: `Tiket BELUM LUNAS (${found.paymentStatus}). Harap lakukan pelunasan di loket sebelum boarding.`,
          };
        }

        if (found.checkInStatus === 'Sudah Check-In (Boarded)') {
          return {
            valid: true,
            status: 'ALREADY_CHECKED_IN',
            reservation: found,
            message: `Tiket SUDAH PERNAH CHECK-IN sebelumnya pada ${found.checkInTime || found.scannedAt || '-'} oleh ${found.scannedBy || 'Petugas Gate'}.`,
          };
        }

        return {
          valid: true,
          status: 'VALID',
          reservation: found,
          message: `Tiket SAH & VALID untuk boarding kapal ${found.vesselName} (${found.originDockName} ➔ ${found.destinationDockName}).`,
        };
      }
    );
  },

  checkInTicket: async (code: string, officerName?: string): Promise<{ success: boolean; reservation: Reservation; message: string }> => {
    return safeFetch(
      '/api/reservations/checkin',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, officerName }),
      },
      () => {
        localReservations = getLocal(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS);
        const raw = String(code || '').trim().toUpperCase();
        const kpkMatch = raw.match(/KPK-\d+/i) || raw.match(/KPK\d+/i);
        const searchCode = kpkMatch ? kpkMatch[0].replace('KPK', 'KPK-').replace('--', '-') : raw;

        const idx = localReservations.findIndex(
          (r) =>
            r.bookingCode.toUpperCase() === searchCode.toUpperCase() ||
            r.bookingCode.toUpperCase() === raw ||
            r.id.toUpperCase() === raw
        );

        if (idx === -1) {
          throw new Error('Tiket tidak ditemukan dalam manifes');
        }

        const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const nowFull = new Date().toLocaleDateString('id-ID') + ' ' + nowTime;

        localReservations[idx].checkInStatus = 'Sudah Check-In (Boarded)';
        localReservations[idx].checkInTime = nowTime;
        localReservations[idx].scannedAt = nowFull;
        localReservations[idx].scannedBy = officerName || 'Petugas Gate Dermaga';
        setLocal(STORAGE_KEYS.RESERVATIONS, localReservations);

        addAuditLog(
          officerName || 'Petugas Gate',
          'TICKET_BOARDING',
          `Check-in / Boarding disetujui untuk ${localReservations[idx].bookingCode} (${localReservations[idx].userName} - ${localReservations[idx].vesselName})`
        );

        return {
          success: true,
          reservation: localReservations[idx],
          message: `Berhasil Check-In! Penumpang ${localReservations[idx].userName} dipersilakan naik ke kapal ${localReservations[idx].vesselName}.`,
        };
      }
    );
  },

  completePayment: async (id: string, paymentMethod?: string): Promise<Reservation> => {
    return safeFetch(
      `/api/reservations/${id}/pay`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod }),
      },
      () => {
        localReservations = getLocal(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS);
        const idx = localReservations.findIndex((r) => r.id === id);
        if (idx === -1) throw new Error('Reservation not found');
        localReservations[idx].paymentStatus = 'Lunas';
        localReservations[idx].paymentMethod = paymentMethod || localReservations[idx].paymentMethod;
        setLocal(STORAGE_KEYS.RESERVATIONS, localReservations);
        return localReservations[idx];
      }
    );
  },

  cancelReservation: async (id: string, reason?: string): Promise<Reservation> => {
    return safeFetch(
      `/api/reservations/${id}/cancel`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      },
      () => {
        localReservations = getLocal(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS);
        const idx = localReservations.findIndex((r) => r.id === id);
        if (idx === -1) throw new Error('Reservation not found');
        localReservations[idx].reservationStatus = 'Dibatalkan';
        localReservations[idx].paymentStatus = 'Dibatalkan';
        localReservations[idx].cancellationReason = reason;
        setLocal(STORAGE_KEYS.RESERVATIONS, localReservations);
        return localReservations[idx];
      }
    );
  },

  // ================= WEATHER =================
  getWeather: async (): Promise<WeatherReport[]> => {
    return safeFetch('/api/weather', undefined, () => {
      localWeather = getLocal(STORAGE_KEYS.WEATHER, INITIAL_WEATHER);
      return localWeather;
    });
  },

  updateWeather: async (id: string, data: Partial<WeatherReport>): Promise<WeatherReport> => {
    return safeFetch(
      `/api/weather/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const idx = localWeather.findIndex((w) => w.id === id);
        if (idx !== -1) {
          localWeather[idx] = { ...localWeather[idx], ...data, updatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA' };
          setLocal(STORAGE_KEYS.WEATHER, localWeather);
          return localWeather[idx];
        }
        throw new Error('Weather report not found');
      }
    );
  },

  // ================= NOTIFICATIONS =================
  getNotifications: async (): Promise<NotificationItem[]> => {
    return safeFetch('/api/notifications', undefined, () => {
      localNotifications = getLocal(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
      return localNotifications;
    });
  },

  createNotification: async (data: Partial<NotificationItem>): Promise<NotificationItem> => {
    return safeFetch(
      '/api/notifications',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const newNotif: NotificationItem = {
          id: `notif_${Date.now()}`,
          userId: data.userId || 'all',
          title: data.title || 'Pemberitahuan Pelayaran',
          message: data.message || '',
          type: data.type || 'ship',
          read: false,
          createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        localNotifications = [newNotif, ...localNotifications];
        setLocal(STORAGE_KEYS.NOTIFICATIONS, localNotifications);
        return newNotif;
      }
    );
  },

  // ================= SOS =================
  getSOS: async (): Promise<SOSReport[]> => {
    return safeFetch('/api/sos', undefined, () => {
      localSOS = getLocal(STORAGE_KEYS.SOS, INITIAL_SOS);
      return localSOS;
    });
  },

  sendSOS: async (data: Partial<SOSReport>): Promise<SOSReport> => {
    return safeFetch(
      '/api/sos',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const newSOS: SOSReport = {
          id: `sos_${Date.now()}`,
          userId: data.userId || 'usr_pass_1',
          userName: data.userName || 'Penumpang Darurat',
          userPhone: data.userPhone || '0812-3456-7890',
          vesselName: data.vesselName || 'Lokasi Penumpang',
          lat: data.lat || -1.2610,
          lng: data.lng || 116.8010,
          time: new Date().toLocaleDateString('id-ID') + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA',
          emergencyType: data.emergencyType || 'Darurat Laut',
          description: data.description || 'Panggilan Darurat SOS dari Penumpang',
          bookingCode: data.bookingCode || '-',
          status: 'Baru',
          createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };

        localSOS = [newSOS, ...localSOS];
        setLocal(STORAGE_KEYS.SOS, localSOS);

        const notif: NotificationItem = {
          id: `notif_${Date.now()}`,
          userId: 'all',
          title: '🚨 SINYAL SOS DARURAT TERIKIRIM',
          message: `Panggilan Darurat (${newSOS.emergencyType}) telah dipancarkan ke Basarnas & KSOP. Posisi GPS: ${newSOS.lat.toFixed(4)}, ${newSOS.lng.toFixed(4)}.`,
          type: 'sos',
          read: false,
          createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        localNotifications = [notif, ...localNotifications];
        setLocal(STORAGE_KEYS.NOTIFICATIONS, localNotifications);

        addAuditLog(newSOS.userName, 'EMERGENCY_SOS', `Memicu sinyal SOS: ${newSOS.emergencyType}`);
        return newSOS;
      }
    );
  },

  updateSOS: async (id: string, data: Partial<SOSReport>): Promise<SOSReport> => {
    return safeFetch(
      `/api/sos/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const idx = localSOS.findIndex((s) => s.id === id);
        if (idx !== -1) {
          localSOS[idx] = { ...localSOS[idx], ...data };
          setLocal(STORAGE_KEYS.SOS, localSOS);
          return localSOS[idx];
        }
        throw new Error('SOS not found');
      }
    );
  },

  // ================= AUDIT & STATS =================
  getAudit: async (): Promise<AuditLog[]> => {
    return safeFetch('/api/audit', undefined, () => {
      localAudit = getLocal(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
      return localAudit;
    });
  },

  getStats: async (): Promise<{
    activeVessels: number;
    sailingVessels: number;
    todayReservations: number;
    totalSchedulesToday: number;
    delayedCount: number;
    cancelledCount: number;
    openSOSCount: number;
  }> => {
    return safeFetch('/api/stats', undefined, () => {
      localVessels = getLocal(STORAGE_KEYS.VESSELS, INITIAL_VESSELS);
      localSchedules = getLocal(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
      localReservations = getLocal(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS);
      localSOS = getLocal(STORAGE_KEYS.SOS, INITIAL_SOS);

      const activeVessels = localVessels.length;
      const sailingVessels = localVessels.filter((v) => v.status === 'Dalam Perjalanan').length;
      const todayReservations = localReservations.length;
      const totalSchedulesToday = localSchedules.length;
      const delayedCount = localVessels.filter((v) => v.status === 'Delay').length + localSchedules.filter((s) => s.status === 'delayed').length;
      const cancelledCount = localVessels.filter((v) => v.status === 'Batal').length + localSchedules.filter((s) => s.status === 'cancelled').length;
      const openSOSCount = localSOS.filter((s) => s.status !== 'Selesai').length;

      return {
        activeVessels,
        sailingVessels,
        todayReservations,
        totalSchedulesToday,
        delayedCount,
        cancelledCount,
        openSOSCount,
      };
    });
  },
};
