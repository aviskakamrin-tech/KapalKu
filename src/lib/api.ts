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
import { supabase } from './supabase';

// Storage Keys for Official Data
const STORAGE_KEYS = {
  USERS: 'kapalku_users_kampung_baru_v2',
  VESSELS: 'kapalku_vessels_kampung_baru_v2',
  DOCKS: 'kapalku_docks_kampung_baru_v2',
  ROUTES: 'kapalku_routes_kampung_baru_v2',
  SCHEDULES: 'kapalku_schedules_kampung_baru_v2',
  RESERVATIONS: 'kapalku_reservations_refund_v3',
  WEATHER: 'kapalku_weather_kampung_baru_v2',
  NOTIFICATIONS: 'kapalku_notifications_kampung_baru_v2',
  SOS: 'kapalku_sos_kampung_baru_v2',
  AUDIT: 'kapalku_audit_kampung_baru_v2',
};

// Auto-purge legacy mock data from browser localStorage
if (typeof window !== 'undefined') {
  try {
    const legacyKeys = [
      'kapalku_reservations_kampung_baru_v2',
      'kapalku_users_clean_v1',
      'kapalku_vessels_clean_v1',
      'kapalku_docks_clean_v1',
      'kapalku_routes_clean_v1',
      'kapalku_schedules_clean_v1',
      'kapalku_local_users',
      'kapalku_local_vessels_bombana_v8',
      'kapalku_local_docks_bombana_v8',
      'kapalku_local_routes_bombana_v8',
      'kapalku_local_schedules_bombana_v8',
      'kapalku_local_reservations_bombana_v8',
      'kapalku_local_weather',
      'kapalku_local_notifications',
      'kapalku_local_sos',
      'kapalku_local_audit',
    ];
    legacyKeys.forEach((k) => localStorage.removeItem(k));
  } catch (e) {}
}

// Safe local storage helpers
function getLocal<T>(key: string, initialData: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initialData));
      return initialData;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(initialData) && initialData.length > 0) {
      localStorage.setItem(key, JSON.stringify(initialData));
      return initialData;
    }
    return parsed as T;
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

// Client-side direct Supabase sync helpers
async function clientSyncVessel(v: Vessel) {
  try {
    await supabase.from('vessels').upsert({
      id: v.id,
      name: v.name,
      registration_number: v.registrationNumber,
      type: v.type,
      capacity_passengers: v.capacityPassengers,
      capacity_motorbikes: v.capacityMotorbikes,
      capacity_cars: v.capacityCars,
      capacity_trucks: v.capacityTrucks,
      status: v.status,
      operator_id: v.operatorId,
      operator_name: v.operatorName,
      operator_phone: v.operatorPhone,
      speed_kts: v.speedKts,
      heading_deg: v.headingDeg,
      current_lat: v.currentLat,
      current_lng: v.currentLng,
      last_updated: v.lastUpdated,
      current_route_id: v.currentRouteId,
      operating_routes_description: v.operatingRoutesDescription,
    });
  } catch (e) {}
}

async function clientSyncRoute(r: RouteItem) {
  try {
    await supabase.from('routes').upsert({
      id: r.id,
      name: r.name,
      origin_dock_id: r.originDockId,
      origin_dock_name: r.originDockName,
      destination_dock_id: r.destinationDockId,
      destination_dock_name: r.destinationDockName,
      distance_km: r.distanceKm,
      distance_miles: r.distanceMiles,
      estimated_duration_minutes: r.estimatedDurationMinutes,
      tariff_passenger: r.tariffPassenger,
      tariff_child: r.tariffChild,
      tariff_motorbike: r.tariffMotorbike,
      tariff_car: r.tariffCar,
      tariff_truck: r.tariffTruck,
      status: r.status,
      region: r.region,
      vessel_types_available: r.vesselTypesAvailable,
      frequency_text: r.frequencyText,
      description: r.description,
    });
  } catch (e) {}
}

async function clientSyncSchedule(s: Schedule) {
  try {
    await supabase.from('schedules').upsert({
      id: s.id,
      vessel_id: s.vesselId,
      vessel_name: s.vesselName,
      vessel_type: s.vesselType,
      route_id: s.routeId,
      origin_dock_name: s.originDockName,
      destination_dock_name: s.destinationDockName,
      date: s.date,
      departure_time: s.departureTime,
      estimated_arrival_time: s.estimatedArrivalTime,
      tariff_passenger: s.tariffPassenger,
      tariff_child: s.tariffChild,
      tariff_motorbike: s.tariffMotorbike,
      tariff_car: s.tariffCar,
      tariff_truck: s.tariffTruck,
      status: s.status,
      status_reason: s.statusReason,
      booked_passengers: s.bookedPassengers,
      max_passengers: s.maxPassengers,
      booked_motorbikes: s.bookedMotorbikes,
      booked_cars: s.bookedCars,
      booked_trucks: s.bookedTrucks,
    });
  } catch (e) {}
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

  updateUserProfile: async (id: string, data: Partial<User>, requesterId?: string): Promise<User> => {
    // Validasi otorisasi ketat: Akun hanya bisa diubah dan diatur oleh pengguna itu sendiri
    if (requesterId && requesterId !== id) {
      throw new Error(
        'Akses Ditolak: Akun pengguna hanya dapat diubah dan diatur secara mandiri oleh pengguna yang bersangkutan. Administrator hanya memiliki akses melihat data akun.'
      );
    }

    return safeFetch(
      `/api/users/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(requesterId ? { 'x-user-id': requesterId } : {}),
        },
        body: JSON.stringify(data),
      },
      () => {
        localUsers = getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
        const idx = localUsers.findIndex((u) => u.id === id);
        if (idx !== -1) {
          // Cegah pengubahan hak akses role dari edit profil
          const { role: _ignoredRole, ...safeData } = data as any;
          localUsers[idx] = { ...localUsers[idx], ...safeData };
          setLocal(STORAGE_KEYS.USERS, localUsers);
          addAuditLog(localUsers[idx].name, 'USER_UPDATE', `Pembaruan profil mandiri oleh pengguna: ${localUsers[idx].name}`);
          return localUsers[idx];
        }
        throw new Error('Pengguna tidak ditemukan');
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
        clientSyncVessel(newVessel);
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
          clientSyncVessel(localVessels[idx]);
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
    return safeFetch('/api/docks', undefined, async () => {
      try {
        const { data, error } = await supabase.from('docks').select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
          localDocks = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            address: d.address,
            lat: Number(d.lat),
            lng: Number(d.lng),
            status: d.status,
            province: d.province,
            city: d.city,
            region: d.region,
            dockRole: d.dock_role || 'both',
            facilities: d.facilities || [],
            contactPhone: d.contact_phone,
          }));
          setLocal(STORAGE_KEYS.DOCKS, localDocks);
          return localDocks;
        }
      } catch (e) {}
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
      async () => {
        const newDock: Dock = {
          id: `dock_${Date.now()}`,
          name: data.name || 'Dermaga Baru',
          address: data.address || 'Alamat Dermaga',
          lat: data.lat || -1.2500,
          lng: data.lng || 116.8200,
          status: data.status || 'Aktif',
          province: data.province || 'Sulawesi Tenggara',
          region: data.region || 'Sulawesi',
          city: data.city || '',
          dockRole: data.dockRole || 'both',
          facilities: data.facilities || [],
          contactPhone: data.contactPhone || '',
        };
        try {
          await supabase.from('docks').upsert({
            id: newDock.id,
            name: newDock.name,
            address: newDock.address,
            lat: newDock.lat,
            lng: newDock.lng,
            status: newDock.status,
            province: newDock.province,
            city: newDock.city,
            region: newDock.region,
            dock_role: newDock.dockRole,
            facilities: newDock.facilities,
            contact_phone: newDock.contactPhone,
          });
        } catch (e) {}
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
      async () => {
        const idx = localDocks.findIndex((d) => d.id === id);
        if (idx !== -1) {
          localDocks[idx] = { ...localDocks[idx], ...data };
          try {
            await supabase.from('docks').update({
              name: localDocks[idx].name,
              address: localDocks[idx].address,
              lat: localDocks[idx].lat,
              lng: localDocks[idx].lng,
              status: localDocks[idx].status,
              province: localDocks[idx].province,
              city: localDocks[idx].city,
              region: localDocks[idx].region,
              dock_role: localDocks[idx].dockRole,
              facilities: localDocks[idx].facilities,
              contact_phone: localDocks[idx].contactPhone,
            }).eq('id', id);
          } catch (e) {}
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
      async () => {
        try {
          await supabase.from('docks').delete().eq('id', id);
        } catch (e) {}
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
        try { supabase.from('vessels').delete().eq('id', id); } catch (e) {}
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
        clientSyncRoute(newRoute);
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
          clientSyncRoute(localRoutes[idx]);
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
        try { supabase.from('routes').delete().eq('id', id); } catch (e) {}
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
        clientSyncSchedule(newSchedule);
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
          clientSyncSchedule(localSchedules[idx]);
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
        try { supabase.from('schedules').delete().eq('id', id); } catch (e) {}
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
        const now = new Date().toLocaleDateString('id-ID') + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        localReservations[idx].reservationStatus = 'Dibatalkan';
        localReservations[idx].paymentStatus = 'Dibatalkan';
        localReservations[idx].cancellationReason = reason || 'Dibatalkan oleh penumpang';
        localReservations[idx].cancelledAt = now;
        setLocal(STORAGE_KEYS.RESERVATIONS, localReservations);
        addAuditLog(localReservations[idx].userName, 'BOOKING_CANCEL', `Pembatalan tiket ${localReservations[idx].bookingCode}: ${reason || '-'}`);
        return localReservations[idx];
      }
    );
  },

  requestTicketRefund: async (
    id: string,
    refundData: {
      reason: string;
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    }
  ): Promise<Reservation> => {
    return safeFetch(
      `/api/reservations/${id}/refund-request`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refundData),
      },
      () => {
        localReservations = getLocal(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS);
        const idx = localReservations.findIndex((r) => r.id === id);
        if (idx === -1) throw new Error('Tiket tidak ditemukan');
        const now = new Date().toLocaleDateString('id-ID') + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        localReservations[idx] = {
          ...localReservations[idx],
          reservationStatus: 'Dibatalkan',
          cancellationReason: refundData.reason,
          cancelledAt: now,
          refundStatus: 'Diajukan',
          refundDetails: {
            requestedAt: now,
            reason: refundData.reason,
            bankName: refundData.bankName,
            accountNumber: refundData.accountNumber,
            accountHolder: refundData.accountHolder,
            refundAmount: localReservations[idx].totalPrice,
          },
        };
        setLocal(STORAGE_KEYS.RESERVATIONS, localReservations);

        // Notify user & officer
        localNotifications = [
          {
            id: `notif_rf_${Date.now()}`,
            userId: localReservations[idx].userId,
            title: '💸 Pengajuan Refund Berhasil Dikirim',
            message: `Permintaan pengembalian dana tiket ${localReservations[idx].bookingCode} sebesar Rp ${localReservations[idx].totalPrice.toLocaleString('id-ID')} ke rekening ${refundData.bankName} (${refundData.accountNumber}) sedang menunggu persetujuan Admin.`,
            type: 'booking',
            read: false,
            createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          },
          ...localNotifications,
        ];
        setLocal(STORAGE_KEYS.NOTIFICATIONS, localNotifications);

        addAuditLog(
          localReservations[idx].userName,
          'REFUND_REQUEST',
          `Pengajuan refund tiket ${localReservations[idx].bookingCode} senilai Rp ${localReservations[idx].totalPrice.toLocaleString('id-ID')} (Rek: ${refundData.bankName} ${refundData.accountNumber} a.n ${refundData.accountHolder})`
        );

        return localReservations[idx];
      }
    );
  },

  approveRefund: async (
    id: string,
    approvalData?: {
      transferProofRef?: string;
      adminNote?: string;
      officerName?: string;
    }
  ): Promise<Reservation> => {
    return safeFetch(
      `/api/reservations/${id}/refund-approve`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalData || {}),
      },
      () => {
        localReservations = getLocal(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS);
        const idx = localReservations.findIndex((r) => r.id === id);
        if (idx === -1) throw new Error('Tiket tidak ditemukan');
        const now = new Date().toLocaleDateString('id-ID') + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const refNo = approvalData?.transferProofRef || `TRF-REF-${Date.now().toString().slice(-6)}`;
        const note = approvalData?.adminNote || 'Pengajuan refund tiket telah disetujui & dana berhasil dikembalikan ke rekening pemohon.';
        const officer = approvalData?.officerName || 'Administrator Keuangan';

        const prevDetails = localReservations[idx].refundDetails;

        localReservations[idx] = {
          ...localReservations[idx],
          refundStatus: 'Disetujui',
          refundDetails: {
            requestedAt: prevDetails?.requestedAt || now,
            reason: prevDetails?.reason || localReservations[idx].cancellationReason || 'Pembatalan tiket',
            bankName: prevDetails?.bankName || 'Bank/E-Wallet',
            accountNumber: prevDetails?.accountNumber || '-',
            accountHolder: prevDetails?.accountHolder || localReservations[idx].userName,
            refundAmount: prevDetails?.refundAmount || localReservations[idx].totalPrice,
            adminNote: note,
            processedAt: now,
            processedBy: officer,
            transferProofRef: refNo,
          },
        };
        setLocal(STORAGE_KEYS.RESERVATIONS, localReservations);

        // Hapus tanda / notifikasi pengajuan refund lama agar tidak ada lagi tanda "pengajuan"
        const targetBookingCode = localReservations[idx].bookingCode;
        localNotifications = localNotifications.filter(
          (n) => !(
            (n.title.toLowerCase().includes('pengajuan') || n.title.toLowerCase().includes('permintaan')) &&
            (n.message.includes(targetBookingCode) || n.title.includes(targetBookingCode))
          )
        );

        // Push notifikasi resmi bahwa dana telah berhasil ditransfer (tanpa kata "pengajuan")
        localNotifications = [
          {
            id: `notif_rf_app_${Date.now()}`,
            userId: localReservations[idx].userId,
            title: '✅ Refund Tiket Selesai (Dana Telah Ditransfer)',
            message: `Dana pengembalian tiket ${localReservations[idx].bookingCode} sebesar Rp ${localReservations[idx].totalPrice.toLocaleString('id-ID')} telah berhasil ditransfer ke rekening Anda (No. Ref: ${refNo}).`,
            type: 'booking',
            read: false,
            createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          },
          ...localNotifications,
        ];
        setLocal(STORAGE_KEYS.NOTIFICATIONS, localNotifications);

        addAuditLog(
          officer,
          'REFUND_APPROVED',
          `Menyetujui refund tiket ${localReservations[idx].bookingCode} sebesar Rp ${localReservations[idx].totalPrice.toLocaleString('id-ID')} (Ref: ${refNo})`
        );

        return localReservations[idx];
      }
    );
  },

  rejectRefund: async (
    id: string,
    rejectionData: {
      reason: string;
      officerName?: string;
    }
  ): Promise<Reservation> => {
    return safeFetch(
      `/api/reservations/${id}/refund-reject`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rejectionData),
      },
      () => {
        localReservations = getLocal(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS);
        const idx = localReservations.findIndex((r) => r.id === id);
        if (idx === -1) throw new Error('Tiket tidak ditemukan');
        const now = new Date().toLocaleDateString('id-ID') + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const officer = rejectionData?.officerName || 'Administrator';
        const prevDetails = localReservations[idx].refundDetails;

        localReservations[idx] = {
          ...localReservations[idx],
          refundStatus: 'Ditolak',
          refundDetails: {
            requestedAt: prevDetails?.requestedAt || now,
            reason: prevDetails?.reason || localReservations[idx].cancellationReason || 'Pembatalan tiket',
            bankName: prevDetails?.bankName || 'Bank/E-Wallet',
            accountNumber: prevDetails?.accountNumber || '-',
            accountHolder: prevDetails?.accountHolder || localReservations[idx].userName,
            refundAmount: prevDetails?.refundAmount || localReservations[idx].totalPrice,
            adminNote: rejectionData.reason,
            processedAt: now,
            processedBy: officer,
          },
        };
        setLocal(STORAGE_KEYS.RESERVATIONS, localReservations);

        // Push notification to user
        localNotifications = [
          {
            id: `notif_rf_rej_${Date.now()}`,
            userId: localReservations[idx].userId,
            title: '⚠️ Pengajuan Refund Tiket Ditolak',
            message: `Permintaan refund tiket ${localReservations[idx].bookingCode} ditolak oleh Admin. Alasan: ${rejectionData.reason}`,
            type: 'cancel',
            read: false,
            createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          },
          ...localNotifications,
        ];
        setLocal(STORAGE_KEYS.NOTIFICATIONS, localNotifications);

        addAuditLog(
          officer,
          'REFUND_REJECTED',
          `Menolak refund tiket ${localReservations[idx].bookingCode}: ${rejectionData.reason}`
        );

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

  // ================= CLEAR SAMPLE DATA =================
  clearAllData: async (): Promise<{ success: boolean; message: string }> => {
    localUsers = [];
    localVessels = [];
    localDocks = [];
    localRoutes = [];
    localSchedules = [];
    localReservations = [];
    localWeather = [];
    localNotifications = [];
    localSOS = [];
    localAudit = [];

    if (typeof window !== 'undefined') {
      try {
        Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
      } catch (e) {}
    }

    try {
      await fetch('/api/clear-sample-data', { method: 'POST' });
    } catch (e) {}

    return { success: true, message: 'Semua data sample berhasil dihapus.' };
  },

  loadOfficialKampungBaruData: async (): Promise<{ success: boolean; message: string }> => {
    localDocks = [...INITIAL_DOCKS];
    localVessels = [...INITIAL_VESSELS];
    localRoutes = [...INITIAL_ROUTES];
    localSchedules = [...INITIAL_SCHEDULES];
    localWeather = [...INITIAL_WEATHER];
    localNotifications = [...INITIAL_NOTIFICATIONS];
    localAudit = [...INITIAL_AUDIT_LOGS];

    setLocal(STORAGE_KEYS.DOCKS, localDocks);
    setLocal(STORAGE_KEYS.VESSELS, localVessels);
    setLocal(STORAGE_KEYS.ROUTES, localRoutes);
    setLocal(STORAGE_KEYS.SCHEDULES, localSchedules);
    setLocal(STORAGE_KEYS.WEATHER, localWeather);
    setLocal(STORAGE_KEYS.NOTIFICATIONS, localNotifications);
    setLocal(STORAGE_KEYS.AUDIT, localAudit);

    try {
      await fetch('/api/seed-kampung-baru', { method: 'POST' });
    } catch (e) {}

    return {
      success: true,
      message: 'Data resmi Pelabuhan Ferry Kampung Baru (Kasipute), KMP Oputa Yi Ko, dan KMP Bontoharu berhasil dimuat.',
    };
  },
};
