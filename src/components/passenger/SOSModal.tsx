import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, MapPin, CheckCircle2, PhoneCall, X } from 'lucide-react';
import { SOSReport } from '../../types';

interface SOSModalProps {
  onClose: () => void;
  onSendSOS: (data: Partial<SOSReport>) => Promise<SOSReport | null>;
}

export const SOSModal: React.FC<SOSModalProps> = ({ onClose, onSendSOS }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Double Confirm, 2: Details, 3: Sent Success
  const [emergencyType, setEmergencyType] = useState<string>('Mesin Mogok / Rusak');
  const [description, setDescription] = useState<string>('');
  const [vesselName, setVesselName] = useState<string>('Kapal / Lokasi Penumpang');
  const [bookingCode, setBookingCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sosResult, setSosResult] = useState<SOSReport | null>(null);

  // Simulated GPS position
  const [lat, setLat] = useState<number>(-1.2610);
  const [lng, setLng] = useState<number>(116.8010);

  const handleConfirmStep1 = () => {
    // Try browser geolocation if permitted
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        (_err) => {
          // fallback location
        }
      );
    }
    setStep(2);
  };

  const handleSendSOS = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await onSendSOS({
        emergencyType,
        description: description || `Panggilan Darurat ${emergencyType} di perairan.`,
        vesselName,
        bookingCode,
        lat,
        lng,
      });

      if (res) {
        setSosResult(res);
        setStep(3);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-red-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-red-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <h3 className="font-extrabold text-base">Tombol Darurat SOS KapalKu</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-red-700 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Confirmation */}
        {step === 1 && (
          <div className="p-6 text-center space-y-5">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto sos-beacon">
              <AlertTriangle className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h4 className="text-xl font-black text-slate-900">
                Apakah Anda benar-benar dalam keadaan darurat?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sinyal SOS akan secara otomatis mengirimkan lokasi GPS, identitas Anda, dan status pelayaran langsung ke Pusat Kontrol Syahbandar & Operator Pelabuhan.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-900 text-left">
              <strong>Catatan:</strong> Fitur SOS ini berfungsi sebagai pelaporan darurat awal ke pihak pengelola pelabuhan. Untuk keadaan darurat jiwa, Anda juga dapat menghubungi Tim SAR di 115.
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={onClose}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3.5 rounded-xl text-xs transition-all"
              >
                Batalkan
              </button>
              <button
                onClick={handleConfirmStep1}
                className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-extrabold py-3.5 rounded-xl text-xs transition-all shadow-lg shadow-red-600/30 active:scale-95"
              >
                Ya, Saya Darurat!
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Form Details */}
        {step === 2 && (
          <form onSubmit={handleSendSOS} className="p-6 space-y-4">
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs text-red-900 space-y-1">
              <div className="font-bold flex items-center space-x-1">
                <MapPin className="w-4 h-4 text-red-600" />
                <span>Koordinat GPS Terdeteksi:</span>
              </div>
              <p className="font-mono text-[11px]">{lat.toFixed(5)}, {lng.toFixed(5)}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Keadaan Darurat</label>
              <select
                value={emergencyType}
                onChange={(e) => setEmergencyType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-red-500"
              >
                <option value="Mesin Mogok / Rusak">Mesin Mogok / Rusak</option>
                <option value="Cuaca Buruk / Gelombang">Cuaca Buruk / Gelombang Tinggi</option>
                <option value="Orang Jatuh ke Laut (MOB)">Orang Jatuh ke Laut (Man Overboard)</option>
                <option value="Kebocoran / Kerusakan Lambung">Kebocoran / Kerusakan Lambung</option>
                <option value="Kondisi Medis Kritis">Kondisi Medis Kritis Penumpang</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kapal (Opsional)</label>
              <input
                type="text"
                value={vesselName}
                onChange={(e) => setVesselName(e.target.value)}
                placeholder="mis: KM Bahari 01"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kode Booking Tiket (Opsional)</label>
              <input
                type="text"
                value={bookingCode}
                onChange={(e) => setBookingCode(e.target.value)}
                placeholder="mis: KK-20260811-001"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan Singkat Kejadian</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan secara singkat kondisi terkini..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl text-xs"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 rounded-xl text-xs transition-all shadow-lg shadow-red-600/30 active:scale-95"
              >
                {loading ? 'Mengirim Sinyal SOS...' : '🚨 KIRIM SOS SEKARANG'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Success Sent */}
        {step === 3 && sosResult && (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full uppercase">
                Sinyal SOS Terkirim
              </span>
              <h4 className="text-xl font-black text-slate-900 mt-2">Pesan Darurat Diterima</h4>
              <p className="text-xs text-slate-600 mt-1">
                Laporan SOS Anda ({sosResult.emergencyType}) telah diteruskan ke Kantor Syahbandar Pelabuhan & Tim Operator Terdekat.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-1 font-mono">
              <div><strong>ID Laporan:</strong> {sosResult.id}</div>
              <div><strong>Status:</strong> <span className="text-amber-600 font-bold">{sosResult.status}</span></div>
              <div><strong>Waktu Lapor:</strong> {sosResult.time}</div>
              <div><strong>Koordinat:</strong> {sosResult.lat.toFixed(5)}, {sosResult.lng.toFixed(5)}</div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition-all"
            >
              Tutup & Kembali
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
