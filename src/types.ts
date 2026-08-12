export type Role = 'passenger' | 'operator' | 'admin';

export type VesselType = 'Klotok' | 'Speedboat' | 'Feri' | 'Kapal Perintis' | 'Lainnya';

export type VesselStatus = 'Bertambat' | 'Dalam Perjalanan' | 'Delay' | 'Batal';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatar?: string;
}

export interface Vessel {
  id: string;
  name: string;
  registrationNumber: string;
  type: VesselType;
  capacityPassengers: number;
  capacityMotorbikes: number;
  capacityCars: number;
  status: VesselStatus;
  operatorId: string;
  operatorName: string;
  operatorPhone: string;
  speedKts: number;
  headingDeg: number;
  currentLat: number;
  currentLng: number;
  lastUpdated: string;
  currentRouteId?: string;
}

export type RegionIndonesia = 'Jawa & Bali' | 'Sumatera' | 'Kalimantan' | 'Sulawesi' | 'Nusa Tenggara' | 'Maluku & Papua';

export interface Dock {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: 'Aktif' | 'Perbaikan' | 'Non-Aktif';
  province?: string;
  region?: RegionIndonesia;
}

export interface RouteItem {
  id: string;
  name: string;
  originDockId: string;
  originDockName: string;
  destinationDockId: string;
  destinationDockName: string;
  distanceKm: number;
  estimatedDurationMinutes: number;
  tariffPassenger: number;
  tariffMotorbike: number;
  tariffCar: number;
  status: 'Operasional' | 'Ditutup' | 'Waspada';
  region?: RegionIndonesia;
  vesselTypesAvailable?: VesselType[];
  description?: string;
  frequencyText?: string;
}

export type ScheduleStatus = 'scheduled' | 'boarding' | 'on_time' | 'delayed' | 'cancelled' | 'completed';

export interface Schedule {
  id: string;
  vesselId: string;
  vesselName: string;
  vesselType: VesselType;
  routeId: string;
  originDockName: string;
  destinationDockName: string;
  date: string; // YYYY-MM-DD
  departureTime: string; // HH:mm
  estimatedArrivalTime: string; // HH:mm
  tariffPassenger: number;
  tariffMotorbike: number;
  tariffCar: number;
  status: ScheduleStatus;
  statusReason?: string;
  bookedPassengers: number;
  maxPassengers: number;
  bookedMotorbikes: number;
  bookedCars: number;
}

export interface Reservation {
  id: string;
  bookingCode: string;
  userId: string;
  userName: string;
  userPhone: string;
  scheduleId: string;
  vesselName: string;
  originDockName: string;
  destinationDockName: string;
  travelDate: string;
  departureTime: string;
  passengersCount: number;
  motorbikesCount: number;
  carsCount: number;
  totalPrice: number;
  paymentStatus: 'Lunas' | 'Menunggu' | 'Gagal';
  reservationStatus: 'Terkonfirmasi' | 'Menunggu' | 'Dibatalkan' | 'Selesai';
  createdAt: string;
  qrCodeUrl?: string;
}

export type NotificationType = 'ship' | 'delay' | 'cancel' | 'weather' | 'booking' | 'sos';

export interface NotificationItem {
  id: string;
  userId: string; // 'all', or specific user id
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export type SafetyLevel = 'Aman' | 'Waspada' | 'Siaga' | 'Berbahaya';

export interface WeatherReport {
  id: string;
  routeName: string;
  originDockName: string;
  destinationDockName: string;
  condition: string; // 'Cerah' | 'Hujan Ringan' | 'Hujan Lebat' | 'Badai'
  waveHeightMeters: number;
  windSpeedKmH: number;
  windDirection: string;
  status: SafetyLevel;
  officialAdvice: string;
  updatedAt: string;
}

export interface SOSReport {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  vesselName?: string;
  lat: number;
  lng: number;
  time: string;
  emergencyType: string;
  description: string;
  bookingCode?: string;
  status: 'Baru' | 'Dalam Penanganan' | 'Selesai';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  details: string;
  timestamp: string;
}
