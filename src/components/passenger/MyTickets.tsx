import React, { useState } from 'react';
import { Reservation } from '../../types';
import { Ticket, QrCode, Calendar, Clock, MapPin, Download, CheckCircle2, AlertCircle } from 'lucide-react';

interface MyTicketsProps {
  reservations: Reservation[];
}

export const MyTickets: React.FC<MyTicketsProps> = ({ reservations }) => {
  const [selectedTicket, setSelectedTicket] = useState<Reservation | null>(null);

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
          <Ticket className="w-5 h-5 text-sky-600" />
          <span>Tiket & Pass Digital Saya</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Tunjukkan kode booking / QR code ini kepada petugas dermaga atau nakhoda sebelum naik ke kapal.
        </p>
      </div>

      {reservations.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Belum Ada Tiket</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Anda belum memiliki reservasi tiket kapal. Cari rute dan pesan jadwal pelayaran terlebih dahulu.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reservations.map((res) => (
            <div
              key={res.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden p-5 space-y-4 relative"
            >
              {/* Ticket Top Strip */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-extrabold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100 text-xs">
                    {res.bookingCode}
                  </span>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    res.reservationStatus === 'Terkonfirmasi'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {res.reservationStatus}
                </span>
              </div>

              {/* Body */}
              <div className="grid grid-cols-3 gap-3 items-center">
                <div className="col-span-2 space-y-2">
                  <h3 className="font-extrabold text-slate-900 text-base">{res.vesselName}</h3>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span className="truncate">{res.originDockName} → {res.destinationDockName}</span>
                    </div>

                    <div className="flex items-center space-x-1 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{res.travelDate} ({res.departureTime})</span>
                    </div>
                  </div>

                  <div className="pt-2 text-xs">
                    <span className="text-slate-500">Penumpang: </span>
                    <span className="font-bold text-slate-900">{res.passengersCount} Orang</span>
                    {res.motorbikesCount > 0 && <span className="text-slate-500"> + {res.motorbikesCount} Motor</span>}
                    {res.carsCount > 0 && <span className="text-slate-500"> + {res.carsCount} Mobil</span>}
                  </div>
                </div>

                {/* QR Code Preview */}
                <div className="text-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <img
                    src={res.qrCodeUrl}
                    alt="QR Code"
                    className="w-20 h-20 mx-auto cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setSelectedTicket(res)}
                  />
                  <span className="text-[9px] font-mono font-bold text-slate-500 mt-1 block">
                    KLIK QR ENLARGE
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Total Tarif</span>
                  <span className="font-black text-slate-900 text-sm">
                    Rp {res.totalPrice.toLocaleString('id-ID')}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedTicket(res)}
                  className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Buka Pass QR</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Modal Enlarge */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4 relative border border-slate-100">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-sm"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] font-mono font-extrabold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full uppercase">
                {selectedTicket.bookingCode}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">{selectedTicket.vesselName}</h3>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block shadow-sm">
              <img src={selectedTicket.qrCodeUrl} alt="QR Code Enlarged" className="w-48 h-48 mx-auto" />
              <p className="text-[10px] text-slate-500 font-mono font-bold mt-2">
                Pindai di Dermaga Keberangkatan
              </p>
            </div>

            <div className="text-left bg-sky-50/60 p-3.5 rounded-xl border border-sky-100 text-xs space-y-1.5">
              <div><strong>Rute:</strong> {selectedTicket.originDockName} → {selectedTicket.destinationDockName}</div>
              <div><strong>Tanggal & Waktu:</strong> {selectedTicket.travelDate} ({selectedTicket.departureTime})</div>
              <div><strong>Pemesan:</strong> {selectedTicket.userName} ({selectedTicket.userPhone})</div>
              <div><strong>Status:</strong> <span className="text-emerald-700 font-bold">{selectedTicket.reservationStatus}</span></div>
            </div>

            <button
              onClick={() => setSelectedTicket(null)}
              className="w-full bg-sky-600 text-white font-bold py-3 rounded-xl text-xs hover:bg-sky-700 transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
