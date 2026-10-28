import { createClient } from '@supabase/supabase-js';
import {
  User,
  Vessel,
  Dock,
  RouteItem,
  Schedule,
  Reservation,
  WeatherReport,
  NotificationItem,
  SOSReport,
  AuditLog,
} from '../types';

function getSavedSupabaseUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('kapalku_supabase_url');
    if (saved && saved.trim()) return saved.trim();
  }
  return (
    (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
    'https://gkklzgdxpqfxskuvsdpu.supabase.co'
  );
}

function getSavedSupabaseKey(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('kapalku_supabase_key');
    if (saved && saved.trim()) return saved.trim();
  }
  return (
    (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdra2x6Z2R4cHFmeHNrdXZzZHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjE5MTgsImV4cCI6MjEwNTY5NzkxOH0.y06Q6MotYwl4PW8rh3BK5VnWf-YoL97kN8coGYTrq5g'
  );
}

export let SUPABASE_URL = getSavedSupabaseUrl();
export let SUPABASE_ANON_KEY = getSavedSupabaseKey();
export let supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function setCustomSupabaseCredentials(url: string, key: string) {
  SUPABASE_URL = url.trim();
  SUPABASE_ANON_KEY = key.trim();
  if (typeof window !== 'undefined') {
    localStorage.setItem('kapalku_supabase_url', SUPABASE_URL);
    localStorage.setItem('kapalku_supabase_key', SUPABASE_ANON_KEY);
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  // Also notify server
  if (typeof window !== 'undefined') {
    fetch('/api/supabase/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: SUPABASE_URL, key: SUPABASE_ANON_KEY }),
    }).catch(() => {});
  }
}

export interface TableStatus {
  name: string;
  exists: boolean;
  rowCount: number;
  error?: string;
}

export interface SupabaseHealthResult {
  connected: boolean;
  projectUrl: string;
  tables: Record<string, TableStatus>;
  allTablesExist: boolean;
  lastChecked: string;
}

const TABLE_NAMES = [
  'users',
  'docks',
  'routes',
  'vessels',
  'schedules',
  'reservations',
  'notifications',
  'weather',
  'sos_reports',
  'audit_logs',
];

/**
 * Check connection and status of each table in Supabase
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthResult> {
  const result: SupabaseHealthResult = {
    connected: false,
    projectUrl: SUPABASE_URL,
    tables: {},
    allTablesExist: false,
    lastChecked: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WITA',
  };

  try {
    let allExist = true;

    for (const tableName of TABLE_NAMES) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('id')
          .limit(1);

        if (error) {
          allExist = false;
          result.tables[tableName] = {
            name: tableName,
            exists: false,
            rowCount: 0,
            error: error.message || 'Tabel belum dibuat',
          };
        } else {
          // Table exists, get row count
          const { count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          result.tables[tableName] = {
            name: tableName,
            exists: true,
            rowCount: count ?? (Array.isArray(data) ? data.length : 0),
          };
        }
      } catch (err: any) {
        allExist = false;
        result.tables[tableName] = {
          name: tableName,
          exists: false,
          rowCount: 0,
          error: err?.message || 'Error koneksi',
        };
      }
    }

    result.connected = true;
    result.allTablesExist = allExist;
    return result;
  } catch (err: any) {
    result.connected = false;
    return result;
  }
}

/**
 * Upload seed/current data into Supabase tables if they exist
 */
export async function seedDataToSupabase(data: {
  users: User[];
  docks: Dock[];
  routes: RouteItem[];
  vessels: Vessel[];
  schedules: Schedule[];
  reservations: Reservation[];
  weather: WeatherReport[];
  notifications: NotificationItem[];
  sos: SOSReport[];
  audit: AuditLog[];
}): Promise<{ success: boolean; messages: string[] }> {
  const messages: string[] = [];

  // 1. Docks
  try {
    if (data.docks && data.docks.length > 0) {
      const docksPayload = data.docks.map((d) => ({
        id: d.id,
        name: d.name,
        address: d.address,
        lat: d.lat,
        lng: d.lng,
        status: d.status,
        province: d.province || null,
        city: d.city || null,
        region: d.region || null,
        dock_role: d.dockRole || 'both',
        facilities: d.facilities || [],
        contact_phone: d.contactPhone || null,
      }));
      const { error } = await supabase.from('docks').upsert(docksPayload, { onConflict: 'id' });
      if (error) messages.push(`Docks: ${error.message}`);
      else messages.push(`Berhasil sinkron ${docksPayload.length} Dermaga`);
    }
  } catch (e: any) {
    messages.push(`Docks error: ${e.message}`);
  }

  // 2. Users
  try {
    if (data.users && data.users.length > 0) {
      const usersPayload = data.users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || null,
        role: u.role,
        avatar: u.avatar || null,
      }));
      const { error } = await supabase.from('users').upsert(usersPayload, { onConflict: 'id' });
      if (error) messages.push(`Users: ${error.message}`);
      else messages.push(`Berhasil sinkron ${usersPayload.length} Pengguna`);
    }
  } catch (e: any) {
    messages.push(`Users error: ${e.message}`);
  }

  // 3. Vessels
  try {
    if (data.vessels && data.vessels.length > 0) {
      const vesselsPayload = data.vessels.map((v) => ({
        id: v.id,
        name: v.name,
        registration_number: v.registrationNumber || null,
        type: v.type,
        capacity_passengers: v.capacityPassengers,
        capacity_motorbikes: v.capacityMotorbikes,
        capacity_cars: v.capacityCars,
        capacity_trucks: v.capacityTrucks || 0,
        status: v.status,
        operator_id: v.operatorId || null,
        operator_name: v.operatorName || null,
        operator_phone: v.operatorPhone || null,
        speed_kts: v.speedKts,
        heading_deg: v.headingDeg,
        current_lat: v.currentLat,
        current_lng: v.currentLng,
        last_updated: v.lastUpdated || null,
        current_route_id: v.currentRouteId || null,
        operating_routes_description: v.operatingRoutesDescription || null,
      }));
      const { error } = await supabase.from('vessels').upsert(vesselsPayload, { onConflict: 'id' });
      if (error) messages.push(`Vessels: ${error.message}`);
      else messages.push(`Berhasil sinkron ${vesselsPayload.length} Kapal`);
    }
  } catch (e: any) {
    messages.push(`Vessels error: ${e.message}`);
  }

  // 4. Routes
  try {
    if (data.routes && data.routes.length > 0) {
      const routesPayload = data.routes.map((r) => ({
        id: r.id,
        name: r.name,
        origin_dock_id: r.originDockId,
        origin_dock_name: r.originDockName,
        destination_dock_id: r.destinationDockId,
        destination_dock_name: r.destinationDockName,
        distance_km: r.distanceKm,
        distance_miles: r.distanceMiles || null,
        estimated_duration_minutes: r.estimatedDurationMinutes,
        tariff_passenger: r.tariffPassenger,
        tariff_child: r.tariffChild || 0,
        tariff_motorbike: r.tariffMotorbike,
        tariff_car: r.tariffCar,
        tariff_truck: r.tariffTruck || 0,
        status: r.status,
        region: r.region || null,
        vessel_types_available: r.vesselTypesAvailable || [],
        description: r.description || null,
        frequency_text: r.frequencyText || null,
      }));
      const { error } = await supabase.from('routes').upsert(routesPayload, { onConflict: 'id' });
      if (error) messages.push(`Routes: ${error.message}`);
      else messages.push(`Berhasil sinkron ${routesPayload.length} Rute`);
    }
  } catch (e: any) {
    messages.push(`Routes error: ${e.message}`);
  }

  // 5. Schedules
  try {
    if (data.schedules && data.schedules.length > 0) {
      const schedulesPayload = data.schedules.map((s) => ({
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
        tariff_child: s.tariffChild || 0,
        tariff_motorbike: s.tariffMotorbike,
        tariff_car: s.tariffCar,
        tariff_truck: s.tariffTruck || 0,
        status: s.status,
        status_reason: s.statusReason || null,
        booked_passengers: s.bookedPassengers,
        max_passengers: s.maxPassengers,
        booked_motorbikes: s.bookedMotorbikes,
        booked_cars: s.bookedCars,
        booked_trucks: s.bookedTrucks || 0,
      }));
      const { error } = await supabase.from('schedules').upsert(schedulesPayload, { onConflict: 'id' });
      if (error) messages.push(`Schedules: ${error.message}`);
      else messages.push(`Berhasil sinkron ${schedulesPayload.length} Jadwal`);
    }
  } catch (e: any) {
    messages.push(`Schedules error: ${e.message}`);
  }

  // 6. Reservations
  try {
    if (data.reservations && data.reservations.length > 0) {
      const reservationsPayload = data.reservations.map((res) => ({
        id: res.id,
        booking_code: res.bookingCode,
        user_id: res.userId,
        user_name: res.userName,
        user_phone: res.userPhone,
        user_email: res.userEmail || null,
        schedule_id: res.scheduleId,
        vessel_name: res.vesselName,
        vessel_type: res.vesselType || null,
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
        base_price: res.basePrice || 0,
        insurance_fee: res.insuranceFee || 0,
        port_service_fee: res.portServiceFee || 0,
        total_price: res.totalPrice,
        payment_method: res.paymentMethod || null,
        payment_status: res.paymentStatus,
        reservation_status: res.reservationStatus,
        check_in_status: res.checkInStatus || 'Belum Check-In',
        check_in_time: res.checkInTime || null,
        scanned_by: res.scannedBy || null,
        scanned_at: res.scannedAt || null,
        gate_number: res.gateNumber || null,
        created_at: res.createdAt,
        qr_code_url: res.qrCodeUrl || null,
        cancellation_reason: res.cancellationReason || null,
        cancelled_at: res.cancelledAt || null,
        payment_details: res.paymentDetails || null,
      }));
      const { error } = await supabase.from('reservations').upsert(reservationsPayload, { onConflict: 'id' });
      if (error) messages.push(`Reservations: ${error.message}`);
      else messages.push(`Berhasil sinkron ${reservationsPayload.length} Tiket / Reservasi`);
    }
  } catch (e: any) {
    messages.push(`Reservations error: ${e.message}`);
  }

  // 7. Weather
  try {
    if (data.weather && data.weather.length > 0) {
      const weatherPayload = data.weather.map((w) => ({
        id: w.id,
        route_name: w.routeName,
        origin_dock_name: w.originDockName,
        destination_dock_name: w.destinationDockName,
        condition: w.condition,
        wave_height_meters: w.waveHeightMeters,
        wind_speed_kmh: w.windSpeedKmH,
        wind_direction: w.windDirection,
        status: w.status,
        official_advice: w.officialAdvice || null,
        updated_at: w.updatedAt || null,
      }));
      const { error } = await supabase.from('weather').upsert(weatherPayload, { onConflict: 'id' });
      if (error) messages.push(`Weather: ${error.message}`);
      else messages.push(`Berhasil sinkron ${weatherPayload.length} Prakiraan Cuaca`);
    }
  } catch (e: any) {
    messages.push(`Weather error: ${e.message}`);
  }

  return {
    success: messages.some((m) => m.startsWith('Berhasil')),
    messages,
  };
}

/**
 * Clear / Delete all rows from all Supabase tables
 */
export async function clearAllSupabaseData(): Promise<{ success: boolean; messages: string[] }> {
  const messages: string[] = [];
  // Delete in reverse dependency order
  const tablesToClear = [
    'reservations',
    'schedules',
    'routes',
    'vessels',
    'docks',
    'notifications',
    'weather',
    'sos_reports',
    'audit_logs',
    'users',
  ];

  for (const tableName of tablesToClear) {
    try {
      const { error } = await supabase.from(tableName).delete().neq('id', '___empty_filter___');
      if (error) {
        messages.push(`${tableName}: ${error.message}`);
      } else {
        messages.push(`${tableName}: Data dibersihkan`);
      }
    } catch (e: any) {
      messages.push(`${tableName}: ${e?.message || 'Error'}`);
    }
  }

  return {
    success: true,
    messages,
  };
}
