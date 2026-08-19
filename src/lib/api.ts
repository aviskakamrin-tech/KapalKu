import { User, AuthResponse, Vessel, Dock, RouteItem, Schedule, Reservation, WeatherReport, NotificationItem, SOSReport, AuditLog } from '../types';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Auth
  getUsers: () => fetchJson<User[]>('/api/users'),
  login: (data: { identifier: string; password?: string; role?: string }) =>
    fetchJson<AuthResponse>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  register: (data: {
    name: string;
    email?: string;
    phone?: string;
    role: string;
    agencyOrVessel?: string;
    nipOrLicense?: string;
    password?: string;
  }) =>
    fetchJson<AuthResponse>('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // Vessels
  getVessels: () => fetchJson<Vessel[]>('/api/vessels'),
  createVessel: (data: Partial<Vessel>) =>
    fetchJson<Vessel>('/api/vessels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  updateVessel: (id: string, data: Partial<Vessel>) =>
    fetchJson<Vessel>(`/api/vessels/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  updateGPS: (data: { vesselId: string; lat: number; lng: number; speedKts?: number; headingDeg?: number; status?: string }) =>
    fetchJson<{ success: boolean; vessel: Vessel }>('/api/gps/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // Docks
  getDocks: () => fetchJson<Dock[]>('/api/docks'),
  createDock: (data: Partial<Dock>) =>
    fetchJson<Dock>('/api/docks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // Routes
  getRoutes: () => fetchJson<RouteItem[]>('/api/routes'),
  createRoute: (data: Partial<RouteItem>) =>
    fetchJson<RouteItem>('/api/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // Schedules
  getSchedules: () => fetchJson<Schedule[]>('/api/schedules'),
  createSchedule: (data: Partial<Schedule>) =>
    fetchJson<Schedule>('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  updateSchedule: (id: string, data: Partial<Schedule>) =>
    fetchJson<Schedule>(`/api/schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // Reservations
  getReservations: () => fetchJson<Reservation[]>('/api/reservations'),
  createReservation: (data: {
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
  }) =>
    fetchJson<Reservation>('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  validateTicket: (code: string) =>
    fetchJson<{ valid: boolean; reservation?: Reservation; message: string }>('/api/reservations/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }),
  checkInTicket: (code: string, officerName?: string) =>
    fetchJson<{ success: boolean; reservation: Reservation; message: string }>('/api/reservations/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, officerName }),
    }),
  completePayment: (id: string, paymentMethod?: string) =>
    fetchJson<Reservation>(`/api/reservations/${id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod }),
    }),
  cancelReservation: (id: string, reason?: string) =>
    fetchJson<Reservation>(`/api/reservations/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }),

  // Weather
  getWeather: () => fetchJson<WeatherReport[]>('/api/weather'),
  updateWeather: (id: string, data: Partial<WeatherReport>) =>
    fetchJson<WeatherReport>(`/api/weather/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // Notifications
  getNotifications: () => fetchJson<NotificationItem[]>('/api/notifications'),
  createNotification: (data: Partial<NotificationItem>) =>
    fetchJson<NotificationItem>('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // SOS
  getSOS: () => fetchJson<SOSReport[]>('/api/sos'),
  sendSOS: (data: Partial<SOSReport>) =>
    fetchJson<SOSReport>('/api/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  updateSOS: (id: string, data: Partial<SOSReport>) =>
    fetchJson<SOSReport>(`/api/sos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // Audit & Stats
  getAudit: () => fetchJson<AuditLog[]>('/api/audit'),
  getStats: () =>
    fetchJson<{
      activeVessels: number;
      sailingVessels: number;
      todayReservations: number;
      totalSchedulesToday: number;
      delayedCount: number;
      cancelledCount: number;
      openSOSCount: number;
    }>('/api/stats'),
};
