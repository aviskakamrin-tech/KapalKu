import React, { useState } from 'react';
import { Schedule, Reservation } from '../../types';
import { X, Check, Ticket, QrCode, Users, Bike, Car, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

interface BookingModalProps {
  schedule: Schedule | null;
  onClose: () => void;
  onConfirmBooking: (bookingData: {
    scheduleId: string;
    userName: string;
    userPhone: string;
    passengersCount: number;
    motorbikesCount: number;
    carsCount: number;
  }) => Promise<Reservation | null>;
  onSuccessViewTickets: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  schedule,
  onClose,
  onConfirmBooking,
  onSuccessViewTickets,
}) => {
  if (!schedule) return null;

  const [userName, setUserName] = useState('Ahmad Faisal');
  const [userPhone, setUserPhone] = useState('0812-3456-7890');
  const [passengersCount, setPassengersCount] = useState(1);
  const [motorbikesCount, setMotorbikesCount] = useState(0);
  const [carsCount, setCarsCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdReservation, setCreatedReservation] = useState<Reservation | null>(null);

  const availableSeats = schedule.maxPassengers - schedule.bookedPassengers;

  const totalPrice =
    passengersCount * schedule.tariffPassenger +
    motorbikesCount * schedule.tariffMotorbike +
    carsCount * schedule.tariffCar;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passengersCount > availableSeats) {
      setErrorMsg(`Kuota kursi tersisa hanya ${availableSeats}.`);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await onConfirmBooking({
        scheduleId: schedule.id,
        userName,
        userPhone,
        passengersCount,
        motorbikesCount,
        carsCount,
      });

      if (res) {
        setCreatedReservation(res);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membuat reservasi. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#0F2C59] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Ticket className="w-6 h-6 text-sky-400" />
            <div>
              <h3 className="font-extrabold text-base">Reservasi Tiket Digital</h3>
              <p className="text-xs text-sky-200">KapalKu Official E-Ticketing</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-sky-900 text-sky-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {createdReservation ? (
          /* Confirmation Success Screen */
          <div className="p-6 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Reservasi Terkonfirmasi
              </span>
              <h4 className="text-2xl font-black text-slate-900 mt-2">
                {createdReservation.bookingCode}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Tunjukkan QR Code ini kepada petugas dermaga saat boarding
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block shadow-sm">
              <img
                src={createdReservation.qrCodeUrl}
                alt="QR Code Tiket"
                className="w-40 h-40 mx-auto"
              />
              <span className="text-[10px] font-mono font-bold text-slate-600 block mt-2">
                KAPALKU DIGITAL PASS
              </span>
            </div>

            {/* Ticket Summary Box */}
            <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Kapal:</span>
                <span className="font-bold text-slate-900">{createdReservation.vesselName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rute:</span>
                <span className="font-bold text-slate-900">
                  {createdReservation.originDockName} → {createdReservation.destinationDockName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jadwal Keberangkatan:</span>
                <span className="font-bold text-slate-900">
                  {createdReservation.travelDate} ({createdReservation.departureTime})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Penumpang:</span>
                <span className="font-bold text-slate-900">{createdReservation.passengersCount} orang</span>
              </div>
              <div className="flex justify-between border-t border-sky-200/60 pt-1 mt-1">
                <span className="text-slate-700 font-bold">Total Pembayaran:</span>
                <span className="font-black text-sky-900">
                  Rp {createdReservation.totalPrice.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="pt-2 flex space-x-3">
              <button
                onClick={onClose}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-xs transition-all"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  onClose();
                  onSuccessViewTickets();
                }}
                className="w-1/2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md shadow-sky-600/30"
              >
                Lihat Tiket Saya
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form Screen */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Voyage Details Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 text-sm">{schedule.vesselName}</span>
                <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  {schedule.vesselType}
                </span>
              </div>
              <div className="text-slate-600">
                {schedule.originDockName} → {schedule.destinationDockName}
              </div>
              <div className="flex justify-between text-slate-500 font-medium pt-1 border-t border-slate-200/60">
                <span>Tanggal: {schedule.date}</span>
                <span>Jam: {schedule.departureTime} WITA</span>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Passenger Info */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pemesan</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                <input
                  type="tel"
                  required
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Quantities */}
              <div className="grid grid-cols-3 gap-2">
                {/* Passengers */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-sky-600" />
                    <span>Penumpang</span>
                  </label>
                  <select
                    value={passengersCount}
                    onChange={(e) => setPassengersCount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n} disabled={n > availableSeats}>
                        {n} Orang {n > availableSeats ? '(Habis)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Motorbike */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center space-x-1">
                    <Bike className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Motor</span>
                  </label>
                  <select
                    disabled={schedule.tariffMotorbike === 0}
                    value={motorbikesCount}
                    onChange={(e) => setMotorbikesCount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold disabled:bg-slate-100"
                  >
                    {[0, 1, 2, 3].map((n) => (
                      <option key={n} value={n}>
                        {n} Unit
                      </option>
                    ))}
                  </select>
                </div>

                {/* Car */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center space-x-1">
                    <Car className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Mobil</span>
                  </label>
                  <select
                    disabled={schedule.tariffCar === 0}
                    value={carsCount}
                    onChange={(e) => setCarsCount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold disabled:bg-slate-100"
                  >
                    {[0, 1, 2].map((n) => (
                      <option key={n} value={n}>
                        {n} Unit
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Total Price Summary */}
            <div className="bg-sky-50 p-4 rounded-2xl border border-sky-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-sky-800 font-bold uppercase tracking-wider block">
                  Total Biaya Tiket
                </span>
                <span className="text-xl font-black text-sky-950">
                  Rp {totalPrice.toLocaleString('id-ID')}
                </span>
              </div>

              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md font-bold flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Pembayaran Langsung / Tunai</span>
              </span>
            </div>

            {/* Confirm button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-sky-600/30 flex items-center justify-center space-x-2 active:scale-95"
            >
              {loading ? (
                <span>Memproses Tiket...</span>
              ) : (
                <>
                  <span>Konfirmasi Reservasi Digital</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
