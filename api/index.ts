import express, { Request, Response } from 'express';
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
} from '../src/data/mockData';
import { User, Vessel, Dock, RouteItem, Schedule, Reservation, WeatherReport, NotificationItem, SOSReport, AuditLog } from '../src/types';

const app = express();
app.use(express.json());

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://gkklzgdxpqfxskuvsdpu.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdra2x6Z2R4cHFmeHNrdXZzZHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjE5MTgsImV4cCI6MjEwNTY5NzkxOH0.y06Q6MotYwl4PW8rh3BK5VnWf-YoL97kN8coGYTrq5g';
const supabase = createClient(supabaseUrl, supabaseKey);

import fs from 'fs';

// In-Memory Fallback State for Serverless Function
let users = [...INITIAL_USERS];

const VERCEL_USERS_FILE = '/tmp/kapalku_users.json';
function loadVercelUsers() {
  try {
    if (fs.existsSync(VERCEL_USERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(VERCEL_USERS_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        const existingIds = new Set(data.map((u: any) => u.id));
        users = [...data, ...INITIAL_USERS.filter((u) => !existingIds.has(u.id))];
      }
    }
  } catch (e) {}
}
function saveVercelUsers() {
  try {
    fs.writeFileSync(VERCEL_USERS_FILE, JSON.stringify(users), 'utf-8');
  } catch (e) {}
}
loadVercelUsers();

let vessels: Vessel[] = [...INITIAL_VESSELS];
let docks: Dock[] = [...INITIAL_DOCKS];
let routes: RouteItem[] = [...INITIAL_ROUTES];
let schedules: Schedule[] = [...INITIAL_SCHEDULES];
let reservations: Reservation[] = [...INITIAL_RESERVATIONS];
let weatherReports: WeatherReport[] = [...INITIAL_WEATHER];
let notifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];
let sosReports: SOSReport[] = [...INITIAL_SOS];
let auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'KapalKu Maritime Platform',
    platform: 'Vercel Serverless',
    timestamp: new Date().toISOString(),
  });
});

// Users
app.get('/api/users', (_req: Request, res: Response) => {
  loadVercelUsers();
  res.json(users);
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  loadVercelUsers();
  const { identifier, password, role } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Nama, email, nomor HP, atau NIP wajib diisi.' });
  }

  const cleanId = String(identifier).trim().toLowerCase();

  // KHUSUS LOGIN ADMIN: Kredensial Tetap user: admin, password: admin1
  if (role === 'admin' || cleanId === 'admin' || cleanId === 'admin@kapalku.id') {
    if (cleanId !== 'admin' && cleanId !== 'admin@kapalku.id') {
      return res.status(401).json({ error: 'Username Administrator salah. Gunakan username tetap: admin' });
    }
    if (password !== 'admin1') {
      return res.status(401).json({ error: 'Kata sandi administrator salah. Gunakan password tetap: admin1' });
    }
    let adminUser = users.find((u) => u.role === 'admin');
    if (!adminUser) {
      adminUser = {
        id: 'usr_admin_1',
        name: 'Administrator Pelabuhan',
        email: 'admin@kapalku.id',
        phone: '0811-4090-265',
        role: 'admin',
        password: 'admin1',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      };
      users.unshift(adminUser);
    }
    return res.json({
      success: true,
      token: `token_${adminUser.id}_${Date.now()}`,
      user: adminUser,
    });
  }

  const matchedUser = users.find(
    (u) =>
      u.email.toLowerCase() === cleanId ||
      u.phone.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, '') ||
      (u.nip && u.nip.toLowerCase() === cleanId) ||
      u.name.toLowerCase() === cleanId
  );

  if (!matchedUser) {
    if (role === 'officer') {
      return res.status(401).json({
        error: 'Akun petugas tidak ditemukan. Petugas tidak dapat mendaftar sendiri; akun dan password harus dibuatkan oleh Administrator Pelabuhan.',
      });
    }
    return res.status(401).json({
      error: 'Akun belum terdaftar. Silakan lakukan pendaftaran akun terlebih dahulu sebelum login.',
    });
  }

  if (matchedUser.password && password && matchedUser.password !== password) {
    return res.status(401).json({ error: 'Kata sandi salah. Silakan periksa kembali.' });
  }

  return res.json({
    success: true,
    token: `token_${matchedUser.id}_${Date.now()}`,
    user: matchedUser,
  });
});

app.post('/api/officers', (req: Request, res: Response) => {
  const { name, email, phone, password, nip, dockId, dockName } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nama, email, dan kata sandi wajib diisi.' });
  }
  const newOfficer: User = {
    id: `usr_ptg_${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone?.trim() || '0812-4211-3344',
    role: 'officer',
    password: password,
    nip: nip?.trim() || `NIP-PTG-${Date.now().toString().slice(-4)}`,
    dockId: dockId || 'dock_kasipute',
    dockName: dockName || 'Pelabuhan Ferry Kampung Baru (Kasipute, Bombana)',
    status: 'Aktif',
    avatar: `https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80`,
    createdAt: new Date().toLocaleDateString('id-ID'),
  };
  users.unshift(newOfficer);
  res.status(201).json(newOfficer);
});

// Docks
app.get('/api/docks', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('docks').select('*');
    if (!error && Array.isArray(data) && data.length > 0) {
      return res.json(data);
    }
  } catch (e) {}
  res.json(docks);
});

app.post('/api/docks', async (req: Request, res: Response) => {
  const newDock: Dock = { id: `dock_${Date.now()}`, ...req.body };
  docks.push(newDock);
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
  res.status(201).json(newDock);
});

// Routes
app.get('/api/routes', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('routes').select('*');
    if (!error && Array.isArray(data) && data.length > 0) {
      return res.json(data);
    }
  } catch (e) {}
  res.json(routes);
});

app.post('/api/routes', async (req: Request, res: Response) => {
  const newRoute: RouteItem = { id: `route_${Date.now()}`, ...req.body };
  routes.push(newRoute);
  try {
    await supabase.from('routes').upsert({
      id: newRoute.id,
      name: newRoute.name,
      origin_dock_id: newRoute.originDockId,
      origin_dock_name: newRoute.originDockName,
      destination_dock_id: newRoute.destinationDockId,
      destination_dock_name: newRoute.destinationDockName,
      distance_km: newRoute.distanceKm,
      distance_miles: newRoute.distanceMiles,
      estimated_duration_minutes: newRoute.estimatedDurationMinutes,
      tariff_passenger: newRoute.tariffPassenger,
      tariff_child: newRoute.tariffChild,
      tariff_motorbike: newRoute.tariffMotorbike,
      tariff_car: newRoute.tariffCar,
      tariff_truck: newRoute.tariffTruck,
      status: newRoute.status,
      region: newRoute.region,
      vessel_types_available: newRoute.vesselTypesAvailable,
      frequency_text: newRoute.frequencyText,
      description: newRoute.description,
    });
  } catch (e) {}
  res.status(201).json(newRoute);
});

// Schedules
app.get('/api/schedules', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('schedules').select('*');
    if (!error && Array.isArray(data) && data.length > 0) {
      return res.json(data);
    }
  } catch (e) {}
  res.json(schedules);
});

app.post('/api/schedules', async (req: Request, res: Response) => {
  const newSchedule: Schedule = { id: `sch_${Date.now()}`, ...req.body };
  schedules.unshift(newSchedule);
  try {
    await supabase.from('schedules').upsert({
      id: newSchedule.id,
      vessel_id: newSchedule.vesselId,
      vessel_name: newSchedule.vesselName,
      vessel_type: newSchedule.vesselType,
      route_id: newSchedule.routeId,
      origin_dock_name: newSchedule.originDockName,
      destination_dock_name: newSchedule.destinationDockName,
      date: newSchedule.date,
      departure_time: newSchedule.departureTime,
      estimated_arrival_time: newSchedule.estimatedArrivalTime,
      tariff_passenger: newSchedule.tariffPassenger,
      tariff_child: newSchedule.tariffChild,
      tariff_motorbike: newSchedule.tariffMotorbike,
      tariff_car: newSchedule.tariffCar,
      tariff_truck: newSchedule.tariffTruck,
      status: newSchedule.status,
      booked_passengers: newSchedule.bookedPassengers,
      max_passengers: newSchedule.maxPassengers,
      booked_motorbikes: newSchedule.bookedMotorbikes,
      booked_cars: newSchedule.bookedCars,
      booked_trucks: newSchedule.bookedTrucks,
    });
  } catch (e) {}
  res.status(201).json(newSchedule);
});

// Vessels
app.get('/api/vessels', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('vessels').select('*');
    if (!error && Array.isArray(data) && data.length > 0) {
      return res.json(data);
    }
  } catch (e) {}
  res.json(vessels);
});

app.post('/api/vessels', async (req: Request, res: Response) => {
  const newVessel: Vessel = {
    id: `vsl_${Date.now()}`,
    ...req.body,
    lastUpdated: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA',
  };
  vessels.unshift(newVessel);
  try {
    await supabase.from('vessels').upsert({
      id: newVessel.id,
      name: newVessel.name,
      registration_number: newVessel.registrationNumber,
      type: newVessel.type,
      capacity_passengers: newVessel.capacityPassengers,
      capacity_motorbikes: newVessel.capacityMotorbikes,
      capacity_cars: newVessel.capacityCars,
      capacity_trucks: newVessel.capacityTrucks,
      status: newVessel.status,
      operator_id: newVessel.operatorId,
      operator_name: newVessel.operatorName,
      operator_phone: newVessel.operatorPhone,
      speed_kts: newVessel.speedKts,
      heading_deg: newVessel.headingDeg,
      current_lat: newVessel.currentLat,
      current_lng: newVessel.currentLng,
      last_updated: newVessel.lastUpdated,
      current_route_id: newVessel.currentRouteId,
      operating_routes_description: newVessel.operatingRoutesDescription,
    });
  } catch (e) {}
  res.status(201).json(newVessel);
});

// Reservations
app.get('/api/reservations', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('reservations').select('*');
    if (!error && Array.isArray(data) && data.length > 0) {
      return res.json(data);
    }
  } catch (e) {}
  res.json(reservations);
});

app.post('/api/reservations', async (req: Request, res: Response) => {
  const data = req.body;
  const bookingCode = `KPK-${Math.floor(100000 + Math.random() * 900000)}`;
  const newReservation: Reservation = {
    id: `res_${Date.now()}`,
    bookingCode,
    scheduleId: data.scheduleId || 'sch_1',
    userId: data.userId || 'usr_pass_1',
    userName: data.userName || 'Penumpang',
    userPhone: data.userPhone || '0812-3456-7890',
    userEmail: data.userEmail || 'penumpang@kapalku.id',
    vesselName: data.vesselName || 'KMP Oputa Yi Ko',
    vesselType: data.vesselType || 'Feri',
    originDockName: data.originDockName || 'Pelabuhan Ferry Kampung Baru (Kasipute, Bombana)',
    destinationDockName: data.destinationDockName || 'Pelabuhan Pising (Kabaena Utara, Bombana)',
    travelDate: data.travelDate || new Date().toISOString().split('T')[0],
    departureTime: data.departureTime || '08:00',
    passengersCount: data.passengersCount || 1,
    motorbikesCount: data.motorbikesCount || 0,
    carsCount: data.carsCount || 0,
    totalPrice: data.totalPrice || 45000,
    reservationStatus: 'Terkonfirmasi',
    paymentStatus: 'Lunas',
    checkInStatus: 'Belum Check-In',
    gateNumber: `GATE 1${String.fromCharCode(65 + Math.floor(Math.random() * 3))}`,
    paymentMethod: data.paymentMethod || 'QRIS Terpadu',
    createdAt: new Date().toLocaleDateString('id-ID') + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${bookingCode}`,
    passengersList: data.passengersList || [],
    vehiclePlate: data.vehiclePlate,
    vehicleType: data.vehicleType,
  };

  reservations.unshift(newReservation);
  try {
    await supabase.from('reservations').upsert({
      id: newReservation.id,
      booking_code: newReservation.bookingCode,
      user_id: newReservation.userId,
      user_name: newReservation.userName,
      user_phone: newReservation.userPhone,
      user_email: newReservation.userEmail,
      schedule_id: newReservation.scheduleId,
      vessel_name: newReservation.vesselName,
      vessel_type: newReservation.vesselType,
      origin_dock_name: newReservation.originDockName,
      destination_dock_name: newReservation.destinationDockName,
      travel_date: newReservation.travelDate,
      departure_time: newReservation.departureTime,
      passengers_count: newReservation.passengersCount,
      motorbikes_count: newReservation.motorbikesCount,
      cars_count: newReservation.carsCount,
      total_price: newReservation.totalPrice,
      payment_method: newReservation.paymentMethod,
      payment_status: newReservation.paymentStatus,
      reservation_status: newReservation.reservationStatus,
      check_in_status: newReservation.checkInStatus,
      gate_number: newReservation.gateNumber,
      qr_code_url: newReservation.qrCodeUrl,
    });
  } catch (e) {}

  res.status(201).json(newReservation);
});

// Ticket Validate
app.post('/api/reservations/validate', async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ valid: false, message: 'Kode tiket wajib diisi' });

  const raw = String(code).trim().toUpperCase();
  const match = raw.match(/(KPK|KK)-[A-Z0-9_-]+/i) || raw.match(/(KPK|KK)[0-9]{4,}/i) || raw.match(/RES_[A-Z0-9_-]+/i);
  const cleanCode = match ? match[0].toUpperCase() : raw;

  let found = reservations.find(
    (r) =>
      r.bookingCode.toUpperCase() === cleanCode ||
      r.bookingCode.toUpperCase() === raw ||
      r.id.toUpperCase() === cleanCode ||
      r.id.toUpperCase() === raw ||
      raw.includes(r.bookingCode.toUpperCase())
  );

  if (!found) {
    try {
      const { data: dbRows } = await supabase.from('reservations').select('*');
      if (dbRows && dbRows.length > 0) {
        const matchedDb = dbRows.find(
          (r: any) =>
            (r.booking_code && (r.booking_code.toUpperCase() === cleanCode || r.booking_code.toUpperCase() === raw || raw.includes(r.booking_code.toUpperCase()))) ||
            (r.id && (r.id.toUpperCase() === cleanCode || r.id.toUpperCase() === raw))
        );
        if (matchedDb) {
          found = {
            id: matchedDb.id,
            bookingCode: matchedDb.booking_code,
            userId: matchedDb.user_id,
            userName: matchedDb.user_name,
            userPhone: matchedDb.user_phone,
            userEmail: matchedDb.user_email,
            scheduleId: matchedDb.schedule_id,
            vesselName: matchedDb.vessel_name,
            vesselType: matchedDb.vessel_type,
            originDockName: matchedDb.origin_dock_name,
            destinationDockName: matchedDb.destination_dock_name,
            travelDate: matchedDb.travel_date,
            departureTime: matchedDb.departure_time,
            passengersCount: Number(matchedDb.passengers_count || 1),
            motorbikesCount: Number(matchedDb.motorbikes_count || 0),
            carsCount: Number(matchedDb.cars_count || 0),
            passengersList: matchedDb.passengers_list || [],
            vehiclePlate: matchedDb.vehicle_plate,
            vehicleType: matchedDb.vehicle_type,
            totalPrice: Number(matchedDb.total_price),
            paymentMethod: matchedDb.payment_method,
            paymentStatus: matchedDb.payment_status,
            reservationStatus: matchedDb.reservation_status,
            checkInStatus: matchedDb.check_in_status || 'Belum Check-In',
            checkInTime: matchedDb.check_in_time,
            scannedBy: matchedDb.scanned_by,
            scannedAt: matchedDb.scanned_at,
            gateNumber: matchedDb.gate_number,
            createdAt: matchedDb.created_at,
            qrCodeUrl: matchedDb.qr_code_url,
          };
          reservations.unshift(found);
        }
      }
    } catch (e) {}
  }

  if (!found) {
    return res.json({
      valid: false,
      status: 'NOT_FOUND',
      message: `Tiket dengan kode "${cleanCode}" tidak ditemukan dalam sistem manifes pelayaran.`,
    });
  }

  if (found.reservationStatus === 'Dibatalkan' || found.paymentStatus === 'Dibatalkan') {
    return res.json({
      valid: false,
      status: 'CANCELLED',
      reservation: found,
      message: `Tiket telah DIBATALKAN. Tidak diizinkan naik kapal.`,
    });
  }

  if (found.paymentStatus !== 'Lunas') {
    return res.json({
      valid: false,
      status: 'UNPAID',
      reservation: found,
      message: `Tiket BELUM LUNAS. Harap selesaikan pembayaran di loket.`,
    });
  }

  if (found.checkInStatus === 'Sudah Check-In (Boarded)') {
    return res.json({
      valid: true,
      status: 'ALREADY_CHECKED_IN',
      reservation: found,
      message: `Tiket SUDAH PERNAH CHECK-IN sebelumnya pada ${found.checkInTime || found.scannedAt || '-'} oleh ${found.scannedBy || 'Petugas Gate'}.`,
    });
  }

  return res.json({
    valid: true,
    status: 'VALID',
    reservation: found,
    message: `Tiket SAH & VALID untuk boarding kapal ${found.vesselName} (${found.originDockName} ➔ ${found.destinationDockName}).`,
  });
});

// Ticket Check-in
app.post('/api/reservations/checkin', async (req: Request, res: Response) => {
  const { code, officerName } = req.body;
  if (!code) return res.status(400).json({ error: 'Kode booking wajib diisi' });

  const raw = String(code).trim().toUpperCase();
  const match = raw.match(/(KPK|KK)-[A-Z0-9_-]+/i) || raw.match(/(KPK|KK)[0-9]{4,}/i) || raw.match(/RES_[A-Z0-9_-]+/i);
  const cleanCode = match ? match[0].toUpperCase() : raw;

  const idx = reservations.findIndex(
    (r) =>
      r.bookingCode.toUpperCase() === cleanCode ||
      r.bookingCode.toUpperCase() === raw ||
      r.id.toUpperCase() === cleanCode ||
      r.id.toUpperCase() === raw
  );

  const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WITA';
  const nowFull = new Date().toLocaleDateString('id-ID') + ' ' + nowTime;

  if (idx !== -1) {
    reservations[idx].checkInStatus = 'Sudah Check-In (Boarded)';
    reservations[idx].checkInTime = nowTime;
    reservations[idx].scannedAt = nowFull;
    reservations[idx].scannedBy = officerName || 'Petugas Gate Dermaga';
    try {
      await supabase.from('reservations').update({
        check_in_status: 'Sudah Check-In (Boarded)',
        check_in_time: nowTime,
        scanned_by: officerName || 'Petugas Gate Dermaga',
        scanned_at: nowFull,
      }).eq('id', reservations[idx].id);
    } catch (e) {}

    return res.json({
      success: true,
      reservation: reservations[idx],
      message: `Berhasil Check-In! Penumpang ${reservations[idx].userName} dipersilakan naik ke kapal ${reservations[idx].vesselName}.`,
    });
  }

  return res.status(404).json({ error: 'Tiket tidak ditemukan dalam manifes' });
});

// Officers update & delete
app.put('/api/officers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Petugas tidak ditemukan' });
  users[idx] = { ...users[idx], ...req.body, role: 'officer' };
  res.json(users[idx]);
});

app.delete('/api/officers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  users = users.filter((u) => u.id !== id);
  res.json({ success: true, message: 'Akun petugas berhasil dihapus.' });
});

// Weather
app.get('/api/weather', (_req: Request, res: Response) => {
  res.json(weatherReports);
});

// Notifications
app.get('/api/notifications', (_req: Request, res: Response) => {
  res.json(notifications);
});

// SOS
app.get('/api/sos', (_req: Request, res: Response) => {
  res.json(sosReports);
});

// Stats
app.get('/api/stats', (_req: Request, res: Response) => {
  res.json({
    activeVessels: vessels.length,
    sailingVessels: vessels.filter((v) => v.status === 'Dalam Perjalanan').length,
    todayReservations: reservations.length,
    totalSchedulesToday: schedules.length,
    delayedCount: vessels.filter((v) => v.status === 'Delay').length,
    cancelledCount: vessels.filter((v) => v.status === 'Batal').length,
    openSOSCount: sosReports.filter((s) => s.status !== 'Selesai').length,
  });
});

// Supabase Status
app.get('/api/supabase/status', async (_req: Request, res: Response) => {
  res.json({
    connected: true,
    projectUrl: supabaseUrl,
    timestamp: new Date().toISOString(),
  });
});

export default app;
