# ⚡ Panduan Lengkap Deploy Aplikasi KapalKu ke Vercel

Panduan ini menjelaskan langkah-langkah praktis dan mudah untuk mendeploy aplikasi **KapalKu Maritime Platform** ke **Vercel** dengan arsitektur modern (Vite SPA + Vercel Serverless Function + Supabase PostgreSQL).

---

## 🌟 Keuntungan Deploy di Vercel
1. **Performa Tinggi**: Global Edge Network & CDN berkecepatan tinggi dengan latensi super rendah di seluruh Indonesia & dunia.
2. **Otomatis & Realtime (CI/CD)**: Setiap kali Anda melakukan `git push` ke GitHub, Vercel langsung otomatis mem-build dan memperbarui aplikasi dalam ~30 detik.
3. **Bebas Error 404 (SPA Routing)**: File `vercel.json` sudah disiapkan dengan aturan *rewrite* sehingga rute URL peran seperti `/admin`, `/petugas`, `/tiket`, `/rute`, maupun *query parameter* `/?role=admin` dapat diakses langsung tanpa error "Page not found".
4. **Gratis & SSL Otomatis**: Mendapatkan domain gratis `https://nama-aplikasi.vercel.app` serta sertifikat HTTPS/SSL otomatis aktif.
5. **Dukungan Custom Domain**: Sangat mudah menghubungkan domain milik Anda sendiri (misal `kapalku.id`, `admin.kapalku.id`, `tiket.kapalku.id`).

---

## 📁 File Konfigurasi Vercel yang Sudah Disiapkan
Aplikasi ini sudah dilengkapi file-file resmi yang dibutuhkan Vercel:

1. **`vercel.json`**:
   - `framework`: `"vite"`
   - `buildCommand`: `"npm run vercel-build"`
   - `outputDirectory`: `"dist"`
   - `rewrites`: Otomatis mengarahkan semua rute halaman ke `/index.html` dan `/api/*` ke Serverless Function `/api/index.ts`.
   - `headers`: Cache Control optimal untuk file statis dan header proteksi keamanan browser (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`).
2. **`api/index.ts`**:
   - Vercel Serverless Function berbasis Express untuk melayani panggilan API seperti status armada, jadwal, dermaga, cuaca, notifikasi, dan sinkronisasi data ke Supabase.
3. **`package.json`**:
   - Skrip `"vercel-build": "vite build"` sudah terdaftar agar Vercel dapat mem-build aset frontend dengan sangat cepat.

---

## 🚀 Langkah-langkah Deploy ke Vercel (Panduan 1-Click)

### Langkah 1: Push Kode ke GitHub
1. Pastikan seluruh folder proyek ini sudah di-commit dan di-push ke akun GitHub Anda (misal: `github.com/username/kapalku`).

### Langkah 2: Hubungkan Repository ke Vercel
1. Buka [https://vercel.com](https://vercel.com) dan login menggunakan akun GitHub Anda.
2. Di dashboard Vercel, klik tombol **"Add New..."** ➔ pilih **"Project"**.
3. Cari repository GitHub Anda (`kapalku`) pada daftar, lalu klik tombol **"Import"**.

### Langkah 3: Konfigurasi Project Settings
Vercel akan mendeteksi `vercel.json` secara otomatis. Pastikan pengaturan berikut:
- **Framework Preset**: `Vite`
- **Root Directory**: `./` (default)
- **Build Command**: `npm run vercel-build` (atau biarkan default)
- **Output Directory**: `dist` (atau biarkan default)

### Langkah 4: Masukkan Environment Variables (Supabase)
Di bagian **Environment Variables** pada halaman setup Vercel, tambahkan variabel berikut:

| Nama Variabel | Nilai Contoh | Keterangan |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://[id-proyek-anda].supabase.co` | URL Proyek Supabase Anda |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` | Public Anon API Key Supabase |
| `SUPABASE_URL` | `https://[id-proyek-anda].supabase.co` | *(Opsional)* Untuk Serverless Function |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` | *(Opsional)* Untuk Serverless Function |

> **Tips**: Jika Anda belum memiliki akun Supabase sendiri, aplikasi sudah menyertakan data default bawaan dan pengaturan kredensial interaktif yang dapat diisi langsung dari dalam aplikasi kapan saja via tombol **Database Supabase**.

### Langkah 5: Klik Deploy!
1. Klik tombol **"Deploy"**.
2. Vercel akan menjalankan build dalam ~30-45 detik.
3. Setelah selesai, Anda akan melihat konfeti perayaan dan link aplikasi aktif, misalnya:
   `https://kapalku.vercel.app`

---

## 🌐 Opsi 1: Satu Aplikasi Terpadu (Universal Multi-Role)
Jika Anda hanya membuat 1 proyek di Vercel (`https://kapalku.vercel.app`), Anda bisa langsung membagikan link login terpisah untuk tiap peran:

* 🔐 **Login Admin**: `https://kapalku.vercel.app/?role=admin&login=true#/admin`
* 📱 **Login Petugas Gate**: `https://kapalku.vercel.app/?role=officer&login=true#/petugas`
* 🎟️ **Login Penumpang**: `https://kapalku.vercel.app/?role=passenger&login=true#/`

Format URL di atas menggunakan query & hash routing yang dijamin **100% bebas error 404** di Vercel maupun browser manapun.

---

## 🏛️ Opsi 2: Deploy Menjadi 3 Domain / Proyek Terpisah di Vercel
Jika Anda ingin memiliki 3 website mandiri (misal: `admin.kapalku.id`, `petugas.kapalku.id`, dan `tiket.kapalku.id`), Anda cukup mengimpor repository GitHub yang sama ke Vercel sebanyak 3 kali dengan pengaturan variabel `VITE_APP_ROLE`:

| Proyek di Vercel | Environment Variable `VITE_APP_ROLE` | Build Command | Hasil Domain |
|---|---|---|---|
| **kapalku-admin** | `admin` | `npm run build:admin` | `https://kapalku-admin.vercel.app` |
| **kapalku-petugas** | `officer` | `npm run build:officer` | `https://kapalku-petugas.vercel.app` |
| **kapalku-penumpang**| `passenger` | `npm run build:passenger` | `https://kapalku-penumpang.vercel.app` |

---

## 🏷️ Menghubungkan Custom Domain Sendiri di Vercel
1. Di Dashboard Vercel, buka proyek Anda.
2. Masuk ke menu **Settings** ➔ **Domains**.
3. Ketik nama domain Anda (misal `kapalku.id` atau `admin.kapalku.id`) lalu klik **Add**.
4. Vercel akan memberikan petunjuk DNS (CNAME atau A record). Masukkan nilai tersebut ke DNS Manager domain Anda (Cloudflare, Niagahoster, Domainesia, Namecheap, dsb.).
5. Dalam beberapa menit, domain kustom Anda langsung aktif dengan SSL gratis!

---

## ❓ FAQ & Troubleshooting Vercel

* **Q: Mengapa saat refresh halaman `/admin` tidak terjadi error 404?**
  * *Jawab*: Karena file `vercel.json` sudah menyertakan konfigurasi `rewrites` yang mengarahkan semua permintaan halaman kembali ke `/index.html`, sehingga router Vite React menangani rendering URL secara sempurna.
* **Q: Apakah data yang diinput oleh Admin tersimpan?**
  * *Jawab*: Ya! Data admin otomatis disinkronkan ke Supabase PostgreSQL database secara real-time.
