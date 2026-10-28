# 🚀 Panduan Deploy 3 Vite App Peran (Admin, Petugas, Penumpang) ke Cloudflare Pages

Panduan lengkap ini menjelaskan cara mendeploy **KapalKu** menjadi **3 aplikasi web mandiri** di Cloudflare Pages dari **satu repository Git yang sama**, dengan basis data terpadu di **Supabase**.

---

## 🏛️ 1. Arsitektur Multi-Role Cloudflare Pages

```
                   ┌──────────────────────────────────────┐
                   │    1 Git Repository (GitHub/GitLab)  │
                   └──────────────────┬───────────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │                            │                            │
         ▼                            ▼                            ▼
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│ Cloudflare Pages │         │ Cloudflare Pages │         │ Cloudflare Pages │
│  "kapalku-admin" │         │ "kapalku-petugas"│         │"kapalku-penumpang│
│ (Portal Admin)   │         │ (Portal Petugas) │         │ (Portal Tiket)   │
└────────┬─────────┘         └────────┬─────────┘         └────────┬─────────┘
         │                            │                            │
         │  Build:                    │  Build:                    │  Build:
         │  npm run build:admin       │  npm run build:officer     │  npm run build:passenger
         │                            │                            │
         │  Domain Contoh:            │  Domain Contoh:            │  Domain Contoh:
         │  admin.kapalku.id          │  petugas.kapalku.id        │  tiket.kapalku.id
         │                            │                            │
         └────────────────────────────┼────────────────────────────┘
                                      │
                                      ▼
                   ┌──────────────────────────────────────┐
                   │  Supabase PostgreSQL Cloud Database  │
                   │ (Data Jadwal, Rute, Manifes, Tiket)  │
                   └──────────────────────────────────────┘
```

---

## 📋 2. Ringkasan Konfigurasi Masing-masing Proyek

| Item | Proyek 1: Admin | Proyek 2: Petugas | Proyek 3: Penumpang |
|---|---|---|---|
| **Nama Proyek Cloudflare** | `kapalku-admin` | `kapalku-petugas` | `kapalku-penumpang` |
| **Fokus & Fitur** | Kelola tarif, rute pelayaran, jadwal, dermaga, armada kapal & audit log | Pemindai barcode tiket kamera QR di pintu dermaga, verifikasi boarding & manifest | Pemesanan tiket kapal online, radar AIS peta kapal, informasi jadwal & cuaca BMKG |
| **Framework Preset** | `Vite` | `Vite` | `Vite` |
| **Build Command** | `npm run build:admin` | `npm run build:officer` | `npm run build:passenger` |
| **Build Output Directory** | `dist` | `dist` | `dist` |
| **Environment Variable `VITE_APP_ROLE`** | `admin` | `officer` | `passenger` |
| **Environment Variable `VITE_SUPABASE_URL`** | `https://gkklzgdxpqfxskuvsdpu.supabase.co` | `https://gkklzgdxpqfxskuvsdpu.supabase.co` | `https://gkklzgdxpqfxskuvsdpu.supabase.co` |
| **Environment Variable `VITE_SUPABASE_ANON_KEY`** | *Anon key Supabase Anda* | *Anon key Supabase Anda* | *Anon key Supabase Anda* |
| **Domain Default Cloudflare** | `https://kapalku-admin.pages.dev` | `https://kapalku-petugas.pages.dev` | `https://kapalku-penumpang.pages.dev` |
| **Rekomendasi Custom Domain** | `admin.domainanda.com` | `petugas.domainanda.com` | `tiket.domainanda.com` (atau domain utama) |

---

## 🛠️ 3. Metode 1: Deploy Lewat Dashboard Cloudflare Pages (Paling Mudah)

Metode ini paling direkomendasikan karena Cloudflare akan **otomatis melakukan build dan deploy setiap kali Anda melakukan push ke GitHub**.

### Langkah 1: Siapkan Repository di GitHub
1. Pastikan kode sumber aplikasi ini telah di-push ke repository GitHub Anda (misal `github.com/username/kapalku`).

### Langkah 2: Deploy Aplikasi 1 - Admin (`kapalku-admin`)
1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/) dan login ke akun Anda.
2. Di menu samping kiri, klik **Workers & Pages**.
3. Klik tombol **Create application** ➔ Pilih tab **Pages** ➔ Klik **Connect to Git**.
4. Pilih akun GitHub Anda dan pilih repository `kapalku`.
5. Pada halaman **Set up builds and deployments**, atur parameter berikut:
   - **Project name**: `kapalku-admin`
   - **Production branch**: `main` (atau `master`)
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build:admin`
   - **Build output directory**: `dist`
   - **Root directory**: *(biarkan kosong / default)*
6. Klik bagian **Environment variables (advanced)** dan tambahkan 3 baris variabel:
   - `VITE_APP_ROLE` = `admin`
   - `VITE_SUPABASE_URL` = `https://gkklzgdxpqfxskuvsdpu.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` *(kunci anon Supabase)*
7. Klik tombol **Save and Deploy**.
8. Tunggu proses build selama 30–60 detik hingga selesai. URL `https://kapalku-admin.pages.dev` Anda kini aktif!

---

### Langkah 3: Deploy Aplikasi 2 - Petugas Gate & Scanner (`kapalku-petugas`)
1. Di halaman **Workers & Pages**, klik kembali **Create application** ➔ **Pages** ➔ **Connect to Git**.
2. Pilih repository `kapalku` yang **sama**.
3. Atur konfigurasi build untuk Petugas:
   - **Project name**: `kapalku-petugas`
   - **Build command**: `npm run build:officer`
   - **Build output directory**: `dist`
4. Tambahkan **Environment variables**:
   - `VITE_APP_ROLE` = `officer`
   - `VITE_SUPABASE_URL` = `https://gkklzgdxpqfxskuvsdpu.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = *(kunci anon Supabase)*
5. Klik **Save and Deploy**. URL `https://kapalku-petugas.pages.dev` aktif!

---

### Langkah 4: Deploy Aplikasi 3 - Penumpang & Tiket Online (`kapalku-penumpang`)
1. Sekali lagi, klik **Create application** ➔ **Pages** ➔ **Connect to Git**.
2. Pilih repository `kapalku` yang **sama**.
3. Atur konfigurasi build untuk Penumpang:
   - **Project name**: `kapalku-penumpang`
   - **Build command**: `npm run build:passenger`
   - **Build output directory**: `dist`
4. Tambahkan **Environment variables**:
   - `VITE_APP_ROLE` = `passenger`
   - `VITE_SUPABASE_URL` = `https://gkklzgdxpqfxskuvsdpu.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = *(kunci anon Supabase)*
5. Klik **Save and Deploy**. URL `https://kapalku-penumpang.pages.dev` aktif!

---

### 📂 Opsi Tambahan: Deploy Berdasarkan Subfolder Mandiri (`apps/*`)
Jika Anda lebih suka mengatur Cloudflare Pages dengan memilih folder proyek spesifik:
- **Proyek Admin**:
  - **Root directory**: `apps/admin`
  - **Build command**: `npm run build`
  - **Build output directory**: `dist`
- **Proyek Petugas**:
  - **Root directory**: `apps/petugas`
  - **Build command**: `npm run build`
  - **Build output directory**: `dist`
- **Proyek Penumpang**:
  - **Root directory**: `apps/pengguna`
  - **Build command**: `npm run build`
  - **Build output directory**: `dist`

Kedua metode (Root build `--mode` maupun subfolder `apps/*`) didukung penuh dan terhubung ke database Supabase yang sama!

---

## ⚡ 4. Metode 2: Deploy Cepat via Terminal / Wrangler CLI

Jika Anda ingin deploy langsung dari laptop/komputer tanpa menunggu Git push, gunakan script yang telah kami siapkan di `package.json`:

### 1. Login ke Cloudflare via Terminal
```bash
npx wrangler login
```

### 2. Deploy Aplikasi Masing-masing Role
```bash
# 1. Deploy Aplikasi Admin
npm run deploy:admin

# 2. Deploy Aplikasi Petugas
npm run deploy:officer

# 3. Deploy Aplikasi Penumpang
npm run deploy:passenger
```

Script di atas otomatis menjalankan `vite build --mode <role>` lalu mengunggah folder `dist` langsung ke project Cloudflare Pages yang sesuai.

---

## 🤖 5. Metode 3: CI/CD Otomatis dengan GitHub Actions

File workflow telah dibuat di `.github/workflows/deploy-cloudflare.yml`. Setiap kali Anda melakukan git commit dan push ke branch `main`, GitHub Actions akan otomatis mem-build dan mendeploy ketiga proyek sekaligus.

Cukup tambahkan 3 secrets di repository GitHub Anda (**Settings ➔ Secrets and variables ➔ Actions**):
1. `CLOUDFLARE_API_TOKEN`: Buat token di Cloudflare Dashboard (Profil ➔ API Tokens ➔ Create Token ➔ Edit Cloudflare Workers template).
2. `CLOUDFLARE_ACCOUNT_ID`: Account ID Cloudflare Anda (tertera di URL dashboard atau halaman Workers).
3. `VITE_SUPABASE_ANON_KEY`: Kunci anonim dari Supabase.
4. `VITE_SUPABASE_URL`: URL project Supabase Anda.

---

## 🌐 6. Mengatur Custom Subdomain Resmi

Agar alamat website terlihat profesional dan terpercaya bagi masyarakat dan staf pelabuhan, pasang custom domain di Cloudflare Pages:

1. Buka project di Cloudflare Pages (contoh: `kapalku-admin`).
2. Masuk ke tab **Custom domains**.
3. Klik **Set up a custom domain**.
4. Masukkan nama subdomain:
   - Untuk Admin: `admin.kapalku.id`
   - Untuk Petugas: `petugas.kapalku.id`
   - Untuk Penumpang: `tiket.kapalku.id` atau `kapalku.id`
5. Cloudflare akan otomatis mengonfigurasi DNS record CNAME dan menerbitkan sertifikat SSL/TLS gratis (HTTPS).

---

## ⚙️ 7. File Pendukung yang Sudah Dikonfigurasi Otomatis

Proyek ini telah dilengkapi dengan seluruh file pendukung yang dibutuhkan oleh Cloudflare Pages:

1. **`public/_redirects`**:
   ```
   /*    /index.html   200
   ```
   *Memastikan SPA routing Vite tidak menghasilkan error 404 saat pengguna me-refresh halaman atau membuka rute seperti `/admin` atau `/petugas`.*

2. **`public/_headers`**:
   *Header keamanan untuk mencegah clickjacking dan MIME-sniffing.*

3. **File Environment Terpisah**:
   - `.env.admin` (`VITE_APP_ROLE=admin`)
   - `.env.officer` (`VITE_APP_ROLE=officer`)
   - `.env.passenger` (`VITE_APP_ROLE=passenger`)

4. **Testing Lokal Cepat**:
   Anda bisa menjalankan server lokal untuk masing-masing role secara spesifik:
   ```bash
   # Jalankan server lokal khusus mode Admin
   npm run dev:admin

   # Jalankan server lokal khusus mode Petugas
   npm run dev:officer

   # Jalankan server lokal khusus mode Penumpang
   npm run dev:passenger
   ```

---

## ✅ 8. Uji Hasil Deploy

Setelah deploy selesai:
1. **Buka Portal Admin**: Tampilan akan terkunci pada menu manajemen tarif, rute dermaga, armada kapal, dan monitoring jadwal.
2. **Buka Portal Petugas**: Tampilan dirancang khusus scanner kamera QR code untuk validasi cepat tiket di pintu dermaga, ramah layar HP/tablet.
3. **Buka Portal Penumpang**: Tampilan publik untuk masyarakat memesan tiket, melihat live GPS kapal, jadwal pelayaran, dan status cuaca laut.
4. **Data Realtime**: Ketika Admin mengubah harga atau rute di Portal Admin, perubahan tersebut langsung terbaca di Portal Penumpang dan Portal Petugas melalui Supabase!
