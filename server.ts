import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
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
} from './src/data/mockData';
import { User, Vessel, Dock, RouteItem, Schedule, Reservation, WeatherReport, NotificationItem, SOSReport, AuditLog } from './src/types';

// Supabase Configuration
let currentSupabaseUrl = process.env.SUPABASE_URL || 'https://gkklzgdxpqfxskuvsdpu.supabase.co';
let currentSupabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdra2x6Z2R4cHFmeHNrdXZzZHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjE5MTgsImV4cCI6MjEwNTY5NzkxOH0.y06Q6MotYwl4PW8rh3BK5VnWf-YoL97kN8coGYTrq5g';

export let supabase = createClient(currentSupabaseUrl, currentSupabaseKey);

// In-Memory & Cache Database
let users = [...INITIAL_USERS];
let vessels: Vessel[] = [...INITIAL_VESSELS];
let docks: Dock[] = [...INITIAL_DOCKS];
let routes: RouteItem[] = [...INITIAL_ROUTES];
let schedules: Schedule[] = [...INITIAL_SCHEDULES];
let reservations: Reservation[] = [...INITIAL_RESERVATIONS];
let weatherReports: WeatherReport[] = [...INITIAL_WEATHER];
let notifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];
let sosReports: SOSReport[] = [...INITIAL_SOS];
let auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];

// Synchronize from Supabase when tables are present
async function syncFromSupabase() {
  try {
    const { data: dbDocks, error: dockErr } = await supabase.from('docks').select('*');
    if (!dockErr && dbDocks && dbDocks.length > 0) {
      docks = dbDocks.map((d: any) => ({
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
      console.log(`[Supabase] Loaded ${docks.length} docks from database`);
    }

    const { data: dbVessels, error: vesErr } = await supabase.from('vessels').select('*');
    if (!vesErr && dbVessels && dbVessels.length > 0) {
      vessels = dbVessels.map((v: any) => ({
        id: v.id,
        name: v.name,
        registrationNumber: v.registration_number,
        type: v.type,
        capacityPassengers: Number(v.capacity_passengers),
        capacityMotorbikes: Number(v.capacity_motorbikes),
        capacityCars: Number(v.capacity_cars),
        capacityTrucks: Number(v.capacity_trucks || 0),
        status: v.status,
        operatorId: v.operator_id,
        operatorName: v.operator_name,
        operatorPhone: v.operator_phone,
        speedKts: Number(v.speed_kts),
        headingDeg: Number(v.heading_deg),
        currentLat: Number(v.current_lat),
        currentLng: Number(v.current_lng),
        lastUpdated: v.last_updated,
        currentRouteId: v.current_route_id,
        operatingRoutesDescription: v.operating_routes_description,
      }));
      console.log(`[Supabase] Loaded ${vessels.length} vessels from database`);
    }

    const { data: dbRoutes, error: routeErr } = await supabase.from('routes').select('*');
    if (!routeErr && dbRoutes && dbRoutes.length > 0) {
      routes = dbRoutes.map((r: any) => ({
        id: r.id,
        name: r.name,
        originDockId: r.origin_dock_id,
        originDockName: r.origin_dock_name,
        destinationDockId: r.destination_dock_id,
        destinationDockName: r.destination_dock_name,
        distanceKm: Number(r.distance_km || 0),
        distanceMiles: r.distance_miles ? Number(r.distance_miles) : undefined,
        estimatedDurationMinutes: Number(r.estimated_duration_minutes || 60),
        tariffPassenger: Number(r.tariff_passenger || 0),
        tariffChild: r.tariff_child ? Number(r.tariff_child) : undefined,
        tariffMotorbike: Number(r.tariff_motorbike || 0),
        tariffCar: Number(r.tariff_car || 0),
        tariffTruck: r.tariff_truck ? Number(r.tariff_truck) : undefined,
        status: r.status,
        region: r.region,
        vesselTypesAvailable: r.vessel_types_available || [],
        description: r.description,
        frequencyText: r.frequency_text,
      }));
      console.log(`[Supabase] Loaded ${routes.length} routes from database`);
    }

    const { data: dbSchedules, error: schErr } = await supabase.from('schedules').select('*');
    if (!schErr && dbSchedules && dbSchedules.length > 0) {
      schedules = dbSchedules.map((s: any) => ({
        id: s.id,
        vesselId: s.vessel_id,
        vesselName: s.vessel_name,
        vesselType: s.vessel_type,
        routeId: s.route_id,
        originDockName: s.origin_dock_name,
        destinationDockName: s.destination_dock_name,
        date: s.date,
        departureTime: s.departure_time,
        estimatedArrivalTime: s.estimated_arrival_time,
        tariffPassenger: Number(s.tariff_passenger || 0),
        tariffChild: s.tariff_child ? Number(s.tariff_child) : undefined,
        tariffMotorbike: Number(s.tariff_motorbike || 0),
        tariffCar: Number(s.tariff_car || 0),
        tariffTruck: s.tariff_truck ? Number(s.tariff_truck) : undefined,
        status: s.status,
        statusReason: s.status_reason,
        bookedPassengers: Number(s.booked_passengers || 0),
        maxPassengers: Number(s.max_passengers || 100),
        bookedMotorbikes: Number(s.booked_motorbikes || 0),
        bookedCars: Number(s.booked_cars || 0),
        bookedTrucks: Number(s.booked_trucks || 0),
      }));
      console.log(`[Supabase] Loaded ${schedules.length} schedules from database`);
    }

    const { data: dbReservations, error: resErr } = await supabase.from('reservations').select('*');
    if (!resErr && dbReservations && dbReservations.length > 0) {
      reservations = dbReservations.map((r: any) => ({
        id: r.id,
        bookingCode: r.booking_code,
        userId: r.user_id,
        userName: r.user_name,
        userPhone: r.user_phone,
        userEmail: r.user_email,
        scheduleId: r.schedule_id,
        vesselName: r.vessel_name,
        vesselType: r.vessel_type,
        originDockName: r.origin_dock_name,
        destinationDockName: r.destination_dock_name,
        travelDate: r.travel_date,
        departureTime: r.departure_time,
        estimatedArrivalTime: r.estimated_arrival_time,
        passengersCount: Number(r.passengers_count),
        motorbikesCount: Number(r.motorbikes_count),
        carsCount: Number(r.cars_count),
        passengersList: r.passengers_list || [],
        vehiclePlate: r.vehicle_plate,
        vehicleType: r.vehicle_type,
        basePrice: Number(r.base_price || 0),
        insuranceFee: Number(r.insurance_fee || 0),
        portServiceFee: Number(r.port_service_fee || 0),
        totalPrice: Number(r.total_price),
        paymentMethod: r.payment_method,
        paymentStatus: r.payment_status,
        reservationStatus: r.reservation_status,
        checkInStatus: r.check_in_status || 'Belum Check-In',
        checkInTime: r.check_in_time,
        scannedBy: r.scanned_by,
        scannedAt: r.scanned_at,
        gateNumber: r.gate_number,
        createdAt: r.created_at,
        qrCodeUrl: r.qr_code_url,
        paymentDetails: r.payment_details,
      }));
      console.log(`[Supabase] Loaded ${reservations.length} reservations from database`);
    }
  } catch (err) {
    console.log('[Supabase] Initial sync skipped or tables not yet migrated:', err);
  }
}

// Direct Sync Helpers to Supabase
async function syncRouteToSupabase(route: RouteItem) {
  try {
    await supabase.from('routes').upsert({
      id: route.id,
      name: route.name,
      origin_dock_id: route.originDockId || null,
      origin_dock_name: route.originDockName,
      destination_dock_id: route.destinationDockId || null,
      destination_dock_name: route.destinationDockName,
      distance_km: route.distanceKm || 0,
      distance_miles: route.distanceMiles || null,
      estimated_duration_minutes: route.estimatedDurationMinutes || 60,
      tariff_passenger: route.tariffPassenger || 0,
      tariff_child: route.tariffChild || 0,
      tariff_motorbike: route.tariffMotorbike || 0,
      tariff_car: route.tariffCar || 0,
      tariff_truck: route.tariffTruck || 0,
      status: route.status || 'Operasional',
      region: route.region || 'Sulawesi',
      vessel_types_available: route.vesselTypesAvailable || [],
      description: route.description || '',
      frequency_text: route.frequencyText || '',
    });
    console.log(`[Supabase] Route synced: ${route.name}`);
  } catch (err: any) {
    console.warn(`[Supabase] Route sync notice: ${err?.message}`);
  }
}

async function deleteRouteFromSupabase(id: string) {
  try {
    await supabase.from('routes').delete().eq('id', id);
  } catch (err: any) {
    console.warn(`[Supabase] Route delete notice: ${err?.message}`);
  }
}

async function syncScheduleToSupabase(schedule: Schedule) {
  try {
    await supabase.from('schedules').upsert({
      id: schedule.id,
      vessel_id: schedule.vesselId || null,
      vessel_name: schedule.vesselName,
      vessel_type: schedule.vesselType,
      route_id: schedule.routeId || null,
      origin_dock_name: schedule.originDockName,
      destination_dock_name: schedule.destinationDockName,
      date: schedule.date,
      departure_time: schedule.departureTime,
      estimated_arrival_time: schedule.estimatedArrivalTime,
      tariff_passenger: schedule.tariffPassenger || 0,
      tariff_child: schedule.tariffChild || 0,
      tariff_motorbike: schedule.tariffMotorbike || 0,
      tariff_car: schedule.tariffCar || 0,
      tariff_truck: schedule.tariffTruck || 0,
      status: schedule.status || 'scheduled',
      status_reason: schedule.statusReason || null,
      booked_passengers: schedule.bookedPassengers || 0,
      max_passengers: schedule.maxPassengers || 100,
      booked_motorbikes: schedule.bookedMotorbikes || 0,
      booked_cars: schedule.bookedCars || 0,
      booked_trucks: schedule.bookedTrucks || 0,
    });
    console.log(`[Supabase] Schedule synced: ${schedule.id}`);
  } catch (err: any) {
    console.warn(`[Supabase] Schedule sync notice: ${err?.message}`);
  }
}

async function deleteScheduleFromSupabase(id: string) {
  try {
    await supabase.from('schedules').delete().eq('id', id);
  } catch (err: any) {
    console.warn(`[Supabase] Schedule delete notice: ${err?.message}`);
  }
}

async function syncVesselToSupabase(vessel: Vessel) {
  try {
    await supabase.from('vessels').upsert({
      id: vessel.id,
      name: vessel.name,
      registration_number: vessel.registrationNumber || null,
      type: vessel.type,
      capacity_passengers: vessel.capacityPassengers || 50,
      capacity_motorbikes: vessel.capacityMotorbikes || 0,
      capacity_cars: vessel.capacityCars || 0,
      capacity_trucks: vessel.capacityTrucks || 0,
      status: vessel.status || 'Bertambat',
      operator_id: vessel.operatorId || null,
      operator_name: vessel.operatorName || null,
      operator_phone: vessel.operatorPhone || null,
      speed_kts: vessel.speedKts || 0,
      heading_deg: vessel.headingDeg || 0,
      current_lat: vessel.currentLat,
      current_lng: vessel.currentLng,
      last_updated: vessel.lastUpdated,
      current_route_id: vessel.currentRouteId || null,
      operating_routes_description: vessel.operatingRoutesDescription || null,
    });
    console.log(`[Supabase] Vessel synced: ${vessel.name}`);
  } catch (err: any) {
    console.warn(`[Supabase] Vessel sync notice: ${err?.message}`);
  }
}

async function deleteVesselFromSupabase(id: string) {
  try {
    await supabase.from('vessels').delete().eq('id', id);
  } catch (err: any) {
    console.warn(`[Supabase] Vessel delete notice: ${err?.message}`);
  }
}

async function syncDockToSupabase(dock: Dock) {
  try {
    await supabase.from('docks').upsert({
      id: dock.id,
      name: dock.name,
      address: dock.address,
      lat: dock.lat,
      lng: dock.lng,
      status: dock.status || 'Aktif',
      province: dock.province || null,
      city: dock.city || null,
      region: dock.region || null,
      dock_role: dock.dockRole || 'both',
      facilities: dock.facilities || [],
      contact_phone: dock.contactPhone || null,
    });
    console.log(`[Supabase] Dock synced: ${dock.name}`);
  } catch (err: any) {
    console.warn(`[Supabase] Dock sync notice: ${err?.message}`);
  }
}

async function deleteDockFromSupabase(id: string) {
  try {
    await supabase.from('docks').delete().eq('id', id);
  } catch (err: any) {
    console.warn(`[Supabase] Dock delete notice: ${err?.message}`);
  }
}

async function syncReservationToSupabase(res: Reservation) {
  try {
    await supabase.from('reservations').upsert({
      id: res.id,
      booking_code: res.bookingCode,
      user_id: res.userId,
      user_name: res.userName,
      user_phone: res.userPhone,
      user_email: res.userEmail || null,
      schedule_id: res.scheduleId || null,
      vessel_name: res.vesselName,
      vessel_type: res.vesselType,
      origin_dock_name: res.originDockName,
      destination_dock_name: res.destinationDockName,
      travel_date: res.travelDate,
      departure_time: res.departureTime,
      estimated_arrival_time: res.estimatedArrivalTime || null,
      passengers_count: res.passengersCount,
      motorbikes_count: res.motorbikesCount,
      cars_count: res.carsCount,
      passengers_list: res.passengersList || [],
      vehicle_plate: res.vehiclePlate || null,
      vehicle_type: res.vehicleType || null,
      base_price: res.basePrice,
      insurance_fee: res.insuranceFee,
      port_service_fee: res.portServiceFee,
      total_price: res.totalPrice,
      payment_method: res.paymentMethod || null,
      payment_status: res.paymentStatus,
      reservation_status: res.reservationStatus,
      check_in_status: res.checkInStatus,
      check_in_time: res.checkInTime || null,
      scanned_by: res.scannedBy || null,
      scanned_at: res.scannedAt || null,
      gate_number: res.gateNumber || null,
      created_at: res.createdAt,
      qr_code_url: res.qrCodeUrl || null,
      cancellation_reason: res.cancellationReason || null,
      cancelled_at: res.cancelledAt || null,
      payment_details: res.paymentDetails || null,
    });
    console.log(`[Supabase] Reservation synced: ${res.bookingCode}`);
  } catch (err: any) {
    console.warn(`[Supabase] Reservation sync notice: ${err?.message}`);
  }
}

// Helper log function
function addAuditLog(actorName: string, actorRole: string, action: string, details: string) {
  const newLog: AuditLog = {
    id: `log_${Date.now()}`,
    actorName,
    actorRole,
    action,
    details,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA',
  };
  auditLogs.unshift(newLog);
}

// Background simulation: Nudge vessels with status 'Dalam Perjalanan'
setInterval(() => {
  const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WITA';
  
  vessels = vessels.map((v) => {
    if (v.status === 'Dalam Perjalanan') {
      // Small delta movement
      const latDelta = (Math.random() - 0.4) * 0.0005;
      const lngDelta = (Math.random() - 0.3) * 0.0005;
      const newLat = Number((v.currentLat + latDelta).toFixed(5));
      const newLng = Number((v.currentLng + lngDelta).toFixed(5));
      
      return {
        ...v,
        currentLat: newLat,
        currentLng: newLng,
        speedKts: Number((10 + Math.random() * 4).toFixed(1)),
        lastUpdated: nowStr,
      };
    }
    return v;
  });
}, 5000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'KapalKu Maritime Platform' });
  });

  // Auth & Users
  app.get('/api/users', (_req, res) => {
    res.json(users);
  });

  app.post('/api/auth/login', (req, res) => {
    const { identifier, password, role } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Nama, email, atau nomor HP wajib diisi.' });
    }

    const cleanId = String(identifier).trim();
    const cleanIdLower = cleanId.toLowerCase();

    // 1. Direct search by email, phone, or full name
    let matchedUser = users.find(
      (u) =>
        u.email.toLowerCase() === cleanIdLower ||
        u.phone.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, '') ||
        u.name.toLowerCase() === cleanIdLower
    );

    // 2. Partial search in registered users
    if (!matchedUser) {
      matchedUser = users.find(
        (u) =>
          u.name.toLowerCase().includes(cleanIdLower) ||
          (u.email && u.email.toLowerCase().includes(cleanIdLower))
      );
    }

    // 3. If still not found, create new account with the EXACT name/identifier entered
    if (!matchedUser) {
      let derivedName = cleanId;
      if (cleanId.includes('@')) {
        const prefix = cleanId.split('@')[0];
        derivedName = prefix
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
      } else if (cleanId.match(/^[0-9+]/)) {
        derivedName = `Pengguna ${cleanId.slice(-4)}`;
      }

      matchedUser = {
        id: `usr_${Date.now()}`,
        name: derivedName,
        email: cleanId.includes('@') ? cleanIdLower : `${cleanIdLower.replace(/[^a-z0-9]/g, '') || 'user'}@kapalku.id`,
        phone: cleanId.match(/^[0-9+]/) ? cleanId : '0812-0000-0000',
        role: role || 'passenger',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(derivedName)}`,
      };
      users.push(matchedUser);
    }

    addAuditLog(matchedUser.name, matchedUser.role, 'USER_LOGIN', `Pengguna berhasil login: ${matchedUser.name} (${matchedUser.role})`);

    return res.json({
      user: matchedUser,
      token: `token_${matchedUser.id}_${Date.now()}`,
      message: `Selamat datang kembali, ${matchedUser.name}!`,
    });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, phone } = req.body;

    if (!name || (!email && !phone)) {
      return res.status(400).json({ error: 'Nama lengkap dan Email atau Nomor HP wajib diisi.' });
    }

    const existingUser = users.find(
      (u) =>
        (email && u.email.toLowerCase() === email.trim().toLowerCase()) ||
        (phone && u.phone === phone.trim())
    );

    if (existingUser) {
      return res.status(400).json({ error: 'Email atau Nomor HP sudah terdaftar. Silakan langsung masuk.' });
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : `${phone.replace(/[^0-9]/g, '')}@kapalku.id`,
      phone: phone ? phone.trim() : '0812-0000-0000',
      role: 'passenger',
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    };

    users.push(newUser);
    addAuditLog(newUser.name, newUser.role, 'USER_REGISTER', `Pendaftaran akun baru: ${newUser.name} (${newUser.role})`);

    // Add welcome notification
    notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: newUser.id,
      title: '🎉 Selamat Datang di KapalKu',
      message: `Halo ${newUser.name}, akun Anda telah aktif. Nikmati kemudahan info jadwal, live tracking dan tiket kapal.`,
      type: 'ship',
      read: false,
      createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    });

    return res.status(201).json({
      user: newUser,
      token: `token_${newUser.id}_${Date.now()}`,
      message: 'Pendaftaran berhasil!',
    });
  });

  // Users Directory & Profile Management
  app.get('/api/users', (_req, res) => {
    // Return all users (read-only directory for admin)
    res.json(users);
  });

  app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const requesterId = req.headers['x-user-id'] as string;

    // Validasi otorisasi: Akun pengguna HANYA bisa diubah dan diatur oleh pengguna itu sendiri
    if (requesterId && requesterId !== id) {
      return res.status(403).json({
        error: 'Akses Ditolak: Akun pengguna hanya dapat diubah dan diatur secara mandiri oleh pengguna yang bersangkutan. Administrator hanya memiliki akses melihat data akun.',
      });
    }

    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    const { role: _ignoredRole, ...safeData } = req.body;
    users[index] = { ...users[index], ...safeData };
    addAuditLog(users[index].name, users[index].role, 'USER_UPDATE', `Pembaruan profil mandiri oleh pengguna: ${users[index].name}`);
    res.json(users[index]);
  });

  // Vessels
  app.get('/api/vessels', (_req, res) => {
    res.json(vessels);
  });

  app.post('/api/vessels', (req, res) => {
    const newVessel: Vessel = {
      id: `vsl_${Date.now()}`,
      ...req.body,
      lastUpdated: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA',
    };
    vessels.unshift(newVessel);
    syncVesselToSupabase(newVessel);
    addAuditLog(req.body.operatorName || 'Admin', 'admin', 'ADD_VESSEL', `Menambah kapal baru: ${newVessel.name}`);
    res.status(201).json(newVessel);
  });

  app.put('/api/vessels/:id', (req, res) => {
    const { id } = req.params;
    const index = vessels.findIndex((v) => v.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Vessel not found' });
    }
    const updated = {
      ...vessels[index],
      ...req.body,
      lastUpdated: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA',
    };
    vessels[index] = updated;
    syncVesselToSupabase(updated);
    addAuditLog('Operator / Syahbandar', 'admin', 'UPDATE_VESSEL', `Memperbarui status kapal: ${updated.name} -> ${updated.status}`);
    res.json(updated);
  });

  app.delete('/api/vessels/:id', (req, res) => {
    const { id } = req.params;
    const target = vessels.find((v) => v.id === id);
    vessels = vessels.filter((v) => v.id !== id);
    deleteVesselFromSupabase(id);
    if (target) {
      addAuditLog('Admin Syahbandar', 'admin', 'DELETE_VESSEL', `Menghapus armada kapal: ${target.name}`);
    }
    res.json({ success: true });
  });

  // GPS Update endpoint for Operator App
  app.post('/api/gps/update', (req, res) => {
    const { vesselId, lat, lng, speedKts, headingDeg, status } = req.body;
    const vIndex = vessels.findIndex((v) => v.id === vesselId);
    if (vIndex !== -1) {
      vessels[vIndex] = {
        ...vessels[vIndex],
        currentLat: Number(lat),
        currentLng: Number(lng),
        speedKts: speedKts !== undefined ? Number(speedKts) : vessels[vIndex].speedKts,
        headingDeg: headingDeg !== undefined ? Number(headingDeg) : vessels[vIndex].headingDeg,
        status: status || vessels[vIndex].status,
        lastUpdated: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WITA',
      };
      syncVesselToSupabase(vessels[vIndex]);
      return res.json({ success: true, vessel: vessels[vIndex] });
    }
    res.status(404).json({ error: 'Vessel not found' });
  });

  // Docks
  app.get('/api/docks', (_req, res) => {
    res.json(docks);
  });

  app.post('/api/docks', (req, res) => {
    const newDock: Dock = { id: `dock_${Date.now()}`, ...req.body };
    docks.push(newDock);
    syncDockToSupabase(newDock);
    addAuditLog('Admin Syahbandar', 'admin', 'ADD_DOCK', `Menambah dermaga: ${newDock.name}`);
    res.status(201).json(newDock);
  });

  app.put('/api/docks/:id', (req, res) => {
    const { id } = req.params;
    const index = docks.findIndex((d) => d.id === id);
    if (index === -1) return res.status(404).json({ error: 'Dock not found' });
    docks[index] = { ...docks[index], ...req.body };
    syncDockToSupabase(docks[index]);
    addAuditLog('Admin Syahbandar', 'admin', 'UPDATE_DOCK', `Memperbarui dermaga: ${docks[index].name}`);
    res.json(docks[index]);
  });

  app.delete('/api/docks/:id', (req, res) => {
    const { id } = req.params;
    const target = docks.find((d) => d.id === id);
    docks = docks.filter((d) => d.id !== id);
    deleteDockFromSupabase(id);
    if (target) {
      addAuditLog('Admin Syahbandar', 'admin', 'DELETE_DOCK', `Menghapus dermaga: ${target.name}`);
    }
    res.json({ success: true });
  });

  // Routes
  app.get('/api/routes', (_req, res) => {
    res.json(routes);
  });

  app.post('/api/routes', (req, res) => {
    const newRoute: RouteItem = { id: `route_${Date.now()}`, ...req.body };
    routes.push(newRoute);
    syncRouteToSupabase(newRoute);
    addAuditLog('Admin Syahbandar', 'admin', 'ADD_ROUTE', `Menambah rute pelayaran: ${newRoute.name}`);
    res.status(201).json(newRoute);
  });

  app.put('/api/routes/:id', (req, res) => {
    const { id } = req.params;
    const index = routes.findIndex((r) => r.id === id);
    if (index === -1) return res.status(404).json({ error: 'Route not found' });
    routes[index] = { ...routes[index], ...req.body };
    syncRouteToSupabase(routes[index]);
    addAuditLog('Admin Syahbandar', 'admin', 'UPDATE_ROUTE', `Memperbarui jalur pelayaran: ${routes[index].name}`);
    res.json(routes[index]);
  });

  app.delete('/api/routes/:id', (req, res) => {
    const { id } = req.params;
    const target = routes.find((r) => r.id === id);
    routes = routes.filter((r) => r.id !== id);
    deleteRouteFromSupabase(id);
    if (target) {
      addAuditLog('Admin Syahbandar', 'admin', 'DELETE_ROUTE', `Menghapus jalur pelayaran: ${target.name}`);
    }
    res.json({ success: true });
  });

  // Schedules
  app.get('/api/schedules', (_req, res) => {
    res.json(schedules);
  });

  app.post('/api/schedules', (req, res) => {
    const newSchedule: Schedule = { id: `sch_${Date.now()}`, ...req.body };
    schedules.unshift(newSchedule);
    syncScheduleToSupabase(newSchedule);
    addAuditLog('Admin Syahbandar', 'admin', 'ADD_SCHEDULE', `Membuat jadwal baru ${newSchedule.vesselName}`);
    res.status(201).json(newSchedule);
  });

  app.put('/api/schedules/:id', (req, res) => {
    const { id } = req.params;
    const index = schedules.findIndex((s) => s.id === id);
    if (index === -1) return res.status(404).json({ error: 'Schedule not found' });
    schedules[index] = { ...schedules[index], ...req.body };
    syncScheduleToSupabase(schedules[index]);

    // Broadcast notification if delayed or cancelled
    if (req.body.status === 'delayed' || req.body.status === 'cancelled') {
      const isCancel = req.body.status === 'cancelled';
      const notif: NotificationItem = {
        id: `notif_${Date.now()}`,
        userId: 'all',
        title: isCancel ? '❌ Pembatalan Pelayaran' : '⚠️ Keterlambatan Kapal',
        message: `${schedules[index].vesselName} (${schedules[index].originDockName} → ${schedules[index].destinationDockName}): ${req.body.statusReason || (isCancel ? 'Dibatal kan demi keselamatan' : 'Mengalami keterlambatan')}`,
        type: isCancel ? 'cancel' : 'delay',
        read: false,
        createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      notifications.unshift(notif);
    }

    addAuditLog('Operator/Admin', 'admin', 'UPDATE_SCHEDULE', `Update jadwal ${schedules[index].vesselName} status: ${schedules[index].status}`);
    res.json(schedules[index]);
  });

  app.delete('/api/schedules/:id', (req, res) => {
    const { id } = req.params;
    const target = schedules.find((s) => s.id === id);
    schedules = schedules.filter((s) => s.id !== id);
    deleteScheduleFromSupabase(id);
    if (target) {
      addAuditLog('Admin Syahbandar', 'admin', 'DELETE_SCHEDULE', `Menghapus jadwal kapal: ${target.vesselName}`);
    }
    res.json({ success: true });
  });

  // Reservations / Bookings
  app.get('/api/reservations', (_req, res) => {
    res.json(reservations);
  });

  app.post('/api/reservations', (req, res) => {
    const {
      scheduleId,
      userId,
      userName,
      userPhone,
      userEmail,
      passengersCount,
      motorbikesCount,
      carsCount,
      passengersList,
      vehiclePlate,
      vehicleType,
      paymentMethod,
    } = req.body;

    const schIndex = schedules.findIndex((s) => s.id === scheduleId);
    if (schIndex === -1) return res.status(404).json({ error: 'Jadwal tidak ditemukan' });

    const sch = schedules[schIndex];
    
    // Check quota
    if (sch.bookedPassengers + (passengersCount || 1) > sch.maxPassengers) {
      return res.status(400).json({ error: 'Kapal penuh. Silakan pilih jadwal berikutnya.' });
    }

    const pax = passengersCount || 1;
    const motors = motorbikesCount || 0;
    const cars = carsCount || 0;

    // Update booked quota
    schedules[schIndex].bookedPassengers += pax;
    schedules[schIndex].bookedMotorbikes += motors;
    schedules[schIndex].bookedCars += cars;

    const bookingCode = `KK-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const basePrice = (pax * sch.tariffPassenger) + (motors * sch.tariffMotorbike) + (cars * sch.tariffCar);
    const insuranceFee = pax * 2000; // Asuransi Jasa Raharja
    const portServiceFee = pax * 3000; // Retribusi Jasa Pelabuhan
    const totalPrice = basePrice + insuranceFee + portServiceFee;
    const gateNum = `GATE ${Math.floor(1 + Math.random() * 4)}${String.fromCharCode(65 + Math.floor(Math.random() * 3))}`;

    const newRes: Reservation = {
      id: `res_${Date.now()}`,
      bookingCode,
      userId: userId || 'usr_pass_1',
      userName: userName || 'Ahmad Faisal',
      userPhone: userPhone || '0812-3456-7890',
      userEmail: userEmail || 'penumpang@kapalku.id',
      scheduleId: sch.id,
      vesselName: sch.vesselName,
      vesselType: sch.vesselType,
      originDockName: sch.originDockName,
      destinationDockName: sch.destinationDockName,
      travelDate: sch.date,
      departureTime: `${sch.departureTime} WITA`,
      estimatedArrivalTime: `${sch.estimatedArrivalTime} WITA`,
      passengersCount: pax,
      motorbikesCount: motors,
      carsCount: cars,
      passengersList: passengersList || [
        {
          name: userName || 'Ahmad Faisal',
          idNumber: '7371092801950001',
          type: 'Dewasa',
          seatNumber: `A-${Math.floor(1 + Math.random() * 50)}`,
        },
      ],
      vehiclePlate: vehiclePlate || undefined,
      vehicleType: vehicleType || undefined,
      basePrice,
      insuranceFee,
      portServiceFee,
      totalPrice,
      paymentMethod: paymentMethod || 'QRIS Terpadu',
      paymentStatus: (paymentMethod === 'Bayar di Loket' || paymentMethod === 'Virtual Account' ? 'Menunggu Pembayaran' : 'Lunas') as 'Lunas' | 'Menunggu Pembayaran',
      reservationStatus: (paymentMethod === 'Bayar di Loket' || paymentMethod === 'Virtual Account' ? 'Menunggu Pembayaran' : 'Terkonfirmasi') as 'Terkonfirmasi' | 'Menunggu Pembayaran',
      checkInStatus: 'Belum Check-In',
      gateNumber: gateNum,
      createdAt: new Date().toISOString().slice(0,10) + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${bookingCode}`,
      paymentDetails: {
        paidAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        bankName: paymentMethod?.includes('BCA') ? 'Bank BCA' : paymentMethod?.includes('Mandiri') ? 'Bank Mandiri' : paymentMethod?.includes('BRI') ? 'Bank BRI' : 'Bank BNI',
        vaNumber: `8802${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        cashPaymentCode: `PAY-LOKET-${bookingCode.slice(-4)}`,
      },
    };

    reservations.unshift(newRes);
    syncReservationToSupabase(newRes);
    addAuditLog(newRes.userName, 'passenger', 'CREATE_BOOKING', `Reservasi tiket berhasil: ${bookingCode} (${sch.vesselName})`);

    // Push notification for passenger
    notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: newRes.userId,
      title: '🎟️ Pemesanan Tiket Diterbitkan',
      message: `Kode Booking ${bookingCode} (${sch.vesselName}): Rute ${sch.originDockName} → ${sch.destinationDockName}. Status: ${newRes.paymentStatus}.`,
      type: 'booking',
      read: false,
      createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    });

    res.status(201).json(newRes);
  });

  // Complete Payment endpoint
  app.post('/api/reservations/:id/pay', (req, res) => {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const index = reservations.findIndex((r) => r.id === id || r.bookingCode === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Data reservasi tidak ditemukan.' });
    }

    const current = reservations[index];
    if (current.reservationStatus === 'Dibatalkan') {
      return res.status(400).json({ error: 'Reservasi ini telah dibatalkan dan tidak dapat dibayar.' });
    }

    const updated: Reservation = {
      ...current,
      paymentStatus: 'Lunas',
      reservationStatus: 'Terkonfirmasi',
      paymentMethod: paymentMethod || current.paymentMethod || 'QRIS Terpadu',
      paymentDetails: {
        ...current.paymentDetails,
        paidAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      },
    };

    reservations[index] = updated;
    syncReservationToSupabase(updated);

    addAuditLog(
      updated.userName,
      'passenger',
      'PAYMENT_COMPLETED',
      `Pembayaran lunas untuk tiket ${updated.bookingCode} via ${updated.paymentMethod}`
    );

    notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: updated.userId,
      title: '✅ Pembayaran Tiket Berhasil!',
      message: `Pembayaran untuk tiket ${updated.bookingCode} (${updated.vesselName}) telah diverifikasi LUNAS. E-Ticket dan QR Boarding Pass siap digunakan.`,
      type: 'booking',
      read: false,
      createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    });

    res.json(updated);
  });

  // Cancel Reservation endpoint
  app.post('/api/reservations/:id/cancel', (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const index = reservations.findIndex((r) => r.id === id || r.bookingCode === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Data reservasi tidak ditemukan.' });
    }

    const current = reservations[index];
    if (current.reservationStatus === 'Dibatalkan') {
      return res.status(400).json({ error: 'Reservasi ini sudah dibatalkan sebelumnya.' });
    }

    if (current.checkInStatus === 'Sudah Check-In (Boarded)') {
      return res.status(400).json({ error: 'Tiket yang sudah boarding tidak dapat dibatalkan.' });
    }

    const cancelTime = new Date().toISOString().slice(0, 10) + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const updated: Reservation = {
      ...current,
      reservationStatus: 'Dibatalkan',
      paymentStatus: 'Dibatalkan',
      cancellationReason: reason || 'Permintaan pembatalan tiket oleh penumpang',
      cancelledAt: cancelTime,
    };

    reservations[index] = updated;
    syncReservationToSupabase(updated);

    // Free up schedule capacity
    const schIndex = schedules.findIndex((s) => s.id === current.scheduleId);
    if (schIndex !== -1) {
      schedules[schIndex].bookedPassengers = Math.max(0, schedules[schIndex].bookedPassengers - current.passengersCount);
      schedules[schIndex].bookedMotorbikes = Math.max(0, schedules[schIndex].bookedMotorbikes - current.motorbikesCount);
      schedules[schIndex].bookedCars = Math.max(0, schedules[schIndex].bookedCars - current.carsCount);
    }

    addAuditLog(
      current.userName,
      'passenger',
      'CANCEL_BOOKING',
      `Pembatalan tiket ${current.bookingCode} (${current.vesselName}). Alasan: ${reason || 'Pembatalan mandiri'}`
    );

    notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: current.userId,
      title: '❌ Tiket Dibatalkan',
      message: `Pemesanan tiket ${current.bookingCode} (${current.vesselName}) telah berhasil dibatalkan. Kuota kursi telah dikembalikan.`,
      type: 'cancel',
      read: false,
      createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    });

    res.json(updated);
  });

  // Request Ticket Refund endpoint
  app.post('/api/reservations/:id/refund-request', (req, res) => {
    const { id } = req.params;
    const { reason, bankName, accountNumber, accountHolder } = req.body;

    const index = reservations.findIndex((r) => r.id === id || r.bookingCode === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Data reservasi tidak ditemukan.' });
    }

    const current = reservations[index];
    const now = new Date().toISOString().slice(0, 10) + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const updated: Reservation = {
      ...current,
      reservationStatus: 'Dibatalkan',
      cancellationReason: reason || 'Permintaan pembatalan tiket dan refund dana',
      cancelledAt: now,
      refundStatus: 'Diajukan',
      refundDetails: {
        requestedAt: now,
        reason: reason || 'Pengajuan pembatalan & refund dana',
        bankName: bankName || 'Bank/E-Wallet',
        accountNumber: accountNumber || '-',
        accountHolder: accountHolder || current.userName,
        refundAmount: current.totalPrice,
      },
    };

    reservations[index] = updated;
    syncReservationToSupabase(updated);

    // Free up schedule capacity
    const schIndex = schedules.findIndex((s) => s.id === current.scheduleId);
    if (schIndex !== -1) {
      schedules[schIndex].bookedPassengers = Math.max(0, schedules[schIndex].bookedPassengers - current.passengersCount);
      schedules[schIndex].bookedMotorbikes = Math.max(0, schedules[schIndex].bookedMotorbikes - current.motorbikesCount);
      schedules[schIndex].bookedCars = Math.max(0, schedules[schIndex].bookedCars - current.carsCount);
    }

    addAuditLog(
      current.userName,
      'passenger',
      'REFUND_REQUEST',
      `Pengajuan refund tiket ${current.bookingCode} senilai Rp ${current.totalPrice.toLocaleString('id-ID')} ke rekening ${bankName} ${accountNumber} a.n ${accountHolder}`
    );

    notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: current.userId,
      title: '💸 Permintaan Refund Terkirim',
      message: `Pengajuan refund dana tiket ${current.bookingCode} sebesar Rp ${current.totalPrice.toLocaleString('id-ID')} telah dikirim dan sedang menunggu persetujuan Administrator.`,
      type: 'booking',
      read: false,
      createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    });

    res.json(updated);
  });

  // Approve Ticket Refund endpoint
  app.post('/api/reservations/:id/refund-approve', (req, res) => {
    const { id } = req.params;
    const { transferProofRef, adminNote, officerName } = req.body;

    const index = reservations.findIndex((r) => r.id === id || r.bookingCode === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Data reservasi tidak ditemukan.' });
    }

    const current = reservations[index];
    const now = new Date().toISOString().slice(0, 10) + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const refNo = transferProofRef || `TRF-REF-${Date.now().toString().slice(-6)}`;
    const note = adminNote || 'Refund telah disetujui dan ditransfer ke rekening pemohon.';
    const officer = officerName || 'Admin Keuangan';

    const prevDetails = current.refundDetails;

    const updated: Reservation = {
      ...current,
      refundStatus: 'Disetujui',
      refundDetails: {
        requestedAt: prevDetails?.requestedAt || now,
        reason: prevDetails?.reason || current.cancellationReason || 'Pembatalan tiket',
        bankName: prevDetails?.bankName || 'Bank/E-Wallet',
        accountNumber: prevDetails?.accountNumber || '-',
        accountHolder: prevDetails?.accountHolder || current.userName,
        refundAmount: prevDetails?.refundAmount || current.totalPrice,
        adminNote: note,
        processedAt: now,
        processedBy: officer,
        transferProofRef: refNo,
      },
    };

    reservations[index] = updated;
    syncReservationToSupabase(updated);

    addAuditLog(
      officer,
      'admin',
      'REFUND_APPROVED',
      `Menyetujui refund tiket ${current.bookingCode} sebesar Rp ${current.totalPrice.toLocaleString('id-ID')} (Ref: ${refNo})`
    );

    // Hapus tanda / notifikasi pengajuan refund lama agar tidak ada lagi tanda "pengajuan"
    const targetBookingCode = current.bookingCode;
    notifications = notifications.filter(
      (n) => !(
        (n.title.toLowerCase().includes('pengajuan') || n.title.toLowerCase().includes('permintaan')) &&
        (n.message.includes(targetBookingCode) || n.title.includes(targetBookingCode))
      )
    );

    notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: current.userId,
      title: '✅ Refund Tiket Selesai (Dana Telah Ditransfer)',
      message: `Dana pengembalian tiket ${current.bookingCode} sebesar Rp ${current.totalPrice.toLocaleString('id-ID')} telah berhasil ditransfer ke rekening Anda (No. Ref: ${refNo}).`,
      type: 'booking',
      read: false,
      createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    });

    res.json(updated);
  });

  // Reject Ticket Refund endpoint
  app.post('/api/reservations/:id/refund-reject', (req, res) => {
    const { id } = req.params;
    const { reason, officerName } = req.body;

    const index = reservations.findIndex((r) => r.id === id || r.bookingCode === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Data reservasi tidak ditemukan.' });
    }

    const current = reservations[index];
    const now = new Date().toISOString().slice(0, 10) + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const officer = officerName || 'Admin Pelabuhan';
    const prevDetails = current.refundDetails;

    const updated: Reservation = {
      ...current,
      refundStatus: 'Ditolak',
      refundDetails: {
        requestedAt: prevDetails?.requestedAt || now,
        reason: prevDetails?.reason || current.cancellationReason || 'Pembatalan tiket',
        bankName: prevDetails?.bankName || 'Bank/E-Wallet',
        accountNumber: prevDetails?.accountNumber || '-',
        accountHolder: prevDetails?.accountHolder || current.userName,
        refundAmount: prevDetails?.refundAmount || current.totalPrice,
        adminNote: reason || 'Pengajuan refund ditolak oleh Admin.',
        processedAt: now,
        processedBy: officer,
      },
    };

    reservations[index] = updated;
    syncReservationToSupabase(updated);

    addAuditLog(
      officer,
      'admin',
      'REFUND_REJECTED',
      `Menolak refund tiket ${current.bookingCode}. Alasan: ${reason || '-'}`
    );

    notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: current.userId,
      title: '⚠️ Pengajuan Refund Tiket Ditolak',
      message: `Permintaan refund untuk tiket ${current.bookingCode} ditolak. Alasan: ${reason || 'Ketentuan tidak terpenuhi'}.`,
      type: 'cancel',
      read: false,
      createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    });

    res.json(updated);
  });

  // Ticket Validation & Check-in for Admin / Gate Officers
  app.post('/api/reservations/validate', (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Kode booking wajib diisi' });

    const cleanCode = code.trim().toUpperCase();
    const reservation = reservations.find((r) => r.bookingCode.toUpperCase() === cleanCode || r.id === cleanCode);

    if (!reservation) {
      return res.status(404).json({
        valid: false,
        message: 'Tiket TIDAK DITEMUKAN. Periksa kembali kode booking atau QR Code.',
      });
    }

    if (reservation.reservationStatus === 'Dibatalkan') {
      return res.json({
        valid: false,
        reservation,
        message: `⛔ TIKET SUDAH DIBATALKAN. Pembatalan: ${reservation.cancelledAt || ''} (Alasan: ${reservation.cancellationReason || 'Pembatalan'}). Boarding ditolak.`,
      });
    }

    if (reservation.paymentStatus !== 'Lunas') {
      return res.json({
        valid: false,
        reservation,
        message: `⚠️ PEMBAYARAN BELUM LUNAS. Penumpang harus menyelesaikan pembayaran tiket sebelum boarding di gate.`,
      });
    }

    return res.json({
      valid: true,
      reservation,
      message: reservation.checkInStatus === 'Sudah Check-In (Boarded)'
        ? '⚠️ Tiket ini SUDAH DIGUNAKAN untuk boarding sebelumnya.'
        : '✅ Tiket VALID & LUNAS. Siap untuk proses boarding penumpang.',
    });
  });

  app.post('/api/reservations/checkin', (req, res) => {
    const { code, officerName } = req.body;
    if (!code) return res.status(400).json({ error: 'Kode booking wajib diisi' });

    const cleanCode = code.trim().toUpperCase();
    const index = reservations.findIndex((r) => r.bookingCode.toUpperCase() === cleanCode || r.id === cleanCode);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Tiket tidak ditemukan.' });
    }

    const checkInTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WITA';
    reservations[index] = {
      ...reservations[index],
      checkInStatus: 'Sudah Check-In (Boarded)',
      checkInTime,
    };
    syncReservationToSupabase(reservations[index]);

    addAuditLog(
      officerName || 'Petugas Gate Dermaga',
      'admin',
      'CHECKIN_TICKET',
      `Check-in & boarding tiket ${reservations[index].bookingCode} - ${reservations[index].userName}`
    );

    return res.json({
      success: true,
      reservation: reservations[index],
      message: `Boarding Berhasil! Selamat datang di atas kapal ${reservations[index].vesselName}.`,
    });
  });

  // Weather Reports
  app.get('/api/weather', (_req, res) => {
    res.json(weatherReports);
  });

  app.put('/api/weather/:id', (req, res) => {
    const { id } = req.params;
    const index = weatherReports.findIndex((w) => w.id === id);
    if (index === -1) return res.status(404).json({ error: 'Weather report not found' });
    weatherReports[index] = {
      ...weatherReports[index],
      ...req.body,
      updatedAt: new Date().toLocaleDateString('id-ID') + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA',
    };

    // If status is Siaga or Berbahaya, send notification
    if (req.body.status === 'Siaga' || req.body.status === 'Berbahaya') {
      notifications.unshift({
        id: `notif_${Date.now()}`,
        userId: 'all',
        title: '🌊 PERINGATAN CUACA LAUT',
        message: `Peringatan Gelombang Tinggi rute ${weatherReports[index].routeName}: ${weatherReports[index].officialAdvice}`,
        type: 'weather',
        read: false,
        createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      });
    }

    addAuditLog('Admin Syahbandar', 'admin', 'UPDATE_WEATHER', `Update info cuaca rute ${weatherReports[index].routeName}`);
    res.json(weatherReports[index]);
  });

  // Notifications
  app.get('/api/notifications', (_req, res) => {
    res.json(notifications);
  });

  app.post('/api/notifications', (req, res) => {
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      userId: req.body.userId || 'all',
      title: req.body.title,
      message: req.body.message,
      type: req.body.type || 'ship',
      read: false,
      createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };
    notifications.unshift(newNotif);
    res.status(201).json(newNotif);
  });

  // SOS Emergency Reports
  app.get('/api/sos', (_req, res) => {
    res.json(sosReports);
  });

  app.post('/api/sos', (req, res) => {
    const newSOS: SOSReport = {
      id: `sos_${Date.now()}`,
      userId: req.body.userId || 'usr_pass_1',
      userName: req.body.userName || 'Ahmad Faisal',
      userPhone: req.body.userPhone || '0812-3456-7890',
      vesselName: req.body.vesselName || 'Lokasi Penumpang',
      lat: req.body.lat || -1.2610,
      lng: req.body.lng || 116.8010,
      time: new Date().toLocaleDateString('id-ID') + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA',
      emergencyType: req.body.emergencyType || 'Darurat Laut',
      description: req.body.description || 'Panggilan Darurat SOS dari Penumpang',
      bookingCode: req.body.bookingCode || '-',
      status: 'Baru',
      createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    sosReports.unshift(newSOS);

    // Create high priority notification for admin & operators
    notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: 'all',
      title: '🚨 SINYAL SOS DARURAT TERIMA!',
      message: `Panggilan Darurat (${newSOS.emergencyType}) dari ${newSOS.userName}. Lokasi GPS: ${newSOS.lat.toFixed(4)}, ${newSOS.lng.toFixed(4)}.`,
      type: 'sos',
      read: false,
      createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    });

    addAuditLog(newSOS.userName, 'passenger', 'EMERGENCY_SOS', `Memicu sinyal SOS: ${newSOS.emergencyType} (${newSOS.description})`);
    res.status(201).json(newSOS);
  });

  app.put('/api/sos/:id', (req, res) => {
    const { id } = req.params;
    const index = sosReports.findIndex((s) => s.id === id);
    if (index === -1) return res.status(404).json({ error: 'SOS report not found' });
    sosReports[index] = { ...sosReports[index], ...req.body };
    addAuditLog('Admin Syahbandar', 'admin', 'RESOLVE_SOS', `Update status SOS ${id} -> ${req.body.status}`);
    res.json(sosReports[index]);
  });

  // Audit Logs
  app.get('/api/audit', (_req, res) => {
    res.json(auditLogs);
  });

  // Admin Dashboard Overview Stats
  app.get('/api/stats', (_req, res) => {
    const activeVessels = vessels.length;
    const sailingVessels = vessels.filter((v) => v.status === 'Dalam Perjalanan').length;
    const todayReservations = reservations.length;
    const totalSchedulesToday = schedules.length;
    const delayedCount = vessels.filter((v) => v.status === 'Delay').length + schedules.filter((s) => s.status === 'delayed').length;
    const cancelledCount = vessels.filter((v) => v.status === 'Batal').length + schedules.filter((s) => s.status === 'cancelled').length;
    const openSOSCount = sosReports.filter((s) => s.status !== 'Selesai').length;

    res.json({
      activeVessels,
      sailingVessels,
      todayReservations,
      totalSchedulesToday,
      delayedCount,
      cancelledCount,
      openSOSCount,
    });
  });

  // Hapus semua data sample dari memory server
  app.post('/api/clear-sample-data', (_req, res) => {
    users = [];
    vessels = [];
    docks = [];
    routes = [];
    schedules = [];
    reservations = [];
    weatherReports = [];
    notifications = [];
    sosReports = [];
    auditLogs = [];
    res.json({ success: true, message: 'Semua data sample berhasil dihapus dari aplikasi.' });
  });

  // Muat data resmi Pelabuhan Ferry Kampung Baru, KMP Oputa Yi Ko, dan KMP Bontoharu
  app.post('/api/seed-kampung-baru', (_req, res) => {
    users = [...INITIAL_USERS];
    vessels = [...INITIAL_VESSELS];
    docks = [...INITIAL_DOCKS];
    routes = [...INITIAL_ROUTES];
    schedules = [...INITIAL_SCHEDULES];
    weatherReports = [...INITIAL_WEATHER];
    notifications = [...INITIAL_NOTIFICATIONS];
    auditLogs = [...INITIAL_AUDIT_LOGS];
    res.json({ success: true, message: 'Data resmi Pelabuhan Ferry Kampung Baru berhasil dimuat.' });
  });

  // ================= SUPABASE INTEGRATION APIS =================
  app.get('/api/supabase/status', async (_req, res) => {
    const tables = ['users', 'docks', 'routes', 'vessels', 'schedules', 'reservations', 'notifications', 'weather', 'sos_reports', 'audit_logs'];
    const tableStatus: Record<string, { exists: boolean; rowCount: number; error?: string }> = {};
    let allExist = true;

    for (const t of tables) {
      try {
        const { data, error } = await supabase.from(t).select('id').limit(1);
        if (error) {
          allExist = false;
          tableStatus[t] = { exists: false, rowCount: 0, error: error.message };
        } else {
          const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
          tableStatus[t] = { exists: true, rowCount: count ?? (Array.isArray(data) ? data.length : 0) };
        }
      } catch (err: any) {
        allExist = false;
        tableStatus[t] = { exists: false, rowCount: 0, error: err?.message };
      }
    }

    res.json({
      connected: true,
      projectUrl: currentSupabaseUrl,
      tables: tableStatus,
      allTablesExist: allExist,
    });
  });

  app.post('/api/supabase/config', async (req, res) => {
    const { url, key } = req.body;
    if (!url || !key) {
      return res.status(400).json({ error: 'URL and Anon Key are required.' });
    }
    try {
      currentSupabaseUrl = url.trim();
      currentSupabaseKey = key.trim();
      supabase = createClient(currentSupabaseUrl, currentSupabaseKey);
      await syncFromSupabase();
      console.log(`[Supabase] Reconnected with new URL: ${currentSupabaseUrl}`);
      res.json({ success: true, projectUrl: currentSupabaseUrl });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Gagal mengubah konfigurasi Supabase' });
    }
  });

  app.get('/api/supabase/schema', (_req, res) => {
    try {
      const schemaPath = path.join(process.cwd(), 'supabase', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.sendFile(schemaPath);
      }
      const rootSchema = path.join(process.cwd(), 'supabase_schema.sql');
      if (fs.existsSync(rootSchema)) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.sendFile(rootSchema);
      }
      res.status(404).send('Schema file not found');
    } catch (e: any) {
      res.status(500).send(e?.message);
    }
  });

  // Attempt initial sync from Supabase
  await syncFromSupabase();

  // Vite middleware or production static
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        const template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        const html = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e: any) {
        if (vite) vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KapalKu Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
