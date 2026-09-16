import React, { useState } from 'react';
import { Reservation, RouteItem, Schedule } from '../../types';
import {
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Users,
  Filter,
} from 'lucide-react';

interface ManifestReportProps {
  reservations: Reservation[];
  routes: RouteItem[];
  schedules: Schedule[];
  onRefreshData: () => void;
}

export const ManifestReport: React.FC<ManifestReportProps> = ({
  reservations,
  routes,
  schedules,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  const filteredReservations = reservations.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchQ =
      r.bookingCode.toLowerCase().includes(q) ||
      r.userName.toLowerCase().includes(q) ||
      r.vesselName.toLowerCase().includes(q) ||
      r.originDockName.toLowerCase().includes(q) ||
      r.destinationDockName.toLowerCase().includes(q);

    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'LUNAS' && r.paymentStatus === 'Lunas') ||
      (statusFilter === 'BOARDED' && r.checkInStatus === 'Sudah Check-In (Boarded)') ||
      (statusFilter === 'BATAL' && r.reservationStatus === 'Dibatalkan');

    const matchDate = !dateFilter || r.travelDate === dateFilter;

    return matchQ && matchStatus && matchDate;
  });

  const exportCSV = () => {
    const headers = [
      'Kode Booking',
      'Nama Penumpang',
      'Kapal',
      'Dermaga Asal',
      'Dermaga Tujuan',
      'Tanggal',
      'Jam',
      'Jumlah Org',
      'Motor',
      'Mobil',
      'Total Harga (Rp)',
      'Status Bayar',
      'Status Boarding',
      'Petugas Scanner',
    ];

    const rows = filteredReservations.map((r) => [
      r.bookingCode,
      `"${r.userName}"`,
      `"${r.vesselName}"`,
      `"${r.originDockName}"`,
      `"${r.destinationDockName}"`,
      r.travelDate,
      r.departureTime,
      r.passengersCount,
      r.motorbikesCount || 0,
      r.carsCount || 0,
      r.totalPrice,
      r.paymentStatus,
      r.checkInStatus,
      `"${r.scannedBy || '-'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Manifes_Pelayaran_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Action and Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode tiket, nama, kapal..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:bg-white outline-none font-medium"
          >
            <option value="ALL">Semua Status</option>
            <option value="LUNAS">Sudah Lunas</option>
            <option value="BOARDED">Sudah Naik (Boarded)</option>
            <option value="BATAL">Dibatalkan</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 focus:bg-white outline-none"
          />
        </div>

        <button
          onClick={exportCSV}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV / Excel</span>
        </button>
      </div>

      {/* Table Report */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3 px-4">Kode Tiket</th>
                <th className="py-3 px-4">Nama Penumpang</th>
                <th className="py-3 px-4">Kapal & Jalur</th>
                <th className="py-3 px-4">Jadwal</th>
                <th className="py-3 px-4">Muatan</th>
                <th className="py-3 px-4">Total Tarif</th>
                <th className="py-3 px-4">Status Bayar</th>
                <th className="py-3 px-4">Status Boarding</th>
                <th className="py-3 px-4">Petugas Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data manifes yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                      {res.bookingCode}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{res.userName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{res.userPhone}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{res.vesselName}</div>
                      <div className="text-[10px] text-slate-500">
                        {res.originDockName} ➔ {res.destinationDockName}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{res.departureTime}</div>
                      <div className="text-[10px] text-slate-500">{res.travelDate}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800">{res.passengersCount} Org</span>
                      {(res.motorbikesCount || 0) > 0 && (
                        <span className="text-[10px] text-slate-500 block">+{res.motorbikesCount} Motor</span>
                      )}
                      {(res.carsCount || 0) > 0 && (
                        <span className="text-[10px] text-slate-500 block">+{res.carsCount} Mobil</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                      Rp {res.totalPrice.toLocaleString('id-ID')}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          res.paymentStatus === 'Lunas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : res.paymentStatus === 'Dibatalkan'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {res.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          res.checkInStatus === 'Sudah Check-In (Boarded)'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {res.checkInStatus}
                      </span>
                      {res.checkInTime && (
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {res.checkInTime}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-slate-600">
                      {res.scannedBy || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
