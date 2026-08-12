import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
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
import { Vessel, Dock, RouteItem, Schedule, Reservation, WeatherReport, NotificationItem, SOSReport, AuditLog } from './src/types';

// In-Memory Database
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
    addAuditLog('Operator / Syahbandar', 'admin', 'UPDATE_VESSEL', `Memperbarui status kapal: ${updated.name} -> ${updated.status}`);
    res.json(updated);
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
    addAuditLog('Admin Syahbandar', 'admin', 'ADD_DOCK', `Menambah dermaga: ${newDock.name}`);
    res.status(201).json(newDock);
  });

  // Routes
  app.get('/api/routes', (_req, res) => {
    res.json(routes);
  });

  app.post('/api/routes', (req, res) => {
    const newRoute: RouteItem = { id: `route_${Date.now()}`, ...req.body };
    routes.push(newRoute);
    addAuditLog('Admin Syahbandar', 'admin', 'ADD_ROUTE', `Menambah rute pelayaran: ${newRoute.name}`);
    res.status(201).json(newRoute);
  });

  // Schedules
  app.get('/api/schedules', (_req, res) => {
    res.json(schedules);
  });

  app.post('/api/schedules', (req, res) => {
    const newSchedule: Schedule = { id: `sch_${Date.now()}`, ...req.body };
    schedules.unshift(newSchedule);
    addAuditLog('Admin Syahbandar', 'admin', 'ADD_SCHEDULE', `Membuat jadwal baru ${newSchedule.vesselName}`);
    res.status(201).json(newSchedule);
  });

  app.put('/api/schedules/:id', (req, res) => {
    const { id } = req.params;
    const index = schedules.findIndex((s) => s.id === id);
    if (index === -1) return res.status(404).json({ error: 'Schedule not found' });
    schedules[index] = { ...schedules[index], ...req.body };

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

  // Reservations / Bookings
  app.get('/api/reservations', (_req, res) => {
    res.json(reservations);
  });

  app.post('/api/reservations', (req, res) => {
    const { scheduleId, userId, userName, userPhone, passengersCount, motorbikesCount, carsCount } = req.body;
    const schIndex = schedules.findIndex((s) => s.id === scheduleId);
    if (schIndex === -1) return res.status(404).json({ error: 'Jadwal tidak ditemukan' });

    const sch = schedules[schIndex];
    
    // Check quota
    if (sch.bookedPassengers + passengersCount > sch.maxPassengers) {
      return res.status(400).json({ error: 'Kapal penuh. Silakan pilih jadwal berikutnya.' });
    }

    // Update booked quota
    schedules[schIndex].bookedPassengers += passengersCount;
    schedules[schIndex].bookedMotorbikes += (motorbikesCount || 0);
    schedules[schIndex].bookedCars += (carsCount || 0);

    const bookingCode = `KK-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(100 + Math.random() * 900)}`;
    const totalPrice = (passengersCount * sch.tariffPassenger) + 
                       ((motorbikesCount || 0) * sch.tariffMotorbike) + 
                       ((carsCount || 0) * sch.tariffCar);

    const newRes: Reservation = {
      id: `res_${Date.now()}`,
      bookingCode,
      userId: userId || 'usr_pass_1',
      userName: userName || 'Ahmad Faisal',
      userPhone: userPhone || '0812-3456-7890',
      scheduleId: sch.id,
      vesselName: sch.vesselName,
      originDockName: sch.originDockName,
      destinationDockName: sch.destinationDockName,
      travelDate: sch.date,
      departureTime: `${sch.departureTime} WITA`,
      passengersCount,
      motorbikesCount: motorbikesCount || 0,
      carsCount: carsCount || 0,
      totalPrice,
      paymentStatus: 'Lunas',
      reservationStatus: 'Terkonfirmasi',
      createdAt: new Date().toISOString().slice(0,10) + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${bookingCode}`,
    };

    reservations.unshift(newRes);

    // Push notification for passenger
    notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: newRes.userId,
      title: '🎟️ Reservasi Berhasil',
      message: `Tiket Kode Booking ${bookingCode} (${sch.vesselName}) telah berhasil dikonfirmasi.`,
      type: 'booking',
      read: false,
      createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    });

    res.status(201).json(newRes);
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

  // Vite middleware or production static
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
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
