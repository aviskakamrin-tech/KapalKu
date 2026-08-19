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
import { User, Vessel, Dock, RouteItem, Schedule, Reservation, WeatherReport, NotificationItem, SOSReport, AuditLog } from './src/types';

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

  // Auth & Users
  app.get('/api/users', (_req, res) => {
    res.json(users);
  });

  app.post('/api/auth/login', (req, res) => {
    const { identifier, password, role } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Email, nomor HP, atau ID akun wajib diisi.' });
    }

    const cleanId = identifier.trim().toLowerCase();
    // Search by email, phone, name, or nip
    let matchedUser = users.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        u.phone.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, '') ||
        u.name.toLowerCase().includes(cleanId) ||
        (u.nipOrLicense && u.nipOrLicense.toLowerCase().includes(cleanId))
    );

    // If not found by direct identifier but role is specified and user requested demo login
    if (!matchedUser && role) {
      matchedUser = users.find((u) => u.role === role);
    }

    if (!matchedUser) {
      // Create guest/passenger user on the fly if non-existent or return 401
      if (cleanId.includes('@') || cleanId.length >= 8) {
        matchedUser = {
          id: `usr_${Date.now()}`,
          name: identifier.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          email: cleanId.includes('@') ? cleanId : `${cleanId}@kapalku.id`,
          phone: cleanId.match(/^[0-9+]/) ? cleanId : '0812-0000-0000',
          role: role || 'passenger',
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanId}`,
        };
        users.push(matchedUser);
      } else {
        return res.status(401).json({ error: 'Akun tidak ditemukan. Periksa kembali email atau nomor HP Anda.' });
      }
    }

    addAuditLog(matchedUser.name, matchedUser.role, 'USER_LOGIN', `Pengguna berhasil login via ${matchedUser.role}`);

    return res.json({
      user: matchedUser,
      token: `token_${matchedUser.id}_${Date.now()}`,
      message: `Selamat datang kembali, ${matchedUser.name}!`,
    });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, phone, role, agencyOrVessel, nipOrLicense } = req.body;

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
      role: (role as any) || 'passenger',
      agencyOrVessel: agencyOrVessel ? agencyOrVessel.trim() : undefined,
      nipOrLicense: nipOrLicense ? nipOrLicense.trim() : undefined,
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
