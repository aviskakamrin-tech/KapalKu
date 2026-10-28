import React, { useState } from 'react';
import { User, Reservation } from '../../types';
import {
  Users,
  Search,
  ShieldCheck,
  Lock,
  Eye,
  Mail,
  Phone,
  Ticket,
  Calendar,
  X,
  CheckCircle2,
  Clock,
  Filter,
  CreditCard,
  Ship,
  AlertCircle,
} from 'lucide-react';

interface UserManagerProps {
  users: User[];
  reservations: Reservation[];
  onRefreshData: () => void;
}

export const UserManager: React.FC<UserManagerProps> = ({
  users,
  reservations,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'passenger' | 'officer' | 'admin'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phone && u.phone.includes(searchQuery));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate ticket reservations for a user
  const getUserReservations = (user: User) => {
    return reservations.filter(
      (r) =>
        r.userId === user.id ||
        (user.email && r.userEmail && r.userEmail.toLowerCase() === user.email.toLowerCase()) ||
        (user.phone && r.userPhone && r.userPhone.replace(/[^0-9]/g, '') === user.phone.replace(/[^0-9]/g, '')) ||
        r.userName.toLowerCase() === user.name.toLowerCase()
    );
  };

  const passengerCount = users.filter((u) => u.role === 'passenger').length;
  const officerCount = users.filter((u) => u.role === 'officer').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 bg-sky-50 border border-sky-200 rounded-full text-sky-800 text-xs font-bold">
            <Users className="w-3.5 h-3.5 text-sky-600" />
            <span>Direktori Akun Pengguna</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Daftar Akun Pengguna & Penumpang
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Pantau seluruh data akun pengguna yang terdaftar pada sistem tiket KapalKu. Demi keamanan privasi, hak ubah profil hanya dimiliki oleh pengguna bersangkutan.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl text-xs">
          <Lock className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="leading-tight">
            <span className="font-bold block">Mode Hanya Lihat (Read-Only)</span>
            <span className="text-[11px] text-amber-800">Admin hanya berhak melihat, tidak dapat mengubah akun pengguna.</span>
          </div>
        </div>
      </div>

      {/* Kebijakan Privasi & Aturan Hak Akses */}
      <div className="p-4 bg-gradient-to-r from-sky-50 via-indigo-50/50 to-slate-50 border border-sky-200/80 rounded-2xl flex items-start space-x-3 text-xs text-slate-700 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
            Kebijakan Keamanan: Pengelolaan Akun Pengguna Bersifat Mandiri
          </span>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Sesuai aturan keamanan data, akun pengguna (penumpang) <strong>hanya dapat diubah dan diatur secara mandiri oleh masing-masing pemilik akun</strong> melalui menu <em>Pengaturan Akun</em> pada akun mereka. Administrator pelabuhan hanya memiliki izin untuk <strong>melihat data akun</strong> guna keperluan verifikasi manifes pelayaran, pengecekan kontak darurat, dan audit pembatalan/refund.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Pengguna</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900">{users.length}</div>
          <span className="text-[11px] text-slate-500 font-medium">Terdaftar di sistem</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] text-sky-600 font-bold uppercase tracking-wider block">Akun Penumpang</span>
          <div className="text-xl sm:text-2xl font-black text-sky-700">{passengerCount}</div>
          <span className="text-[11px] text-sky-600 font-medium">Pengguna layanan tiket</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] text-cyan-600 font-bold uppercase tracking-wider block">Petugas Gate</span>
          <div className="text-xl sm:text-2xl font-black text-cyan-700">{officerCount}</div>
          <span className="text-[11px] text-cyan-600 font-medium">Validasi barcode gate</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">Administrator</span>
          <div className="text-xl sm:text-2xl font-black text-indigo-700">{adminCount}</div>
          <span className="text-[11px] text-indigo-600 font-medium">Pengelola operasional</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, email, atau no HP..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          {[
            { id: 'all', label: `Semua (${users.length})` },
            { id: 'passenger', label: `Penumpang (${passengerCount})` },
            { id: 'officer', label: `Petugas (${officerCount})` },
            { id: 'admin', label: `Admin (${adminCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                roleFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Users */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Pengguna & Akun</th>
                <th className="py-3.5 px-4">Role / Hak Akses</th>
                <th className="py-3.5 px-4">Kontak (Email / HP)</th>
                <th className="py-3.5 px-4 text-center">Riwayat Tiket</th>
                <th className="py-3.5 px-4 text-center">Status Akun</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Opsi Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span>Tidak ada data akun pengguna yang cocok dengan pencarian.</span>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const userRes = getUserReservations(user);
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center space-x-3">
                          <img
                            src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
                            alt={user.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs sm:text-sm">{user.name}</div>
                            <div className="font-mono text-[10px] text-slate-400">ID: {user.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {user.role === 'admin' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            🛡️ Administrator
                          </span>
                        ) : user.role === 'officer' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-100 text-cyan-800 border border-cyan-200">
                            🔍 Petugas Gate
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
                            👥 Penumpang / Pengguna
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center space-x-1.5 text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px] sm:max-w-[200px]">{user.email || '-'}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-slate-600 font-mono text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{user.phone || '-'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-mono">
                          {userRes.length} Tiket
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                          Aktif
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl font-bold text-xs flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                            title="Lihat Detail Akun (Mode Hanya Lihat)"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-600" />
                            <span>Lihat Detail</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Akun Pengguna (Hanya Lihat) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#0F2C59] p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-sky-400" />
                <span className="font-extrabold text-sm sm:text-base">Detail Akun Pengguna</span>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Notice Hanya Lihat */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center space-x-2.5 text-xs text-amber-900">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-[11px] leading-tight">
                  <strong>Akses Terbatas:</strong> Akun ini hanya dapat diubah & diatur oleh pengguna sendiri. Anda sedang melihat dalam mode <em>Read-Only</em>.
                </span>
              </div>

              {/* Profile Card */}
              <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <img
                  src={selectedUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedUser.name}`}
                  alt={selectedUser.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md shrink-0"
                />
                <div className="space-y-1">
                  <h3 className="font-black text-slate-900 text-base">{selectedUser.name}</h3>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800">
                    {selectedUser.role === 'admin'
                      ? '🛡️ Administrator Pelabuhan'
                      : selectedUser.role === 'officer'
                      ? '🔍 Petugas Scanner Gate'
                      : '👥 Penumpang / Pengguna'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">ID Pengguna: {selectedUser.id}</div>
                </div>
              </div>

              {/* Data Detail Fields (Disabled / Read-Only) */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Nama Lengkap Terdaftar</label>
                  <input
                    type="text"
                    value={selectedUser.name}
                    disabled
                    readOnly
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Alamat Email</label>
                    <input
                      type="text"
                      value={selectedUser.email || '-'}
                      disabled
                      readOnly
                      className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Nomor Handphone / WhatsApp</label>
                    <input
                      type="text"
                      value={selectedUser.phone || '-'}
                      disabled
                      readOnly
                      className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Status Keamanan Sandi Akun</label>
                  <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-slate-700">
                    <span className="font-mono text-xs">•••••••••••••• (Terenkripsi)</span>
                    <span className="text-[10px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      Hanya Pengguna yang Dapat Mengganti
                    </span>
                  </div>
                </div>
              </div>

              {/* Riwayat Reservasi Tiket Pengguna */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center space-x-1.5">
                    <Ticket className="w-4 h-4 text-sky-600" />
                    <span>Riwayat Tiket ({getUserReservations(selectedUser).length})</span>
                  </span>
                </div>

                {getUserReservations(selectedUser).length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                    Pengguna ini belum pernah melakukan pemesanan tiket.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {getUserReservations(selectedUser).map((res) => (
                      <div
                        key={res.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-mono font-bold text-sky-700">{res.bookingCode}</div>
                          <div className="font-semibold text-slate-800">{res.vesselName}</div>
                          <div className="text-[11px] text-slate-500">
                            {res.originDockName} ➔ {res.destinationDockName} • {res.travelDate}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="font-bold text-slate-900 block">
                            Rp {res.totalPrice?.toLocaleString('id-ID')}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                              res.reservationStatus === 'Dibatalkan'
                                ? 'bg-red-100 text-red-800'
                                : res.paymentStatus === 'Lunas'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {res.reservationStatus === 'Dibatalkan'
                              ? 'Dibatalkan'
                              : res.paymentStatus === 'Lunas'
                              ? 'Lunas'
                              : 'Menunggu Bayar'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Admin hanya berwenang untuk memeriksa data manifes.
              </span>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
