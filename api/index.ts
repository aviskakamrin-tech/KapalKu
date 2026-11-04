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

// In-Memory Fallback State for Serverless Function
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
  res.json(users);
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier, password, role } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Nama, email, nomor HP, atau NIP wajib diisi.' });
  }

  const cleanId = String(identifier).trim().toLowerCase();
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
