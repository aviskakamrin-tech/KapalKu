import React, { useState } from 'react';
import { Reservation, User } from '../../types';
import { api } from '../../lib/api';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Building2,
  Wallet,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  Ship,
  Calendar,
  User as UserIcon,
  Phone,
  FileText,
  DollarSign,
  Filter,
  Check,
  X,
  CreditCard,
  Hash,
  Send,
  Eye,
} from 'lucide-react';

interface RefundApprovalManagerProps {
  reservations: Reservation[];
  currentUser: User | null;
  onRefreshData: () => void;
}

export const RefundApprovalManager: React.FC<RefundApprovalManagerProps> = ({
  reservations,
  currentUser,
  onRefreshData,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Action Modals State
  const [ticketToApprove, setTicketToApprove] = useState<Reservation | null>(null);
  const [ticketToReject, setTicketToReject] = useState<Reservation | null>(null);
  
  // Form input states
  const [transferProofRef, setTransferProofRef] = useState('');
  const [adminApprovalNote, setAdminApprovalNote] = useState('Refund dana tiket telah diverifikasi dan berhasil ditransfer ke rekening pemohon.');
  const [rejectionReason, setRejectionReason] = useState('Permintaan pembatalan tiket melewati batas waktu ketentuan operasional dermaga.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Filter reservations that have refundStatus or cancellation
  const refundTickets = reservations.filter(
    (r) => r.refundStatus === 'Diajukan' || r.refundStatus === 'Disetujui' || r.refundStatus === 'Ditolak'
  );

  const pendingRefunds = refundTickets.filter((r) => r.refundStatus === 'Diajukan');
  const approvedRefunds = refundTickets.filter((r) => r.refundStatus === 'Disetujui');
  const rejectedRefunds = refundTickets.filter((r) => r.refundStatus === 'Ditolak');

  const totalRefundAmountApproved = approvedRefunds.reduce(
    (sum, r) => sum + (r.refundDetails?.refundAmount || r.totalPrice || 0),
    0
  );

  const filteredTickets = refundTickets.filter((r) => {
    // Status filter
    if (filterStatus === 'pending' && r.refundStatus !== 'Diajukan') return false;
    if (filterStatus === 'approved' && r.refundStatus !== 'Disetujui') return false;
    if (filterStatus === 'rejected' && r.refundStatus !== 'Ditolak') return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = r.bookingCode.toLowerCase().includes(q);
      const matchName = r.userName.toLowerCase().includes(q);
      const matchPhone = (r.userPhone || '').toLowerCase().includes(q);
      const matchVessel = (r.vesselName || '').toLowerCase().includes(q);
      const matchBank = (r.refundDetails?.bankName || '').toLowerCase().includes(q);
      const matchHolder = (r.refundDetails?.accountHolder || '').toLowerCase().includes(q);
      return matchCode || matchName || matchPhone || matchVessel || matchBank || matchHolder;
    }

    return true;
  });

  const handleOpenApproveModal = (ticket: Reservation) => {
    setTicketToApprove(ticket);
    const autoRef = `TRF-${ticket.refundDetails?.bankName?.toUpperCase().replace(/\s+/g, '') || 'BANK'}-${Date.now().toString().slice(-6)}`;
    setTransferProofRef(autoRef);
    setAdminApprovalNote(`Refund dana senilai Rp ${(ticket.refundDetails?.refundAmount || ticket.totalPrice).toLocaleString('id-ID')} telah ditransfer ke ${ticket.refundDetails?.bankName} ${ticket.refundDetails?.accountNumber} a.n ${ticket.refundDetails?.accountHolder}.`);
  };

  const handleConfirmApprove = async () => {
    if (!ticketToApprove) return;
    setIsProcessing(true);
    try {
      await api.approveRefund(ticketToApprove.id, {
        transferProofRef: transferProofRef.trim() || `TRF-REF-${Date.now().toString().slice(-6)}`,
        adminNote: adminApprovalNote.trim(),
        officerName: currentUser?.name || 'Administrator Keuangan',
      });
      setActionSuccessMsg(`Pengajuan refund tiket ${ticketToApprove.bookingCode} berhasil disetujui & dicatat!`);
      setTicketToApprove(null);
      onRefreshData();
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err?.message || 'Gagal menyetujui refund');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!ticketToReject) return;
    if (!rejectionReason.trim()) {
      alert('Harap masukkan alasan penolakan refund.');
      return;
    }
    setIsProcessing(true);
    try {
      await api.rejectRefund(ticketToReject.id, {
        reason: rejectionReason.trim(),
        officerName: currentUser?.name || 'Administrator',
      });
      setActionSuccessMsg(`Pengajuan refund tiket ${ticketToReject.bookingCode} telah ditolak.`);
      setTicketToReject(null);
      onRefreshData();
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err?.message || 'Gagal menolak refund');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#0F2C59] p-6 sm:p-7 rounded-3xl text-white shadow-xl border border-indigo-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/20 border border-amber-400/30 rounded-full text-amber-300 text-xs font-bold mb-2">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>MODUL KEUANGAN & PEMBATALAN</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              Persetujuan Pembatalan Tiket & Refund Dana
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Verifikasi permohonan pembatalan tiket dari penumpang feri, periksa kelengkapan nomor rekening bank/e-wallet, setujui pengembalian dana, dan simpan bukti transfer referensi pembayaran.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-center min-w-[130px]">
              <div className="text-[10px] text-amber-300 uppercase font-bold tracking-wider">Menunggu Respon</div>
              <div className="text-2xl font-black text-white mt-0.5">
                {pendingRefunds.length} <span className="text-xs font-normal text-slate-300">Tiket</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-2xl flex items-center justify-between animate-in fade-in shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Pengajuan Refund</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {refundTickets.length} <span className="text-xs font-normal text-slate-500">Permintaan</span>
          </div>
          <div className="text-[11px] text-slate-500">Seluruh riwayat pengajuan refund</div>
        </div>

        <div className={`bg-white p-4 sm:p-5 rounded-2xl border shadow-sm space-y-2 ${pendingRefunds.length > 0 ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Menunggu Persetujuan</span>
            <div className={`p-2 rounded-xl ${pendingRefunds.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600">
            {pendingRefunds.length} <span className="text-xs font-normal text-slate-500">Tiket</span>
          </div>
          <div className="text-[11px] text-amber-700 font-medium">
            {pendingRefunds.length > 0 ? '⚠️ Butuh tindakan persetujuan admin' : 'Tidak ada permohonan tertunda'}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Refund Disetujui</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">
            {approvedRefunds.length} <span className="text-xs font-normal text-slate-500">Tiket</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">
            Total Rp {totalRefundAmountApproved.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Refund Ditolak</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600">
            {rejectedRefunds.length} <span className="text-xs font-normal text-slate-500">Tiket</span>
          </div>
          <div className="text-[11px] text-rose-700 font-medium">Tidak memenuhi syarat ketentuan</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: `Semua (${refundTickets.length})` },
            { id: 'pending', label: `Menunggu Persetujuan (${pendingRefunds.length})`, alert: pendingRefunds.length > 0 },
            { id: 'approved', label: `Disetujui (${approvedRefunds.length})` },
            { id: 'rejected', label: `Ditolak (${rejectedRefunds.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                filterStatus === tab.id
                  ? 'bg-[#0F2C59] text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              {tab.alert && filterStatus !== tab.id && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              )}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode booking, nama, rekening..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <RotateCcw className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tidak Ada Permintaan Refund</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery
              ? `Tidak ditemukan permohonan refund dengan kata kunci "${searchQuery}".`
              : 'Belum ada pengguna/penumpang yang mengajukan pembatalan tiket dan pengembalian uang pada kategori ini.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => {
            const isPending = ticket.refundStatus === 'Diajukan';
            const isApproved = ticket.refundStatus === 'Disetujui';
            const isRejected = ticket.refundStatus === 'Ditolak';
            const details = ticket.refundDetails;

            return (
              <div
                key={ticket.id}
                className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-all ${
                  isPending
                    ? 'border-amber-300 ring-1 ring-amber-400/30'
                    : isApproved
                    ? 'border-emerald-200'
                    : 'border-slate-200 opacity-90'
                }`}
              >
                {/* Card Top Banner */}
                <div
                  className={`px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
                    isPending
                      ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                      : isApproved
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm font-black px-2.5 py-1 bg-white rounded-xl border border-slate-300 shadow-2xs">
                      {ticket.bookingCode}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      Diajukan: {details?.requestedAt || ticket.cancelledAt || '-'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isPending && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-bold animate-pulse shadow-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Menunggu Persetujuan Admin</span>
                      </span>
                    )}
                    {isApproved && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Refund Disetujui & Telah Ditransfer</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-rose-600 text-white rounded-full text-xs font-bold shadow-xs">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Pengajuan Refund Ditolak</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Main Body */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Kolom 1: Data Pemesan & Pelayaran */}
                    <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                        Informasi Penumpang & Kapal
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-700">
                        <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm">
                          <UserIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>{ticket.userName}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{ticket.userPhone || '-'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-700 font-semibold pt-1 border-t border-slate-200">
                          <Ship className="w-4 h-4 text-sky-600 shrink-0" />
                          <span>{ticket.vesselName}</span>
                        </div>
                        <div className="text-slate-600 text-[11px]">
                          Rute: <span className="font-semibold">{ticket.originDockName}</span> ➔ <span className="font-semibold">{ticket.destinationDockName}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-slate-500 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{ticket.travelDate} ({ticket.departureTime})</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ticket.passengersCount} Penumpang
                          {ticket.motorbikesCount > 0 && ` • ${ticket.motorbikesCount} Motor`}
                          {ticket.carsCount > 0 && ` • ${ticket.carsCount} Mobil`}
                        </div>
                      </div>
                    </div>

                    {/* Kolom 2: Nominal & Alasan Pembatalan */}
                    <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                        Nominal Refund & Alasan
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-[11px] text-slate-500 block">Nominal Dana yang Dikembalikan:</span>
                          <span className="text-xl sm:text-2xl font-black text-emerald-700">
                            Rp {(details?.refundAmount || ticket.totalPrice).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="text-xs pt-1 border-t border-slate-200">
                          <span className="text-[11px] text-slate-400 block font-semibold">Alasan Pembatalan dari Penumpang:</span>
                          <p className="text-slate-800 italic mt-0.5 bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                            "{details?.reason || ticket.cancellationReason || 'Tidak ada alasan khusus.'}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Kolom 3: Rekening Penerima Transfer */}
                    <div className="space-y-2.5 bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100">
                      <div className="text-[11px] uppercase font-bold text-indigo-500 tracking-wider flex items-center space-x-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Rekening Tujuan Pengembalian</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="bg-white p-3 rounded-xl border border-indigo-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Bank / E-Wallet</span>
                            <span className="font-extrabold text-indigo-700 text-xs bg-indigo-100/60 px-2 py-0.5 rounded-md">
                              {details?.bankName || 'Bank/E-Wallet'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Nomor Rekening / Akun</span>
                            <span className="font-mono text-base font-black text-slate-900 tracking-wider select-all">
                              {details?.accountNumber || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Atas Nama Pemilik</span>
                            <span className="font-bold text-slate-800 text-xs">
                              {details?.accountHolder || ticket.userName}
                            </span>
                          </div>
                        </div>

                        {details?.transferProofRef && (
                          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px]">
                            <span className="text-slate-500 block">No. Referensi Transfer:</span>
                            <span className="font-mono font-bold text-emerald-800">{details.transferProofRef}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Catatan Admin jika sudah diproses */}
                  {(details?.adminNote || details?.processedAt) && (
                    <div className={`p-3.5 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isApproved ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' : 'bg-rose-50 border border-rose-200 text-rose-900'
                    }`}>
                      <div className="flex items-start space-x-2">
                        {isApproved ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <strong>{isApproved ? 'Catatan Persetujuan Admin:' : 'Alasan Penolakan Admin:'}</strong>{' '}
                          <span>{details?.adminNote}</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium shrink-0">
                        Diproses oleh: <strong>{details?.processedBy || 'Admin'}</strong> pada {details?.processedAt || '-'}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons for Pending Refund */}
                  {isPending && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setTicketToReject(ticket)}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
                      >
                        <X className="w-4 h-4" />
                        <span>Tolak Pengajuan Refund</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenApproveModal(ticket)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-2 active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>Setujui Pembatalan & Refund Dana (Rp {(details?.refundAmount || ticket.totalPrice).toLocaleString('id-ID')})</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL PERSETUJUAN REFUND ================= */}
      {ticketToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-200" />
                <div>
                  <h3 className="font-extrabold text-base">Konfirmasi Persetujuan Refund</h3>
                  <p className="text-xs text-emerald-100">Setujui pembatalan tiket dan masukkan referensi pengembalian dana.</p>
                </div>
              </div>
              <button
                onClick={() => setTicketToApprove(null)}
                className="p-1 rounded-xl text-emerald-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex justify-between items-center text-xs text-emerald-950 font-bold border-b border-emerald-200/80 pb-2">
                  <span>Kode Booking: {ticketToApprove.bookingCode}</span>
                  <span className="text-sm font-black text-emerald-800">
                    Rp {(ticketToApprove.refundDetails?.refundAmount || ticketToApprove.totalPrice).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-xs text-slate-700 space-y-1">
                  <div>Penumpang: <strong>{ticketToApprove.userName}</strong> ({ticketToApprove.userPhone})</div>
                  <div>Tujuan Transfer: <strong>{ticketToApprove.refundDetails?.bankName}</strong> - No. <strong>{ticketToApprove.refundDetails?.accountNumber}</strong> a.n <strong>{ticketToApprove.refundDetails?.accountHolder}</strong></div>
                  <div>Kapal & Rute: {ticketToApprove.vesselName} ({ticketToApprove.originDockName} ➔ {ticketToApprove.destinationDockName})</div>
                </div>
              </div>

              {/* No Referensi Transfer */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Nomor Referensi Bukti Transfer / Transaksi Bank:</span>
                  <span className="text-[10px] text-slate-400 font-normal">Wajib diisi</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={transferProofRef}
                    onChange={(e) => setTransferProofRef(e.target.value)}
                    placeholder="Contoh: TRF-BRI-202610-8912"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Catatan Admin */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Catatan Admin / Keterangan Persetujuan:
                </label>
                <textarea
                  value={adminApprovalNote}
                  onChange={(e) => setAdminApprovalNote(e.target.value)}
                  rows={2}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Catatan untuk diteruskan ke notifikasi penumpang..."
                />
              </div>

              <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600">
                ℹ️ Saat disetujui, penumpang akan menerima notifikasi bahwa dana telah dikembalikan, kuota kapal dilepas, dan log audit keuangan dicatat.
              </div>

              <div className="pt-2 flex justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setTicketToApprove(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmApprove}
                  className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>{isProcessing ? 'Menyetujui...' : 'Konfirmasi & Setujui Refund Dana'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL PENOLAKAN REFUND ================= */}
      {ticketToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            <div className="bg-rose-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <XCircle className="w-6 h-6 text-rose-200" />
                <div>
                  <h3 className="font-extrabold text-base">Tolak Permintaan Refund Tiket</h3>
                  <p className="text-xs text-rose-100">Beri alasan resmi penolakan untuk diinformasikan kepada penumpang.</p>
                </div>
              </div>
              <button
                onClick={() => setTicketToReject(null)}
                className="p-1 rounded-xl text-rose-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-950 space-y-1">
                <div>Tiket: <strong>{ticketToReject.bookingCode}</strong> ({ticketToReject.userName})</div>
                <div>Nominal: <strong>Rp {ticketToReject.totalPrice.toLocaleString('id-ID')}</strong> ({ticketToReject.vesselName})</div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Alasan Penolakan Permintaan Refund:
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none mb-2"
                >
                  <option value="Permintaan pembatalan tiket melewati batas waktu ketentuan operasional dermaga (kurang dari 2 jam sebelum keberangkatan).">
                    Melewati batas waktu ketentuan (kurang dari 2 jam sebelum keberangkatan)
                  </option>
                  <option value="Data nomor rekening bank / nama pemilik tidak valid atau tidak dapat diverifikasi.">
                    Data rekening penerima tidak valid atau salah
                  </option>
                  <option value="Penumpang telah melakukan boarding pass atau tiket telah terpakai di dermaga.">
                    Tiket telah berstatus check-in / boarding
                  </option>
                  <option value="Tiket promo / tarif khusus non-refundable sesuai ketentuan pelayaran.">
                    Tarif khusus non-refundable
                  </option>
                </select>

                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                  placeholder="Tuliskan alasan penolakan secara spesifik..."
                />
              </div>

              <div className="pt-2 flex justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setTicketToReject(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmReject}
                  className="py-2.5 px-6 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <X className="w-4 h-4" />
                  <span>{isProcessing ? 'Memproses...' : 'Tolak Refund Tiket Ini'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
