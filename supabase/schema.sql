-- ==============================================================================
-- SKEMA DATABASE KAPALKU - SUPABASE POSTGRESQL
-- Project URL: https://gkklzgdxpqfxskuvsdpu.supabase.co
-- Cara Pakai:
-- 1. Buka Supabase Dashboard > SQL Editor
--    https://supabase.com/dashboard/project/gkklzgdxpqfxskuvsdpu/sql/new
-- 2. Salin dan tempel (paste) seluruh isi file ini
-- 3. Klik tombol "RUN" (Jalankan)
-- ==============================================================================

-- 1. TABEL USERS (Pengguna, Petugas, Admin)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'officer', 'passenger')),
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABEL DOCKS (Dermaga & Pelabuhan)
CREATE TABLE IF NOT EXISTS public.docks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    lat NUMERIC(9,6) NOT NULL,
    lng NUMERIC(9,6) NOT NULL,
    status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Perbaikan', 'Non-Aktif')),
    province TEXT,
    city TEXT,
    region TEXT,
    dock_role TEXT DEFAULT 'both',
    facilities TEXT[],
    contact_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABEL ROUTES (Jalur Pelayaran & Tarif)
CREATE TABLE IF NOT EXISTS public.routes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    origin_dock_id TEXT REFERENCES public.docks(id) ON DELETE SET NULL,
    origin_dock_name TEXT NOT NULL,
    destination_dock_id TEXT REFERENCES public.docks(id) ON DELETE SET NULL,
    destination_dock_name TEXT NOT NULL,
    distance_km NUMERIC(8,2) DEFAULT 0,
    distance_miles NUMERIC(8,2),
    estimated_duration_minutes INTEGER DEFAULT 60,
    tariff_passenger NUMERIC(12,2) DEFAULT 0,
    tariff_child NUMERIC(12,2) DEFAULT 0,
    tariff_motorbike NUMERIC(12,2) DEFAULT 0,
    tariff_car NUMERIC(12,2) DEFAULT 0,
    tariff_truck NUMERIC(12,2) DEFAULT 0,
    status TEXT DEFAULT 'Operasional' CHECK (status IN ('Operasional', 'Ditutup', 'Waspada')),
    region TEXT,
    vessel_types_available TEXT[],
    description TEXT,
    frequency_text TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABEL VESSELS (Armada Kapal & Posisi GPS / AIS)
CREATE TABLE IF NOT EXISTS public.vessels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    registration_number TEXT,
    type TEXT NOT NULL CHECK (type IN ('Klotok', 'Speedboat', 'Feri', 'Kapal Perintis', 'Lainnya')),
    capacity_passengers INTEGER DEFAULT 50,
    capacity_motorbikes INTEGER DEFAULT 0,
    capacity_cars INTEGER DEFAULT 0,
    capacity_trucks INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Bertambat' CHECK (status IN ('Bertambat', 'Dalam Perjalanan', 'Delay', 'Batal')),
    operator_id TEXT,
    operator_name TEXT,
    operator_phone TEXT,
    speed_kts NUMERIC(6,2) DEFAULT 0,
    heading_deg NUMERIC(6,2) DEFAULT 0,
    current_lat NUMERIC(9,6) NOT NULL,
    current_lng NUMERIC(9,6) NOT NULL,
    last_updated TEXT,
    current_route_id TEXT,
    operating_routes_description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABEL SCHEDULES (Jadwal Keberangkatan)
CREATE TABLE IF NOT EXISTS public.schedules (
    id TEXT PRIMARY KEY,
    vessel_id TEXT REFERENCES public.vessels(id) ON DELETE SET NULL,
    vessel_name TEXT NOT NULL,
    vessel_type TEXT NOT NULL,
    route_id TEXT REFERENCES public.routes(id) ON DELETE SET NULL,
    origin_dock_name TEXT NOT NULL,
    destination_dock_name TEXT NOT NULL,
    date DATE NOT NULL,
    departure_time TEXT NOT NULL,
    estimated_arrival_time TEXT NOT NULL,
    tariff_passenger NUMERIC(12,2) DEFAULT 0,
    tariff_child NUMERIC(12,2) DEFAULT 0,
    tariff_motorbike NUMERIC(12,2) DEFAULT 0,
    tariff_car NUMERIC(12,2) DEFAULT 0,
    tariff_truck NUMERIC(12,2) DEFAULT 0,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'boarding', 'on_time', 'delayed', 'cancelled', 'completed')),
    status_reason TEXT,
    booked_passengers INTEGER DEFAULT 0,
    max_passengers INTEGER DEFAULT 100,
    booked_motorbikes INTEGER DEFAULT 0,
    booked_cars INTEGER DEFAULT 0,
    booked_trucks INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABEL RESERVATIONS (Pemesanan Tiket & Manifes)
CREATE TABLE IF NOT EXISTS public.reservations (
    id TEXT PRIMARY KEY,
    booking_code TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    user_email TEXT,
    schedule_id TEXT,
    vessel_name TEXT NOT NULL,
    vessel_type TEXT,
    origin_dock_name TEXT NOT NULL,
    destination_dock_name TEXT NOT NULL,
    travel_date TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    estimated_arrival_time TEXT,
    passengers_count INTEGER DEFAULT 1,
    motorbikes_count INTEGER DEFAULT 0,
    cars_count INTEGER DEFAULT 0,
    passengers_list JSONB,
    vehicle_plate TEXT,
    vehicle_type TEXT,
    base_price NUMERIC(12,2) DEFAULT 0,
    insurance_fee NUMERIC(12,2) DEFAULT 0,
    port_service_fee NUMERIC(12,2) DEFAULT 0,
    total_price NUMERIC(12,2) NOT NULL,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'Menunggu Pembayaran' CHECK (payment_status IN ('Lunas', 'Menunggu Pembayaran', 'Gagal', 'Dibatalkan')),
    reservation_status TEXT DEFAULT 'Terkonfirmasi' CHECK (reservation_status IN ('Terkonfirmasi', 'Menunggu Pembayaran', 'Dibatalkan', 'Selesai')),
    check_in_status TEXT DEFAULT 'Belum Check-In' CHECK (check_in_status IN ('Belum Check-In', 'Sudah Check-In (Boarded)')),
    check_in_time TEXT,
    scanned_by TEXT,
    scanned_at TEXT,
    gate_number TEXT,
    created_at TEXT NOT NULL,
    qr_code_url TEXT,
    cancellation_reason TEXT,
    cancelled_at TEXT,
    payment_details JSONB
);

-- 7. TABEL NOTIFICATIONS (Notifikasi Sistem)
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'all',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TEXT NOT NULL
);

-- 8. TABEL WEATHER (Informasi Cuaca & Gelombang Maritim)
CREATE TABLE IF NOT EXISTS public.weather (
    id TEXT PRIMARY KEY,
    route_name TEXT NOT NULL,
    origin_dock_name TEXT NOT NULL,
    destination_dock_name TEXT NOT NULL,
    condition TEXT NOT NULL,
    wave_height_meters NUMERIC(4,2) DEFAULT 0.5,
    wind_speed_kmh NUMERIC(6,2) DEFAULT 10,
    wind_direction TEXT DEFAULT 'Tenggara',
    status TEXT DEFAULT 'Aman' CHECK (status IN ('Aman', 'Waspada', 'Siaga', 'Berbahaya')),
    official_advice TEXT,
    updated_at TEXT
);

-- 9. TABEL SOS_REPORTS (Panggilan Darurat Laut)
CREATE TABLE IF NOT EXISTS public.sos_reports (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    vessel_name TEXT,
    lat NUMERIC(9,6) NOT NULL,
    lng NUMERIC(9,6) NOT NULL,
    time TEXT NOT NULL,
    emergency_type TEXT NOT NULL,
    description TEXT,
    booking_code TEXT,
    status TEXT DEFAULT 'Baru' CHECK (status IN ('Baru', 'Dalam Penanganan', 'Selesai')),
    created_at TEXT NOT NULL
);

-- 10. TABEL AUDIT_LOGS (Log Aktivitas & Audit Manifes)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TEXT NOT NULL
);

-- ==============================================================================
-- KEBIJAKAN ROW LEVEL SECURITY (RLS)
-- Mengizinkan akses publik/anonim untuk membaca dan menulis data
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vessels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- users
    DROP POLICY IF EXISTS "Public Access users" ON public.users;
    CREATE POLICY "Public Access users" ON public.users FOR ALL USING (true) WITH CHECK (true);

    -- docks
    DROP POLICY IF EXISTS "Public Access docks" ON public.docks;
    CREATE POLICY "Public Access docks" ON public.docks FOR ALL USING (true) WITH CHECK (true);

    -- routes
    DROP POLICY IF EXISTS "Public Access routes" ON public.routes;
    CREATE POLICY "Public Access routes" ON public.routes FOR ALL USING (true) WITH CHECK (true);

    -- vessels
    DROP POLICY IF EXISTS "Public Access vessels" ON public.vessels;
    CREATE POLICY "Public Access vessels" ON public.vessels FOR ALL USING (true) WITH CHECK (true);

    -- schedules
    DROP POLICY IF EXISTS "Public Access schedules" ON public.schedules;
    CREATE POLICY "Public Access schedules" ON public.schedules FOR ALL USING (true) WITH CHECK (true);

    -- reservations
    DROP POLICY IF EXISTS "Public Access reservations" ON public.reservations;
    CREATE POLICY "Public Access reservations" ON public.reservations FOR ALL USING (true) WITH CHECK (true);

    -- notifications
    DROP POLICY IF EXISTS "Public Access notifications" ON public.notifications;
    CREATE POLICY "Public Access notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

    -- weather
    DROP POLICY IF EXISTS "Public Access weather" ON public.weather;
    CREATE POLICY "Public Access weather" ON public.weather FOR ALL USING (true) WITH CHECK (true);

    -- sos_reports
    DROP POLICY IF EXISTS "Public Access sos_reports" ON public.sos_reports;
    CREATE POLICY "Public Access sos_reports" ON public.sos_reports FOR ALL USING (true) WITH CHECK (true);

    -- audit_logs
    DROP POLICY IF EXISTS "Public Access audit_logs" ON public.audit_logs;
    CREATE POLICY "Public Access audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
END $$;

-- ==============================================================================
-- DATA AWAL (SEED DATA)
-- Memasukkan akun default, dermaga, rute, dan armada kapal ke dalam Supabase
-- ==============================================================================

-- Akun Default
INSERT INTO public.users (id, name, email, phone, role, avatar) VALUES
('usr_admin_1', 'Bambang Sulistyo (Admin Tarif & Rute)', 'admin@kapalku.id', '0811-2233-4455', 'admin', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'),
('usr_officer_1', 'Bripka Hendra (Petugas Gate & Scanner)', 'petugas@kapalku.id', '0813-7788-9900', 'officer', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
('usr_pass_1', 'Ahmad Faisal', 'faisal@example.com', '0812-3456-7890', 'passenger', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
('usr_pass_2', 'Siti Nurhaliza', 'siti.nur@gmail.com', '0852-9876-1122', 'passenger', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

-- Dermaga Default
INSERT INTO public.docks (id, name, address, lat, lng, status, province, city, region, dock_role, contact_phone) VALUES
('dock_kasipute', 'Pelabuhan Ferry Kampung Baru (Kasipute)', 'Kelurahan Kampung Baru, Kec. Rumbia, Kabupaten Bombana, Sulawesi Tenggara', -4.6853, 122.0298, 'Aktif', 'Sulawesi Tenggara', 'Kabupaten Bombana', 'Sulawesi', 'both', '0852-4112-9901'),
('dock_pising', 'Pelabuhan Pising (Kabaena Utara, Bombana)', 'Desa Pising, Kec. Kabaena Utara, Kabupaten Bombana, Sulawesi Tenggara', -5.1683, 121.9560, 'Aktif', 'Sulawesi Tenggara', 'Kabupaten Bombana', 'Sulawesi', 'both', '0852-4112-9902'),
('dock_tondasi', 'Pelabuhan Tondasi (Muna Barat)', 'Desa Tondasi, Kec. Tiworo Utara, Kabupaten Muna Barat, Sulawesi Tenggara', -4.8462, 122.4285, 'Aktif', 'Sulawesi Tenggara', 'Kabupaten Muna Barat', 'Sulawesi', 'both', '0852-4112-9903'),
('dock_sikeli', 'Pelabuhan Sikeli (Kabaena Barat, Bombana)', 'Kelurahan Sikeli, Kec. Kabaena Barat, Kabupaten Bombana, Sulawesi Tenggara', -5.3262, 121.8485, 'Aktif', 'Sulawesi Tenggara', 'Kabupaten Bombana', 'Sulawesi', 'both', '0852-4112-9904')
ON CONFLICT (id) DO NOTHING;

-- Armada Kapal Default
INSERT INTO public.vessels (id, name, registration_number, type, capacity_passengers, capacity_motorbikes, capacity_cars, status, operator_name, operator_phone, speed_kts, heading_deg, current_lat, current_lng, last_updated) VALUES
('ves_bombana_1', 'KMP Kabaena Jaya Express', 'PK-BMB-01', 'Feri', 150, 40, 12, 'Dalam Perjalanan', 'PT ASDP Indonesia Ferry (Persero)', '0812-4411-8899', 12.4, 185, -4.9200, 121.9900, 'Baru saja'),
('ves_bombana_2', 'KM Rumbia Indah I', 'PK-BMB-02', 'Speedboat', 45, 0, 0, 'Bertambat', 'Koperasi Pelayaran Bombana Mandiri', '0852-4112-8822', 0, 0, -4.6853, 122.0298, 'Baru saja'),
('ves_bombana_3', 'KMP Sultan Murhum Ro-Ro', 'PK-BMB-03', 'Feri', 220, 60, 20, 'Dalam Perjalanan', 'Dinas Perhubungan Bombana / ASDP', '0813-5599-2211', 14.1, 140, -5.0200, 122.2100, 'Baru saja')
ON CONFLICT (id) DO NOTHING;
