import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  SlidersHorizontal,
  ScanLine,
  User as UserIcon,
  Globe,
  Share2,
  Info,
  Laptop,
  Smartphone,
  CheckCircle2,
  Cloud,
  Terminal,
  Layers,
} from 'lucide-react';
import { Role } from '../../types';

interface RoleLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToRole?: (role: Role) => void;
  activeRole?: string;
}

export const RoleLinksModal: React.FC<RoleLinksModalProps> = ({
  isOpen,
  onClose,
  onNavigateToRole,
  activeRole,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'links' | 'cloudflare'>('links');

  if (!isOpen) return null;

  // Resolve current base origin safely
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${window.location.pathname.replace(/\/admin|\/petugas|\/officer|\/pengguna|\/penumpang/, '')}`;
    }
    return '';
  };

  const baseUrl = getBaseUrl();

  const rolePortals = [
    {
      key: 'admin',
      role: 'admin' as Role,
      title: 'Portal Khusus Administrator',
      subtitle: 'Tarif, Rute, Jadwal & Manajemen Sistem',
      path: '/admin',
      queryParam: '?role=admin',
      color: 'indigo',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      borderColor: 'border-indigo-200 hover:border-indigo-400',
      headerBg: 'bg-gradient-to-r from-indigo-900 to-slate-900 text-white',
      icon: SlidersHorizontal,
      deviceIcon: Laptop,
      targetUser: 'Staf Operasional Pelabuhan, Manajer Tarif & Supervisor',
      features: [
        'Kelola tarif tiket penumpang & kendaraan',
        'Tambah & perbarui rute pelayaran antar pulau',
        'Atur jadwal keberangkatan & status kapal',
        'Rekapitulasi manifes tiket & audit operasional',
      ],
      sampleLogin: 'admin@kapalku.id / password123',
    },
    {
      key: 'officer',
      role: 'officer' as Role,
      title: 'Portal Petugas Gate & Dermaga',
      subtitle: 'Scanner Tiket, Validasi Manifes & Boarding',
      path: '/petugas',
      queryParam: '?role=officer',
      color: 'cyan',
      badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      borderColor: 'border-cyan-200 hover:border-cyan-400',
      headerBg: 'bg-gradient-to-r from-cyan-900 to-slate-900 text-white',
      icon: ScanLine,
      deviceIcon: Smartphone,
      targetUser: 'Petugas Pintu Masuk Dermaga, Checker Boarding & Lapangan',
      features: [
        'Pemindai kamera QR / Barcode tiket realtime',
        'Validasi keaslian e-ticket & cek status boarding',
        'Cek status kuota penumpang kapal sebelum berangkat',
        'Tampilan ramah layar sentuh HP / Tablet lapangan',
      ],
      sampleLogin: 'petugas@kapalku.id / password123',
    },
    {
      key: 'passenger',
      role: 'passenger' as Role,
      title: 'Portal Pengguna / Penumpang',
      subtitle: 'Pemesanan Tiket Online & Radar Pelayaran',
      path: '/pengguna',
      queryParam: '?role=passenger',
      color: 'sky',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
      borderColor: 'border-sky-200 hover:border-sky-400',
      headerBg: 'bg-gradient-to-r from-sky-900 to-slate-900 text-white',
      icon: UserIcon,
      deviceIcon: Globe,
      targetUser: 'Masyarakat Umum, Wisatawan & Penumpang Kapal',
      features: [
        'Cari jadwal keberangkatan kapal antar pelabuhan',
        'Pemesanan tiket online resmi & cetak e-ticket QR',
        'Live tracking radar posisi kapal (AIS)',
        'Informasi prakiraan cuaca & gelombang laut BMKG',
      ],
      sampleLogin: 'penumpang@kapalku.id / password123 (atau daftar akun)',
    },
  ];

  const handleCopy = (key: string, url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

  const handleOpenPortal = (portalRole: Role, path: string) => {
    if (onNavigateToRole) {
      onNavigateToRole(portalRole);
      onClose();
    } else {
      window.location.href = `${baseUrl}${path}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#071E3D] via-[#0F2C59] to-[#1E3E62] text-white p-5 sm:p-6 flex items-start justify-between border-b border-sky-900">
          <div className="space-y-1.5 pr-4">
            <div className="inline-flex items-center space-x-2 bg-sky-500/20 border border-sky-400/30 px-2.5 py-1 rounded-full text-xs font-mono font-bold text-sky-300">
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span>LINK AKSES TERPISAH PER ROLE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Tautan Akses & Portal Khusus Masing-masing Role
            </h2>
            <p className="text-xs sm:text-sm text-sky-200/90 leading-relaxed max-w-2xl">
              Setiap peran memiliki tautan URL khusus yang mandiri untuk didistribusikan atau diakses langsung oleh staf, petugas dermaga, dan penumpang.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-colors cursor-pointer shrink-0"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Header Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100/90 px-4 sm:px-6 pt-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('links')}
            className={`flex items-center space-x-2 py-2 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'links'
                ? 'border-sky-600 text-sky-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-4 h-4 text-sky-600" />
            <span>Tautan & Portal 3 Role</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cloudflare')}
            className={`flex items-center space-x-2 py-2 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'cloudflare'
                ? 'border-amber-500 text-amber-800 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cloud className="w-4 h-4 text-amber-500" />
            <span>Cara Deploy 3 App di Cloudflare Pages</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
              Vite App
            </span>
          </button>
        </div>

        {/* Modal Body: 3 Separate Portals */}
        {activeTab === 'links' ? (
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/60 flex-1">
          {/* Top Deployment Info Banner */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 sm:p-4 text-xs text-blue-900 flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-blue-950">
                Informasi Integrasi & Deploy URL Peran:
              </div>
              <p className="text-blue-800/90 leading-relaxed">
                Anda dapat menyalin URL masing-masing role di bawah ini. Tautan ini mendukung rute URL langsung (misal <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono font-bold text-blue-900">/admin</code>, <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono font-bold text-blue-900">/petugas</code>, atau <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono font-bold text-blue-900">/pengguna</code>) maupun parameter <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono font-bold text-blue-900">?role=...</code> sehingga siap di-share atau dijadikan bookmark resmi.
              </p>
            </div>
          </div>

          {/* Cards for 3 Roles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rolePortals.map((portal) => {
              const Icon = portal.icon;
              const DeviceIcon = portal.deviceIcon;
              const fullPathUrl = `${baseUrl}${portal.path}`;
              const fullQueryUrl = `${baseUrl}${portal.queryParam}`;
              const universalUrl = `${baseUrl}/?role=${portal.role}&login=true#${portal.path}`;
              const isCurrent = activeRole === portal.role;
              const isCopied = copiedKey === portal.key;

              return (
                <div
                  key={portal.key}
                  className={`bg-white rounded-2xl border ${portal.borderColor} shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden relative ${
                    isCurrent ? 'ring-2 ring-sky-500' : ''
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute top-2 right-2 z-10 bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center space-x-1 shadow">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Sedang Aktif</span>
                    </div>
                  )}

                  {/* Card Header */}
                  <div className={`${portal.headerBg} p-4 space-y-2`}>
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-white/10 rounded-xl text-white">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                          {portal.key.toUpperCase()} PORTAL
                        </span>
                        <h3 className="font-extrabold text-base leading-snug">
                          {portal.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-[11px] opacity-85 leading-tight">
                      {portal.subtitle}
                    </p>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5 text-xs">
                    <div className="space-y-2.5">
                      {/* Target User */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Ditujukan Untuk:
                        </span>
                        <div className="flex items-center space-x-1.5 text-slate-700 font-semibold text-[11px]">
                          <DeviceIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{portal.targetUser}</span>
                        </div>
                      </div>

                      {/* Feature Bullet Points */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Fitur Utama:
                        </span>
                        <ul className="space-y-1 text-[11px] text-slate-600">
                          {portal.features.map((feat, i) => (
                            <li key={i} className="flex items-start space-x-1.5">
                              <span className="text-sky-500 font-bold">•</span>
                              <span className="leading-tight">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Sample Credential */}
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-[10px] text-slate-500 block font-semibold">Akun Uji / Contoh:</span>
                        <code className="text-[11px] font-mono font-bold text-slate-800 block truncate">
                          {portal.sampleLogin}
                        </code>
                      </div>
                    </div>

                    {/* Link Display & Copy Actions */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Link Akses Langsung (Anti Error):
                        </span>
                        <div className="p-2 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between font-mono text-[11px] text-slate-800 break-all select-all">
                          <span className="truncate">{universalUrl}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleCopy(portal.key, universalUrl)}
                          className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer border ${
                            isCopied
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                              : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:border-slate-400 shadow-sm'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Disalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span>Salin Link</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenPortal(portal.role, portal.path)}
                          className="py-2 px-2.5 bg-[#0F2C59] hover:bg-[#1E3E62] text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                        >
                          <span>Buka Portal</span>
                          <ExternalLink className="w-3.5 h-3.5 text-sky-300" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deployment / Hosting Recommendation */}
          <div className="bg-slate-100 rounded-2xl p-4 text-xs text-slate-600 space-y-2 border border-slate-200">
            <div className="flex items-center space-x-2 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Panduan Penerapan (Deployment) Mandiri Per Role:</span>
            </div>
            <p className="leading-relaxed text-[11px] text-slate-600">
              Untuk pemakaian operasional terpisah di lapangan:
              <br />
              1. <strong>Staf Pelabuhan / Kantor</strong>: Simpan bookmark ke rute <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono text-indigo-700 font-bold">/admin</code> untuk pengelolaan tiket, rute pelayaran, dan tarif.
              <br />
              2. <strong>Petugas Lapangan / Gate Dermaga</strong>: Buka rute <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono text-cyan-700 font-bold">/petugas</code> pada perangkat tablet atau smartphone scanner pintu dermaga.
              <br />
              3. <strong>Publik & Penumpang</strong>: Bagikan rute <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono text-sky-700 font-bold">/pengguna</code> di sosial media atau website resmi tiket kapal.
            </p>
          </div>
        </div>
        ) : (
          /* CLOUDFLARE PAGES 3 APPS DEPLOYMENT GUIDE */
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/60 flex-1 text-slate-800">
            {/* Intro banner */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
                <Cloud className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Arsitektur 1 Git Repository ➔ 3 Proyek Cloudflare Pages Terpisah</span>
              </div>
              <p className="text-xs text-amber-800/90 leading-relaxed">
                Anda dapat menghubungkan <strong>satu repository GitHub yang sama</strong> ke <strong>3 Proyek Cloudflare Pages yang berbeda</strong>. Setiap proyek akan otomatis menjalankan build sesuai role dan memiliki URL subdomain/custom domain sendiri secara mandiri.
              </p>
            </div>

            {/* 3 Cloudflare Projects Specs */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-sky-600" />
                <span>Konfigurasi 3 Proyek di Cloudflare Pages Dashboard:</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* 1. Admin Project */}
                <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <span className="font-bold text-xs text-indigo-900 flex items-center space-x-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                      <span>Proyek 1: Admin</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold">
                      ADMIN APP
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Project Name</span>
                      <span className="font-mono text-slate-800 font-semibold">kapalku-admin</span>
                      <span className="text-[10px] text-slate-500 block">(kapalku-admin.pages.dev)</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Build Command</span>
                      <code className="block bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px] select-all">
                        npm run build:admin
                      </code>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Build Output Directory</span>
                      <code className="block bg-slate-100 p-1 rounded font-mono text-[11px] text-slate-800">
                        dist
                      </code>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Environment Variables</span>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono text-[10px] space-y-1 text-slate-700">
                        <div>VITE_APP_ROLE = <strong className="text-indigo-600">admin</strong></div>
                        <div>VITE_SUPABASE_URL = ...</div>
                        <div>VITE_SUPABASE_ANON_KEY = ...</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Officer Project */}
                <div className="bg-white p-4 rounded-2xl border border-cyan-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-cyan-100 pb-2">
                    <span className="font-bold text-xs text-cyan-900 flex items-center space-x-1.5">
                      <ScanLine className="w-4 h-4 text-cyan-600" />
                      <span>Proyek 2: Petugas Gate</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded-md font-bold">
                      PETUGAS APP
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Project Name</span>
                      <span className="font-mono text-slate-800 font-semibold">kapalku-petugas</span>
                      <span className="text-[10px] text-slate-500 block">(kapalku-petugas.pages.dev)</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Build Command</span>
                      <code className="block bg-slate-900 text-cyan-300 p-2 rounded-lg font-mono text-[11px] select-all">
                        npm run build:officer
                      </code>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Build Output Directory</span>
                      <code className="block bg-slate-100 p-1 rounded font-mono text-[11px] text-slate-800">
                        dist
                      </code>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Environment Variables</span>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono text-[10px] space-y-1 text-slate-700">
                        <div>VITE_APP_ROLE = <strong className="text-cyan-600">officer</strong></div>
                        <div>VITE_SUPABASE_URL = ...</div>
                        <div>VITE_SUPABASE_ANON_KEY = ...</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Passenger Project */}
                <div className="bg-white p-4 rounded-2xl border border-sky-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                    <span className="font-bold text-xs text-sky-900 flex items-center space-x-1.5">
                      <UserIcon className="w-4 h-4 text-sky-600" />
                      <span>Proyek 3: Penumpang</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md font-bold">
                      PENUMPANG APP
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Project Name</span>
                      <span className="font-mono text-slate-800 font-semibold">kapalku-penumpang</span>
                      <span className="text-[10px] text-slate-500 block">(kapalku-penumpang.pages.dev)</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Build Command</span>
                      <code className="block bg-slate-900 text-sky-300 p-2 rounded-lg font-mono text-[11px] select-all">
                        npm run build:passenger
                      </code>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Build Output Directory</span>
                      <code className="block bg-slate-100 p-1 rounded font-mono text-[11px] text-slate-800">
                        dist
                      </code>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Environment Variables</span>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono text-[10px] space-y-1 text-slate-700">
                        <div>VITE_APP_ROLE = <strong className="text-sky-600">passenger</strong></div>
                        <div>VITE_SUPABASE_URL = ...</div>
                        <div>VITE_SUPABASE_ANON_KEY = ...</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Langkah Detail Langkah demi Langkah */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Langkah demi Langkah Deploy di Cloudflare Pages:</span>
              </h4>

              <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-700 leading-relaxed">
                <li>
                  <strong>Buka Cloudflare Dashboard:</strong> Masuk ke <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-sky-700">Workers & Pages</code> ➔ Klik <strong>Create application</strong> ➔ Pilih tab <strong>Pages</strong> ➔ <strong>Connect to Git</strong>.
                </li>
                <li>
                  <strong>Pilih Repository:</strong> Pilih repository GitHub aplikasi KapalKu Anda.
                </li>
                <li>
                  <strong>Buat Proyek untuk Role yang Diinginkan:</strong>
                  <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-600">
                    <li>Isi <strong>Project Name</strong> (misal <code className="font-mono text-slate-800">kapalku-admin</code>).</li>
                    <li>Pilih <strong>Framework preset</strong>: <code className="font-mono text-indigo-700">Vite</code>.</li>
                    <li>Isi <strong>Build command</strong>: <code className="font-mono text-emerald-700 font-bold">npm run build:admin</code> (atau <code className="font-mono text-cyan-700 font-bold">npm run build:officer</code> / <code className="font-mono text-sky-700 font-bold">npm run build:passenger</code>).</li>
                    <li>Isi <strong>Build output directory</strong>: <code className="font-mono text-slate-800 font-bold">dist</code>.</li>
                  </ul>
                </li>
                <li>
                  <strong>Tambahkan Environment Variables di Cloudflare:</strong>
                  <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] my-1.5 space-y-1">
                    <div>VITE_SUPABASE_URL = https://gkklzgdxpqfxskuvsdpu.supabase.co</div>
                    <div>VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</div>
                    <div>VITE_APP_ROLE = admin (atau officer / passenger)</div>
                  </div>
                </li>
                <li>
                  <strong>Klik Save and Deploy:</strong> Cloudflare Pages akan mem-build applet dan menghasilkan URL live (contoh: <code className="text-sky-700 font-mono">https://kapalku-admin.pages.dev</code>).
                </li>
                <li>
                  <strong>Ulangi untuk 2 role lainnya:</strong> Lakukan langkah yang sama untuk membuat proyek Petugas dan Penumpang dari repo yang sama!
                </li>
              </ol>

              {/* Subfolder option highlight */}
              <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-1">
                <div className="font-bold text-amber-900 flex items-center space-x-1.5">
                  <span>📂 Opsi Tambahan: Deploy Berdasarkan Subfolder (apps/*)</span>
                </div>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Selain root build, kami juga telah membuat 3 folder aplikasi Vite mandiri di <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-900">apps/admin</code>, <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-900">apps/petugas</code>, dan <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-900">apps/pengguna</code>. Anda dapat mengatur <em>Root directory</em> di Cloudflare Pages langsung ke folder tersebut.
                </p>
              </div>
            </div>

            {/* CLI & Terminal Quick Commands */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Terminal className="w-4 h-4 text-purple-600" />
                  <span>Alternatif: Deploy Cepat via Terminal / Wrangler CLI</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">package.json scripts</span>
              </h4>
              <p className="text-xs text-slate-600">
                Anda juga dapat mendeploy langsung dari komputer / terminal menggunakan script yang telah disiapkan:
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-slate-900 text-slate-100 p-2.5 rounded-xl font-mono text-[11px]">
                  <span>npm run deploy:admin</span>
                  <button
                    onClick={() => handleCopy('deploy_admin', 'npm run deploy:admin')}
                    className="text-xs text-sky-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
                  >
                    {copiedKey === 'deploy_admin' ? 'Tersalin!' : 'Salin'}
                  </button>
                </div>
                <div className="flex items-center justify-between bg-slate-900 text-slate-100 p-2.5 rounded-xl font-mono text-[11px]">
                  <span>npm run deploy:officer</span>
                  <button
                    onClick={() => handleCopy('deploy_officer', 'npm run deploy:officer')}
                    className="text-xs text-cyan-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
                  >
                    {copiedKey === 'deploy_officer' ? 'Tersalin!' : 'Salin'}
                  </button>
                </div>
                <div className="flex items-center justify-between bg-slate-900 text-slate-100 p-2.5 rounded-xl font-mono text-[11px]">
                  <span>npm run deploy:passenger</span>
                  <button
                    onClick={() => handleCopy('deploy_passenger', 'npm run deploy:passenger')}
                    className="text-xs text-emerald-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
                  >
                    {copiedKey === 'deploy_passenger' ? 'Tersalin!' : 'Salin'}
                  </button>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                💡 Tersedia juga file otomatisasi CI/CD di <code className="font-mono text-slate-800 font-bold">.github/workflows/deploy-cloudflare.yml</code> dan panduan lengkap di <code className="font-mono text-slate-800 font-bold">PANDUAN_DEPLOY_CLOUDFLARE.md</code>.
              </div>
            </div>

            {/* Custom Domain Tips */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 text-xs">
              <div className="font-bold text-sky-400 flex items-center space-x-1.5">
                <Globe className="w-4 h-4" />
                <span>Tips Penggunaan Custom Domain Resmi (misal domain pribadi):</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Di Cloudflare Pages, buka tab <strong>Custom domains</strong> pada masing-masing proyek:
                <br />
                • Proyek Admin ➔ Pasang domain <code className="bg-white/10 px-1 py-0.5 rounded text-sky-200 font-mono">admin.kapalku.id</code>
                <br />
                • Proyek Petugas ➔ Pasang domain <code className="bg-white/10 px-1 py-0.5 rounded text-sky-200 font-mono">petugas.kapalku.id</code>
                <br />
                • Proyek Penumpang ➔ Pasang domain <code className="bg-white/10 px-1 py-0.5 rounded text-sky-200 font-mono">tiket.kapalku.id</code> (atau domain utama <code className="bg-white/10 px-1 py-0.5 rounded text-sky-200 font-mono">kapalku.id</code>)
                <br />
                Semua proyek terhubung ke database Supabase yang sama secara realtime!
              </p>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-medium">
            KapalKu Multi-Role Platform ID
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs cursor-pointer transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
