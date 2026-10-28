import { User, Vessel, Dock, RouteItem, Schedule, Reservation, WeatherReport, NotificationItem, SOSReport, AuditLog } from '../types';

// ============================================================================
// DATA RESMI PELABUHAN FERRY KAMPUNG BARU (KASIPUTE, BOMBANA, SULTRA)
// Sesuai dokumen resmi: DATA PELABUHAN FERRY KAMPUNG BARU
// ============================================================================

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin_1',
    name: 'Administrator Pelabuhan',
    email: 'admin@kapalku.id',
    phone: '0811-4090-265',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr_officer_1',
    name: 'Petugas Gate Kampung Baru',
    email: 'petugas@kapalku.id',
    phone: '0812-4211-3344',
    role: 'officer',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr_passenger_1',
    name: 'Ahmad Faisal',
    email: 'penumpang@kapalku.id',
    phone: '0813-5566-7788',
    role: 'passenger',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  },
];

// 1. Data Pelabuhan / Dermaga Resmi
export const INITIAL_DOCKS: Dock[] = [
  {
    id: 'dock_kasipute',
    name: 'Pelabuhan Ferry Kampung Baru (Kasipute, Bombana)',
    address: 'Kel. Kampung Baru, Kec. Rumbia, Kab. Bombana, Sulawesi Tenggara',
    lat: -4.6853,
    lng: 122.0298,
    status: 'Aktif',
    province: 'Sulawesi Tenggara',
    region: 'Sulawesi',
    city: 'Bombana',
    dockRole: 'both',
    facilities: [
      'Dermaga Feri Ro-Ro',
      'Loket Tiket Resmi',
      'Ruang Tunggu Ber-AC',
      'Parkir Kendaraan & Truk Luas',
      'Posko Syahbandar / BPTD',
      'Musholla & Toilet Bersih',
      'Kantin & Rest Area',
    ],
    contactPhone: '0811-4090-265',
  },
  {
    id: 'dock_pising',
    name: 'Pelabuhan Pising (Kabaena Utara, Bombana)',
    address: 'Desa Pising, Kec. Kabaena Utara, Kab. Bombana, Sulawesi Tenggara',
    lat: -5.1683,
    lng: 121.9560,
    status: 'Aktif',
    province: 'Sulawesi Tenggara',
    region: 'Sulawesi',
    city: 'Bombana (Pulau Kabaena)',
    dockRole: 'both',
    facilities: [
      'Dermaga Feri Ro-Ro',
      'Loket Tiket Resmi',
      'Ruang Tunggu Penumpang',
      'Area Parkir Antrean Kendaraan',
      'Pos Pengawasan Dermaga',
    ],
    contactPhone: '0812-4211-3344',
  },
  {
    id: 'dock_tondasi',
    name: 'Pelabuhan Tondasi (Muna Barat)',
    address: 'Desa Tondasi, Kec. Tiworo Utara, Kab. Muna Barat, Sulawesi Tenggara',
    lat: -4.8462,
    lng: 122.4285,
    status: 'Aktif',
    province: 'Sulawesi Tenggara',
    region: 'Sulawesi',
    city: 'Muna Barat',
    dockRole: 'both',
    facilities: [
      'Dermaga Feri Ro-Ro',
      'Loket Tiket',
      'Ruang Tunggu Beratap',
      'Parkir Kendaraan',
      'Pos Syahbandar',
    ],
    contactPhone: '0813-5566-7788',
  },
  {
    id: 'dock_sikeli',
    name: 'Pelabuhan Sikeli (Kabaena Barat, Bombana)',
    address: 'Kel. Sikeli, Kec. Kabaena Barat, Kab. Bombana, Sulawesi Tenggara',
    lat: -5.3262,
    lng: 121.8485,
    status: 'Aktif',
    province: 'Sulawesi Tenggara',
    region: 'Sulawesi',
    city: 'Bombana (Pulau Kabaena)',
    dockRole: 'both',
    facilities: [
      'Dermaga Feri Ro-Ro',
      'Loket Tiket Resmi',
      'Ruang Tunggu',
      'Area Parkir',
      'Pos Jaga Kesyahbandaran',
    ],
    contactPhone: '0821-9988-1122',
  },
];

// 2. Data Kapal Ferry Resmi yang Beroperasi di Pelabuhan Ferry Kampung Baru
export const INITIAL_VESSELS: Vessel[] = [
  {
    id: 'vsl_oputa_yi_ko',
    name: 'KMP Oputa Yi Ko',
    registrationNumber: 'PK-OPUTA-265-SULTRA',
    type: 'Feri',
    capacityPassengers: 265, // Sesuai Dokumen: Kapasitas 265 Orang
    capacityMotorbikes: 80,
    capacityCars: 30,
    capacityTrucks: 15,
    status: 'Bertambat',
    operatorId: 'op_asdp_baubau',
    operatorName: 'PT ASDP Indonesia Ferry (Persero)',
    operatorPhone: '0811-4090-265',
    speedKts: 11,
    headingDeg: 85,
    currentLat: -4.6853,
    currentLng: 122.0298,
    lastUpdated: '08:00 WITA',
    operatingRoutesDescription: 'Kasipute – Pising (3x seminggu, 3 jam, 32 Mil) & Kasipute – Tondasi (2x seminggu, 2 jam, 20 Mil)',
  },
  {
    id: 'vsl_bontoharu',
    name: 'KMP Bontoharu',
    registrationNumber: 'PK-BONTO-350-SULTRA',
    type: 'Feri',
    capacityPassengers: 350, // Sesuai Dokumen: Kapasitas 350 Orang
    capacityMotorbikes: 120,
    capacityCars: 45,
    capacityTrucks: 20,
    status: 'Bertambat',
    operatorId: 'op_asdp_baubau',
    operatorName: 'PT ASDP Indonesia Ferry (Persero)',
    operatorPhone: '0811-4090-350',
    speedKts: 10,
    headingDeg: 195,
    currentLat: -4.6870,
    currentLng: 122.0320,
    lastUpdated: '08:00 WITA',
    operatingRoutesDescription: 'Kasipute – Sikeli (6 jam, 60 Mil)',
  },
];

// 3. Data Jalur Pelayaran & Tarif Tiket Lengkap Sesuai Dokumen Resmi
export const INITIAL_ROUTES: RouteItem[] = [
  {
    id: 'route_kasipute_pising',
    name: 'Kasipute (Kampung Baru) - Pising (Kabaena Utara)',
    originDockId: 'dock_kasipute',
    originDockName: 'Pelabuhan Ferry Kampung Baru (Kasipute, Bombana)',
    destinationDockId: 'dock_pising',
    destinationDockName: 'Pelabuhan Pising (Kabaena Utara, Bombana)',
    distanceMiles: 32, // Sesuai Dokumen: Jarak Kasipute - Pising 32 Mile
    distanceKm: 59.3,
    estimatedDurationMinutes: 180, // Sesuai Dokumen: Estimasi 3 Jam
    tariffPassenger: 45000, // Dewasa: Rp 45.000
    tariffChild: 7000, // Anak-anak: Rp 7.000
    tariffMotorbike: 92000, // Motor: Rp 92.000
    tariffCar: 941000, // Mobil: Rp 941.000
    tariffTruck: 1507000, // Mobil Truk: Rp 1.507.000
    status: 'Operasional',
    region: 'Sulawesi',
    vesselTypesAvailable: ['Feri'],
    frequencyText: '3 Kali Seminggu', // Sesuai Dokumen: 3 kali Seminggu
    description: 'Jalur pelayaran KMP Oputa Yi Ko menghubungkan Pelabuhan Ferry Kampung Baru (Kasipute) dengan Pelabuhan Pising Pulau Kabaena (Jarak 32 Mil, Estimasi Perjalanan 3 Jam).',
  },
  {
    id: 'route_kasipute_tondasi',
    name: 'Kasipute (Kampung Baru) - Tondasi (Muna Barat)',
    originDockId: 'dock_kasipute',
    originDockName: 'Pelabuhan Ferry Kampung Baru (Kasipute, Bombana)',
    destinationDockId: 'dock_tondasi',
    destinationDockName: 'Pelabuhan Tondasi (Muna Barat)',
    distanceMiles: 20, // Sesuai Dokumen: Jarak Kasipute - Tondasi 20 Mile
    distanceKm: 37.0,
    estimatedDurationMinutes: 120, // Sesuai Dokumen: Estimasi 2 Jam
    tariffPassenger: 31000, // Dewasa: Rp 31.000
    tariffChild: 4000, // Anak-anak: Rp 4.000
    tariffMotorbike: 82000, // Motor: Rp 82.000
    tariffCar: 487000, // Mobil: Rp 487.000
    tariffTruck: 765000, // Mobil Truk: Rp 765.000
    status: 'Operasional',
    region: 'Sulawesi',
    vesselTypesAvailable: ['Feri'],
    frequencyText: '2 Kali Seminggu', // Sesuai Dokumen: 2 Kali Seminggu
    description: 'Jalur pelayaran KMP Oputa Yi Ko menghubungkan Pelabuhan Ferry Kampung Baru (Kasipute) dengan Pelabuhan Tondasi di Muna Barat (Jarak 20 Mil, Estimasi Perjalanan 2 Jam).',
  },
  {
    id: 'route_kasipute_sikeli',
    name: 'Kasipute (Kampung Baru) - Sikeli (Kabaena Barat)',
    originDockId: 'dock_kasipute',
    originDockName: 'Pelabuhan Ferry Kampung Baru (Kasipute, Bombana)',
    destinationDockId: 'dock_sikeli',
    destinationDockName: 'Pelabuhan Sikeli (Kabaena Barat, Bombana)',
    distanceMiles: 60, // Sesuai Dokumen: Jarak Kasipute - Sikeli 60 Mile
    distanceKm: 111.1,
    estimatedDurationMinutes: 360, // Sesuai Dokumen: Estimasi 6 Jam
    tariffPassenger: 69000, // Dewasa: Rp 69.000
    tariffChild: 46000, // Anak-anak: Rp 46.000
    tariffMotorbike: 149000, // Motor: Rp 149.000
    tariffCar: 1048000, // Mobil: Rp 1.048.000
    tariffTruck: 2017000, // Mobil Truk: Rp 2.017.000
    status: 'Operasional',
    region: 'Sulawesi',
    vesselTypesAvailable: ['Feri'],
    frequencyText: '2 Kali Seminggu',
    description: 'Jalur pelayaran KMP Bontoharu menghubungkan Pelabuhan Ferry Kampung Baru (Kasipute) dengan Pelabuhan Sikeli Kabaena Barat (Jarak 60 Mil, Estimasi Perjalanan 6 Jam).',
  },
];

// 4. Jadwal Keberangkatan Pelayaran Reguler
export const INITIAL_SCHEDULES: Schedule[] = [
  {
    id: 'sch_oputa_pising_1',
    vesselId: 'vsl_oputa_yi_ko',
    vesselName: 'KMP Oputa Yi Ko',
    vesselType: 'Feri',
    routeId: 'route_kasipute_pising',
    originDockName: 'Pelabuhan Ferry Kampung Baru (Kasipute, Bombana)',
    destinationDockName: 'Pelabuhan Pising (Kabaena Utara, Bombana)',
    date: new Date().toISOString().split('T')[0],
    departureTime: '08:00',
    estimatedArrivalTime: '11:00',
    tariffPassenger: 45000,
    tariffChild: 7000,
    tariffMotorbike: 92000,
    tariffCar: 941000,
    tariffTruck: 1507000,
    status: 'scheduled',
    maxPassengers: 265,
    bookedPassengers: 42,
    bookedMotorbikes: 14,
    bookedCars: 5,
    bookedTrucks: 2,
  },
  {
    id: 'sch_oputa_tondasi_1',
    vesselId: 'vsl_oputa_yi_ko',
    vesselName: 'KMP Oputa Yi Ko',
    vesselType: 'Feri',
    routeId: 'route_kasipute_tondasi',
    originDockName: 'Pelabuhan Ferry Kampung Baru (Kasipute, Bombana)',
    destinationDockName: 'Pelabuhan Tondasi (Muna Barat)',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    departureTime: '09:00',
    estimatedArrivalTime: '11:00',
    tariffPassenger: 31000,
    tariffChild: 4000,
    tariffMotorbike: 82000,
    tariffCar: 487000,
    tariffTruck: 765000,
    status: 'scheduled',
    maxPassengers: 265,
    bookedPassengers: 28,
    bookedMotorbikes: 9,
    bookedCars: 3,
    bookedTrucks: 1,
  },
  {
    id: 'sch_bontoharu_sikeli_1',
    vesselId: 'vsl_bontoharu',
    vesselName: 'KMP Bontoharu',
    vesselType: 'Feri',
    routeId: 'route_kasipute_sikeli',
    originDockName: 'Pelabuhan Ferry Kampung Baru (Kasipute, Bombana)',
    destinationDockName: 'Pelabuhan Sikeli (Kabaena Barat, Bombana)',
    date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    departureTime: '07:00',
    estimatedArrivalTime: '13:00',
    tariffPassenger: 69000,
    tariffChild: 46000,
    tariffMotorbike: 149000,
    tariffCar: 1048000,
    tariffTruck: 2017000,
    status: 'scheduled',
    maxPassengers: 350,
    bookedPassengers: 65,
    bookedMotorbikes: 22,
    bookedCars: 8,
    bookedTrucks: 3,
  },
];

// Template Preset Dermaga Nasional (Katalog Referensi Tambahan untuk Admin)
export const PRESET_NATIONAL_DOCKS: Dock[] = [
  ...INITIAL_DOCKS,
  // Kalimantan
  {
    id: 'dock_1',
    name: 'Dermaga Semayang (Balikpapan)',
    address: 'Jl. Yos Sudarso No. 1, Prapatan, Balikpapan Kota',
    lat: -1.2721,
    lng: 116.8190,
    status: 'Aktif',
    province: 'Kalimantan Timur',
    region: 'Kalimantan',
  },
  {
    id: 'dock_2',
    name: 'Dermaga Penajam (Penajam Paser Utara)',
    address: 'Jl. Propinsi Km. 1, Penajam',
    lat: -1.2485,
    lng: 116.7820,
    status: 'Aktif',
    province: 'Kalimantan Timur',
    region: 'Kalimantan',
  },
  // Jawa & Bali
  {
    id: 'dock_7',
    name: 'Pelabuhan Merak (Cilegon, Banten)',
    address: 'Jl. Pelabuhan Merak, Tamansari, Pulomerak, Cilegon',
    lat: -5.9328,
    lng: 105.9997,
    status: 'Aktif',
    province: 'Banten',
    region: 'Jawa & Bali',
  },
  {
    id: 'dock_8',
    name: 'Pelabuhan Ketapang (Banyuwangi)',
    address: 'Jl. Yos Sudarso No.1, Kalipuro, Banyuwangi',
    lat: -8.1481,
    lng: 114.3976,
    status: 'Aktif',
    province: 'Jawa Timur',
    region: 'Jawa & Bali',
  },
  {
    id: 'dock_9',
    name: 'Pelabuhan Gilimanuk (Bali)',
    address: 'Gilimanuk, Melaya, Jembrana, Bali',
    lat: -8.1633,
    lng: 114.4371,
    status: 'Aktif',
    province: 'Bali',
    region: 'Jawa & Bali',
  },
  // Sumatera
  {
    id: 'dock_13',
    name: 'Pelabuhan Bakauheni (Lampung)',
    address: 'Bakauheni, Lampung Selatan',
    lat: -5.8672,
    lng: 105.7533,
    status: 'Aktif',
    province: 'Lampung',
    region: 'Sumatera',
  },
];

// 5. Data Reservasi Tiket (Awalnya kosong, dihitung setelah pengguna melakukan pemesanan dan pembayaran)
export const INITIAL_RESERVATIONS: Reservation[] = [];

export const INITIAL_WEATHER: WeatherReport[] = [
  {
    id: 'wtr_kasipute',
    routeName: 'Kasipute - Pising (Selat Kabaena)',
    originDockName: 'Pelabuhan Ferry Kampung Baru (Kasipute, Bombana)',
    destinationDockName: 'Pelabuhan Pising (Kabaena Utara, Bombana)',
    condition: 'Cerah Berawan',
    waveHeightMeters: 0.6,
    windSpeedKmH: 15,
    windDirection: 'Tenggara',
    status: 'Aman',
    officialAdvice: 'Kondisi perairan Kasipute dan Selat Kabaena aman untuk pelayaran kapal feri.',
    updatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA',
  },
  {
    id: 'wtr_tondasi',
    routeName: 'Kasipute - Tondasi (Selat Tiworo)',
    originDockName: 'Pelabuhan Ferry Kampung Baru (Kasipute, Bombana)',
    destinationDockName: 'Pelabuhan Tondasi (Muna Barat)',
    condition: 'Cerah',
    waveHeightMeters: 0.8,
    windSpeedKmH: 18,
    windDirection: 'Selatan',
    status: 'Aman',
    officialAdvice: 'Kondisi perairan Selat Tiworo dalam kategori aman dan kondusif.',
    updatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_kp_1',
    userId: 'all',
    title: '🚢 Data Pelabuhan Ferry Kampung Baru Aktif',
    message: 'Data pelabuhan, armada KMP Oputa Yi Ko, KMP Bontoharu, serta tarif resmi tiket telah dimuat di sistem.',
    type: 'ship',
    read: false,
    createdAt: '08:00 WITA',
  },
];

export const INITIAL_SOS: SOSReport[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_init_kp',
    actorName: 'Administrator Sistem',
    actorRole: 'admin',
    action: 'INIT_KAMPUNG_BARU_DATA',
    details: 'Inisialisasi data Pelabuhan Ferry Kampung Baru, KMP Oputa Yi Ko & KMP Bontoharu beserta tarif dan rute resmi.',
    timestamp: '08:00 WITA',
  },
];
