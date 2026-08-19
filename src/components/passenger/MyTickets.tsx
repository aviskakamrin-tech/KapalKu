import React, { useState } from 'react';
import { Reservation } from '../../types';
import { api } from '../../lib/api';
import {
  Ticket,
  QrCode,
  Calendar,
  Clock,
  MapPin,
  Download,
  CheckCircle2,
  AlertCircle,
  Ship,
  Users,
  ScanLine,
  X,
  Printer,
  ShieldCheck,
  Building2,
  Bike,
  Car,
  Trash2,
  AlertTriangle,
  CreditCard,
  Banknote,
  Copy,
  Lock,
  Unlock,
  RotateCcw,
} from 'lucide-react';

interface MyTicketsProps {
  reservations: Reservation[];
  onOpenBookingWizard?: () => void;
  onRefreshReservations?: () => void;
  onTrackVessel?: (vesselName: string) => void;
}

export const MyTickets: React.FC<MyTicketsProps> = ({
  reservations,
  onOpenBookingWizard,
  onRefreshReservations,
  onTrackVessel,
}) => {
  const [selectedTicket, setSelectedTicket] = useState<Reservation | null>(null);
  const [ticketToCancel, setTicketToCancel] = useState<Reservation | null>(null);
  const [ticketToPay, setTicketToPay] = useState<Reservation | null>(null);

  // Cancellation State
  const [cancelReason, setCancelReason] = useState<string>('Perubahan Jadwal Perjalanan Pribadi');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  // Payment State
  const [payMethod, setPayMethod] = useState<'QR' | 'VA' | 'TRANSFER' | 'CASH'>('QR');
  const [selectedPayBank, setSelectedPayBank] = useState<string>('BCA');
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  // Scan State
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [localReservations, setLocalReservations] = useState<Reservation[]>(reservations);

  // Filter tab for tickets
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'unpaid' | 'cancelled'>('all');

  React.useEffect(() => {
    setLocalReservations(reservations);
  }, [reservations]);

  const handleScanBoarding = async (ticket: Reservation) => {
    if (ticket.reservationStatus === 'Dibatalkan') {
      setScanMessage('⛔ Tiket ini telah DIBATALKAN. Tidak dapat digunakan untuk boarding.');
      return;
    }
    if (ticket.paymentStatus !== 'Lunas') {
      setScanMessage('⚠️ Pembayaran BELUM LUNAS. Harap lunasi pembayaran tiket terlebih dahulu.');
      return;
    }

    setIsScanning(true);
    setScanMessage(null);
    try {
      const res = await api.checkInTicket(ticket.bookingCode, 'Petugas Gate Dermaga (QR Scanner)');
      setScanMessage(res.message);
      setLocalReservations((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, checkInStatus: 'Sudah Check-In (Boarded)' } : t))
      );
      if (selectedTicket && selectedTicket.id === ticket.id) {
        setSelectedTicket((prev) => (prev ? { ...prev, checkInStatus: 'Sudah Check-In (Boarded)' } : null));
      }
      if (onRefreshReservations) onRefreshReservations();
    } catch (err: any) {
      setScanMessage(err.message || 'Gagal memindai boarding pass');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmCancelTicket = async () => {
    if (!ticketToCancel) return;
    setIsCancelling(true);
    try {
      const updated = await api.cancelReservation(ticketToCancel.id, cancelReason);
      setLocalReservations((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      if (selectedTicket && selectedTicket.id === updated.id) {
        setSelectedTicket(updated);
      }
      setCancelSuccessMsg(`Tiket ${ticketToCancel.bookingCode} berhasil dibatalkan.`);
      setTicketToCancel(null);
      if (onRefreshReservations) onRefreshReservations();
      setTimeout(() => setCancelSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan tiket');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCompletePayTicket = async () => {
    if (!ticketToPay) return;
    setIsPaying(true);
    try {
      const methodName =
        payMethod === 'QR'
          ? 'QRIS Nasional'
          : payMethod === 'VA'
          ? `Virtual Account (${selectedPayBank} VA)`
          : payMethod === 'TRANSFER'
          ? `Transfer Bank (${selectedPayBank})`
          : 'Bayar Tunai di Loket Pelabuhan';

      const updated = await api.completePayment(ticketToPay.id, methodName);
      setLocalReservations((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      if (selectedTicket && selectedTicket.id === updated.id) {
        setSelectedTicket(updated);
      }
      setTicketToPay(null);
      if (onRefreshReservations) onRefreshReservations();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses pembayaran');
    } finally {
      setIsPaying(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const filteredTickets = localReservations.filter((t) => {
    if (filterTab === 'active') return t.paymentStatus === 'Lunas' && t.reservationStatus !== 'Dibatalkan';
    if (filterTab === 'unpaid') return t.paymentStatus === 'Menunggu Pembayaran' && t.reservationStatus !== 'Dibatalkan';
    if (filterTab === 'cancelled') return t.reservationStatus === 'Dibatalkan';
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0F2C59] via-[#1E40AF] to-[#0284C7] p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold flex items-center space-x-2.5">
            <Ticket className="w-6 h-6 text-sky-300" />
            <span>Tiket & E-Boarding Pass Saya</span>
          </h2>
          <p className="text-xs text-sky-100 max-w-xl leading-relaxed">
            Kelola e-ticket pelayaran Anda, lakukan pelunasan pembayaran, batalkan reservasi, atau scan QR Code di gerbang masuk dermaga kapal.
          </p>
        </div>

        {onOpenBookingWizard && (
          <button
            onClick={onOpenBookingWizard}
            className="self-start sm:self-auto py-2.5 px-5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
          >
            <Ship className="w-4 h-4" />
            <span>Pesan Tiket Baru</span>
          </button>
        )}
      </div>

      {cancelSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{cancelSuccessMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `Semua Tiket (${localReservations.length})` },
          { id: 'active', label: `🟢 Tiket Lunas & Aktif (${localReservations.filter((r) => r.paymentStatus === 'Lunas' && r.reservationStatus !== 'Dibatalkan').length})` },
          { id: 'unpaid', label: `🟡 Menunggu Bayar (${localReservations.filter((r) => r.paymentStatus === 'Menunggu Pembayaran' && r.reservationStatus !== 'Dibatalkan').length})` },
          { id: 'cancelled', label: `🔴 Dibatalkan (${localReservations.filter((r) => r.reservationStatus === 'Dibatalkan').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filterTab === tab.id
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto">
            <Ticket className="w-8 h-8 text-sky-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {filterTab === 'unpaid'
                ? 'Tidak Ada Tiket Menunggu Pembayaran'
                : filterTab === 'cancelled'
                ? 'Tidak Ada Tiket yang Dibatalkan'
                : 'Belum Ada E-Ticket Aktif'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              E-Ticket dan QR Code Boarding Pass resmi akan langsung diterbitkan setelah Anda memilih jadwal kapal dan menyelesaikan pembayaran.
            </p>
          </div>
          {onOpenBookingWizard && (
            <button
              onClick={onOpenBookingWizard}
              className="py-2.5 px-6 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
            >
              Cari Jadwal & Pesan Tiket
            </button>
          )}
        </div>
      ) : (
        /* Ticket Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTickets.map((ticket) => {
            const isLunas = ticket.paymentStatus === 'Lunas';
            const isDibatalkan = ticket.reservationStatus === 'Dibatalkan';
            const isBoarded = ticket.checkInStatus === 'Sudah Check-In (Boarded)';

            return (
              <div
                key={ticket.id}
                className={`bg-white rounded-3xl border shadow-sm transition-all overflow-hidden p-5 flex flex-col justify-between space-y-4 ${
                  isDibatalkan
                    ? 'border-red-200 bg-red-50/20 opacity-80'
                    : !isLunas
                    ? 'border-amber-300 ring-1 ring-amber-200'
                    : 'border-slate-200 hover:shadow-md'
                }`}
              >
                {/* Top Header Card */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                        {ticket.bookingCode}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          isDibatalkan
                            ? 'bg-red-100 text-red-800'
                            : !isLunas
                            ? 'bg-amber-100 text-amber-800'
                            : isBoarded
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isDibatalkan
                          ? '🔴 Dibatalkan'
                          : !isLunas
                          ? '🟡 Menunggu Pembayaran'
                          : isBoarded
                          ? '⚪ Sudah Boarding'
                          : '🟢 Lunas & Siap Boarding'}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base mt-1 flex items-center space-x-1.5">
                      <Ship className="w-4 h-4 text-sky-600" />
                      <span>{ticket.vesselName}</span>
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Pintu Gate</span>
                    <span className="font-mono font-black text-slate-800 text-sm">{ticket.gateNumber || 'GATE 1A'}</span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Rute Pelayaran</span>
                    <div className="font-bold text-slate-800 truncate">{ticket.originDockName}</div>
                    <div className="text-slate-500 font-medium truncate">➔ {ticket.destinationDockName}</div>
                  </div>

                  <div className="space-y-1 text-right">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Waktu Berangkat</span>
                    <div className="font-bold text-slate-800">{ticket.travelDate}</div>
                    <div className="text-sky-700 font-black">{ticket.departureTime}</div>
                  </div>
                </div>

                {/* Manifest & Payment Summary */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-600 font-medium">
                      👤 {ticket.passengersCount} Orang {ticket.motorbikesCount > 0 ? `• 🛵 ${ticket.motorbikesCount} Motor` : ''}
                    </span>
                    <span className="text-[11px] text-slate-400 block">Atas Nama: {ticket.userName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Total Biaya</span>
                    <span className="font-black text-sm text-slate-900">
                      Rp {ticket.totalPrice?.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Unpaid Warning / Cancellation Note */}
                {!isLunas && !isDibatalkan && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold">
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span>QR Code Boarding Pass Terkunci</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-tight">
                      Selesaikan pelunasan pembayaran untuk mendapatkan barcode QR resmi untuk masuk kapal.
                    </p>
                  </div>
                )}

                {isDibatalkan && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-0.5">
                    <span className="font-bold block">Tiket Tidak Berlaku (Dibatalkan)</span>
                    <span className="text-[11px] text-red-700 block">
                      Alasan: {ticket.cancellationReason || 'Pembatalan oleh penumpang'}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {!isDibatalkan && (
                    <button
                      type="button"
                      onClick={() => setTicketToCancel(ticket)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl border border-red-200 flex items-center space-x-1 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Batalkan Tiket</span>
                    </button>
                  )}

                  <div className="flex items-center space-x-2 ml-auto">
                    {isLunas && !isDibatalkan && onTrackVessel && (
                      <button
                        type="button"
                        onClick={() => onTrackVessel(ticket.vesselName)}
                        className="py-2 px-3 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-xl border border-sky-200 flex items-center space-x-1 cursor-pointer transition-all"
                      >
                        <Ship className="w-3.5 h-3.5 text-sky-600" />
                        <span>Lacak di Live Map</span>
                      </button>
                    )}

                    {!isLunas && !isDibatalkan ? (
                      <button
                        type="button"
                        onClick={() => setTicketToPay(ticket)}
                        className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Bayar Sekarang</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(ticket)}
                        className="py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Buka E-Ticket</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL DETAIL E-TICKET ================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            {/* Top Modal Bar */}
            <div className="bg-[#0F2C59] p-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Ship className="w-5 h-5 text-sky-400" />
                <span className="font-extrabold text-sm">{selectedTicket.vesselName}</span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Status Ribbon */}
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Kode Booking</span>
                  <span className="font-mono font-black text-base text-sky-700">{selectedTicket.bookingCode}</span>
                </div>
                <div className="text-right">
                  <span
                    className={`font-black text-xs px-3 py-1 rounded-full ${
                      selectedTicket.reservationStatus === 'Dibatalkan'
                        ? 'bg-red-100 text-red-800'
                        : selectedTicket.paymentStatus !== 'Lunas'
                        ? 'bg-amber-100 text-amber-800'
                        : selectedTicket.checkInStatus === 'Sudah Check-In (Boarded)'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {selectedTicket.reservationStatus === 'Dibatalkan'
                      ? 'DIBATALKAN'
                      : selectedTicket.paymentStatus !== 'Lunas'
                      ? 'BELUM LUNAS'
                      : selectedTicket.checkInStatus === 'Sudah Check-In (Boarded)'
                      ? 'SUDAH BOARDING'
                      : 'LUNAS (SIAP BOARDING)'}
                  </span>
                </div>
              </div>

              {/* QR Code Center */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-2 relative">
                {selectedTicket.reservationStatus === 'Dibatalkan' ? (
                  <div className="py-6 space-y-2">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
                    <span className="font-black text-red-700 text-sm block">TIKET INI TELAH DIBATALKAN</span>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      QR Code dinonaktifkan dan tidak dapat digunakan untuk memvalidasi masuk kapal di gate dermaga.
                    </p>
                  </div>
                ) : selectedTicket.paymentStatus !== 'Lunas' ? (
                  <div className="py-6 space-y-3">
                    <Lock className="w-10 h-10 text-amber-500 mx-auto" />
                    <span className="font-black text-amber-800 text-sm block">PEMBAYARAN BELUM LUNAS</span>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      QR Code Boarding Pass terkunci. Selesaikan pembayaran tiket untuk membuka QR Code resmi.
                    </p>
                    <button
                      onClick={() => {
                        setTicketToPay(selectedTicket);
                        setSelectedTicket(null);
                      }}
                      className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
                    >
                      Bayar Sekarang
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="bg-white p-3 rounded-2xl border border-slate-300 inline-block shadow-sm">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${selectedTicket.bookingCode}`}
                        alt="QR Code Boarding Pass"
                        className="w-36 h-36 mx-auto"
                      />
                    </div>
                    <div className="text-[11px] font-bold text-slate-600">
                      Tunjukkan barcode ini kepada petugas gate dermaga
                    </div>
                  </>
                )}
              </div>

              {/* Passenger and Route Info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Penumpang:</span>
                  <span className="font-bold text-slate-900">{selectedTicket.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rute:</span>
                  <span className="font-bold text-slate-900">
                    {selectedTicket.originDockName} ➔ {selectedTicket.destinationDockName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jadwal:</span>
                  <span className="font-bold text-slate-900">
                    {selectedTicket.travelDate} ({selectedTicket.departureTime})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Manifest:</span>
                  <span className="font-bold text-slate-900">
                    {selectedTicket.passengersCount} Orang {selectedTicket.motorbikesCount > 0 ? `+ ${selectedTicket.motorbikesCount} Motor` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode Bayar:</span>
                  <span className="font-bold text-slate-900">{selectedTicket.paymentMethod || 'QRIS Terpadu'}</span>
                </div>
              </div>

              {/* Interactive Scan Simulation for Valid Tickets */}
              {selectedTicket.paymentStatus === 'Lunas' && selectedTicket.reservationStatus !== 'Dibatalkan' && (
                <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-sky-900 block">Uji Gate Scanner:</span>
                    <span className="text-[11px] text-sky-700">Simulasikan pemindaian tiket di pintu dermaga</span>
                  </div>
                  <button
                    disabled={isScanning || selectedTicket.checkInStatus === 'Sudah Check-In (Boarded)'}
                    onClick={() => handleScanBoarding(selectedTicket)}
                    className="py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
                  >
                    <ScanLine className="w-3.5 h-3.5" />
                    <span>{isScanning ? 'Scanning...' : 'Scan Gate'}</span>
                  </button>
                </div>
              )}

              {scanMessage && (
                <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-800 font-bold">
                  {scanMessage}
                </div>
              )}

              <div className="pt-2 flex justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh / Cetak</span>
                  </button>

                  {selectedTicket.paymentStatus === 'Lunas' && selectedTicket.reservationStatus !== 'Dibatalkan' && onTrackVessel && (
                    <button
                      type="button"
                      onClick={() => {
                        onTrackVessel(selectedTicket.vesselName);
                        setSelectedTicket(null);
                      }}
                      className="py-2.5 px-4 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl border border-sky-200 flex items-center space-x-1 cursor-pointer"
                    >
                      <Ship className="w-4 h-4 text-sky-600" />
                      <span>Lacak di Live Map</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL BATALKAN PEMESANAN TIKET ================= */}
      {ticketToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            <div className="bg-red-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-extrabold text-sm">Batalkan Pemesanan Tiket</span>
              </div>
              <button
                onClick={() => setTicketToCancel(null)}
                className="p-1 rounded-lg text-red-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-xs text-slate-500">Anda akan membatalkan tiket berikut:</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <div className="font-bold text-slate-900">{ticketToCancel.vesselName}</div>
                  <div className="text-slate-600">{ticketToCancel.originDockName} ➔ {ticketToCancel.destinationDockName}</div>
                  <div className="text-slate-500">Kode: <strong className="font-mono text-sky-700">{ticketToCancel.bookingCode}</strong> • Tanggal: {ticketToCancel.travelDate}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Pilih Alasan Pembatalan:</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="Perubahan Jadwal Perjalanan Pribadi">Perubahan Jadwal Perjalanan Pribadi</option>
                  <option value="Kondisi Cuaca / Alasan Keamanan">Kondisi Cuaca / Alasan Keamanan</option>
                  <option value="Salah Memilih Rute / Kapal">Salah Memilih Rute / Kapal</option>
                  <option value="Keperluan Darurat Mendesak">Keperluan Darurat Mendesak</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                ℹ️ <strong>Kebijakan Pengembalian (Refund):</strong> Kuota kursi akan segera dikembalikan ke jadwal umum. Pengembalian dana akan diproses secara otomatis sesuai metode pembayaran asal.
              </div>

              <div className="pt-2 flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setTicketToCancel(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal, Tetap Simpan
                </button>
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={handleConfirmCancelTicket}
                  className="py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-md flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isCancelling ? 'Membatalkan...' : 'Ya, Batalkan Tiket Ini'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL SELESAIKAN PEMBAYARAN TIKET ================= */}
      {ticketToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span className="font-extrabold text-sm">Selesaikan Pembayaran Tiket</span>
              </div>
              <button
                onClick={() => setTicketToPay(null)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center">
                <div>
                  <div className="text-xs text-slate-300">{ticketToPay.vesselName}</div>
                  <div className="font-mono text-sm text-sky-300 font-bold">{ticketToPay.bookingCode}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Pelunasan</span>
                  <span className="font-black text-lg text-amber-300">
                    Rp {ticketToPay.totalPrice?.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* 4 Methods Choice */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'QR', label: 'QRIS', icon: QrCode },
                  { id: 'VA', label: 'Virtual Account', icon: CreditCard },
                  { id: 'TRANSFER', label: 'Transfer Bank', icon: Building2 },
                  { id: 'CASH', label: 'Cash Loket', icon: Banknote },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayMethod(m.id as any)}
                      className={`p-2.5 rounded-xl border text-center text-xs transition-all cursor-pointer ${
                        payMethod === m.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 mx-auto mb-1 text-emerald-700" />
                      <div>{m.label}</div>
                    </button>
                  );
                })}
              </div>

              {/* Content per method */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                {payMethod === 'QR' && (
                  <div className="text-center space-y-2">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-300 inline-block">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=KAPALKU_QRIS_${ticketToPay.bookingCode}_${ticketToPay.totalPrice}`}
                        alt="QRIS Pelunasan"
                        className="w-32 h-32 mx-auto"
                      />
                    </div>
                    <div className="text-xs text-slate-600 font-medium">
                      Scan dengan BCA mobile, GoPay, OVO, Dana, ShopeePay, Livin' Mandiri
                    </div>
                  </div>
                )}

                {payMethod === 'VA' && (
                  <div className="space-y-2 text-xs">
                    <div className="flex space-x-1">
                      {['BCA', 'Mandiri', 'BRI', 'BNI'].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setSelectedPayBank(b)}
                          className={`px-2.5 py-1 rounded text-xs font-bold ${
                            selectedPayBank === b ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Nomor {selectedPayBank} VA</span>
                        <span className="font-mono font-black text-sm text-slate-900">8802812345678901</span>
                      </div>
                      <button
                        onClick={() => handleCopy('8802812345678901', 'va')}
                        className="text-emerald-700 font-bold text-xs flex items-center space-x-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedLabel === 'va' ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {payMethod === 'TRANSFER' && (
                  <div className="space-y-2 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">BCA (PT KapalKu Nusantara)</span>
                        <span className="font-mono font-black text-sm text-slate-900">8820-1928-3401</span>
                      </div>
                      <button
                        onClick={() => handleCopy('8820-1928-3401', 'rek')}
                        className="text-emerald-700 font-bold text-xs flex items-center space-x-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedLabel === 'rek' ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {payMethod === 'CASH' && (
                  <div className="space-y-1 text-xs">
                    <span className="text-slate-600">Kode Pembayaran Loket:</span>
                    <div className="font-mono font-black text-base text-amber-800 bg-white p-2.5 rounded-xl border border-amber-200">
                      PAY-LOKET-{ticketToPay.bookingCode.slice(-4)}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setTicketToPay(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  disabled={isPaying}
                  onClick={handleCompletePayTicket}
                  className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Unlock className="w-4 h-4" />
                  <span>{isPaying ? 'Memproses...' : 'Konfirmasi Selesai Bayar & Buka E-Ticket'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
