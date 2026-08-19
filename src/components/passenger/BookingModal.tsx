import React, { useState, useEffect } from 'react';
import { Schedule, Reservation, User, Dock, RouteItem } from '../../types';
import { api } from '../../lib/api';
import {
  X,
  Check,
  Ticket,
  QrCode,
  Users,
  Bike,
  Car,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  MapPin,
  Calendar,
  Clock,
  Ship,
  CreditCard,
  Download,
  Share2,
  Sparkles,
  CheckCircle2,
  ScanLine,
  UserCheck,
  Building2,
  AlertTriangle,
  Copy,
  Receipt,
  Banknote,
  QrCode as QrIcon,
  HelpCircle,
  Lock,
  Unlock,
} from 'lucide-react';

interface BookingModalProps {
  schedule: Schedule | null;
  docks?: Dock[];
  routes?: RouteItem[];
  allSchedules?: Schedule[];
  currentUser?: User | null;
  onClose: () => void;
  onConfirmBooking: (bookingData: {
    scheduleId: string;
    userName: string;
    userPhone: string;
    userEmail?: string;
    passengersCount: number;
    motorbikesCount?: number;
    carsCount?: number;
    passengersList?: Array<{ name: string; idNumber: string; type: 'Dewasa' | 'Anak'; seatNumber?: string }>;
    vehiclePlate?: string;
    vehicleType?: string;
    paymentMethod?: string;
  }) => Promise<Reservation | null>;
  onSuccessViewTickets: () => void;
  onTrackVessel?: (vesselName: string) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  schedule: initialSchedule,
  docks = [],
  routes = [],
  allSchedules = [],
  currentUser,
  onClose,
  onConfirmBooking,
  onSuccessViewTickets,
  onTrackVessel,
}) => {
  // Wizard Steps: 1: Rute -> 2: Tanggal -> 3: Kapal -> 4: Penumpang & Manifest -> 5: Pembayaran & Pelunasan -> 6: E-Ticket Resmi
  const [currentStep, setCurrentStep] = useState<number>(initialSchedule ? 4 : 1);

  // Selected Data
  const [selectedOrigin, setSelectedOrigin] = useState<string>(
    initialSchedule ? initialSchedule.originDockName : docks[0]?.name || ''
  );
  const [selectedDestination, setSelectedDestination] = useState<string>(
    initialSchedule ? initialSchedule.destinationDockName : docks[1]?.name || ''
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    initialSchedule ? initialSchedule.date : '2026-08-11'
  );
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(initialSchedule);

  // Passenger & Vehicle Counters
  const [passengersCount, setPassengersCount] = useState<number>(1);
  const [motorbikesCount, setMotorbikesCount] = useState<number>(0);
  const [carsCount, setCarsCount] = useState<number>(0);

  // Lead Buyer Information
  const [userName, setUserName] = useState<string>(currentUser?.name || 'Ahmad Faisal');
  const [userPhone, setUserPhone] = useState<string>(currentUser?.phone || '0812-3456-7890');
  const [userEmail, setUserEmail] = useState<string>(currentUser?.email || 'faisal.maritim@kapalku.id');

  // Passenger Manifest List
  const [passengersList, setPassengersList] = useState<Array<{ name: string; idNumber: string; type: 'Dewasa' | 'Anak' }>>([
    { name: currentUser?.name || 'Ahmad Faisal', idNumber: '7371092801950001', type: 'Dewasa' },
  ]);

  // Vehicle Details
  const [vehiclePlate, setVehiclePlate] = useState<string>('KT 4892 XX');
  const [vehicleType, setVehicleType] = useState<string>('Honda Beat / Sepeda Motor');

  // Payment Method: 'QR' | 'VA' | 'TRANSFER' | 'CASH'
  const [paymentMethodType, setPaymentMethodType] = useState<'QR' | 'VA' | 'TRANSFER' | 'CASH'>('QR');
  const [selectedBank, setSelectedBank] = useState<string>('BCA');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Submission & Result States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [createdReservation, setCreatedReservation] = useState<Reservation | null>(null);

  // Simulated Scan Result State for Step 6
  const [simulatedScanResult, setSimulatedScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setUserName(currentUser.name);
      if (currentUser.phone) setUserPhone(currentUser.phone);
      if (currentUser.email) setUserEmail(currentUser.email);
    }
  }, [currentUser]);

  // Adjust passenger manifest list when passengersCount changes
  useEffect(() => {
    setPassengersList((prev) => {
      const newList = [...prev];
      if (passengersCount > newList.length) {
        for (let i = newList.length; i < passengersCount; i++) {
          newList.push({
            name: `Penumpang ${i + 1}`,
            idNumber: `3201${Math.floor(100000000000 + Math.random() * 900000000000)}`,
            type: 'Dewasa',
          });
        }
      } else if (passengersCount < newList.length) {
        newList.splice(passengersCount);
      }
      return newList;
    });
  }, [passengersCount]);

  // Filter available schedules based on selected origin and destination
  const availableSchedules = allSchedules.filter((s) => {
    const matchOrigin = !selectedOrigin || s.originDockName.toLowerCase().includes(selectedOrigin.toLowerCase());
    const matchDest = !selectedDestination || s.destinationDockName.toLowerCase().includes(selectedDestination.toLowerCase());
    return matchOrigin && matchDest;
  });

  // Calculate Tariffs
  const activeSch = selectedSchedule || initialSchedule || availableSchedules[0] || allSchedules[0];
  const basePrice = activeSch
    ? passengersCount * activeSch.tariffPassenger +
      motorbikesCount * activeSch.tariffMotorbike +
      carsCount * activeSch.tariffCar
    : 0;
  const insuranceFee = passengersCount * 5000;
  const portServiceFee = passengersCount * 2500 + (motorbikesCount > 0 ? 5000 : 0) + (carsCount > 0 ? 15000 : 0);
  const grandTotal = basePrice + insuranceFee + portServiceFee;

  // Dynamic VA & Payment Data
  const vaNumber = `${selectedBank === 'BCA' ? '8802' : selectedBank === 'Mandiri' ? '8920' : selectedBank === 'BRI' ? '7829' : '9881'}${userPhone.replace(/[^0-9]/g, '').slice(-8) || '81234567'}`;
  const bankAccount = selectedBank === 'BCA' ? '8820-1928-3401' : selectedBank === 'Mandiri' ? '137-00-9821-3920' : selectedBank === 'BRI' ? '0206-01-002819-532' : '0892-1829-3841';
  const cashCode = `PAY-LOKET-${activeSch?.id ? activeSch.id.replace('sch_', '') : '789'}`;

  const getFullPaymentMethodName = () => {
    switch (paymentMethodType) {
      case 'QR':
        return 'QRIS Nasional (BCA / Mandiri / GoPay / OVO)';
      case 'VA':
        return `Virtual Account (${selectedBank} VA)`;
      case 'TRANSFER':
        return `Transfer Bank Manual (${selectedBank})`;
      case 'CASH':
        return 'Bayar Tunai di Kasir Loket Pelabuhan';
      default:
        return 'QRIS Terpadu';
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleUpdatePassenger = (index: number, field: 'name' | 'idNumber' | 'type', value: string) => {
    setPassengersList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Complete Payment & Unlock E-Ticket
  const handleProcessPaymentAndUnlockTicket = async () => {
    if (!activeSch) {
      setErrorMsg('Pilih jadwal kapal terlebih dahulu');
      return;
    }

    setIsProcessingPayment(true);
    setErrorMsg('');

    try {
      // 1. Create reservation
      const res = await onConfirmBooking({
        scheduleId: activeSch.id,
        userName,
        userPhone,
        userEmail,
        passengersCount,
        motorbikesCount,
        carsCount,
        passengersList,
        vehiclePlate: motorbikesCount > 0 || carsCount > 0 ? vehiclePlate : undefined,
        vehicleType: motorbikesCount > 0 || carsCount > 0 ? vehicleType : undefined,
        paymentMethod: getFullPaymentMethodName(),
      });

      if (res) {
        // 2. Mark payment as completed to immediately generate the official e-ticket
        const paidRes = await api.completePayment(res.id, getFullPaymentMethodName());
        setCreatedReservation(paidRes);
        setCurrentStep(6);
      } else {
        throw new Error('Gagal memproses pemesanan');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses pembayaran tiket.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSimulateScan = async (code: string) => {
    setIsScanning(true);
    setSimulatedScanResult(null);
    try {
      const result = await api.checkInTicket(code, 'Petugas Gate Dermaga (QR Scanner)');
      setSimulatedScanResult(result.message);
      if (createdReservation) {
        setCreatedReservation({
          ...createdReservation,
          checkInStatus: 'Sudah Check-In (Boarded)',
        });
      }
    } catch (err: any) {
      setSimulatedScanResult(err.message || 'Gagal memindai tiket');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="bg-[#0F2C59] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">Pemesanan Tiket Kapal Nusantara</h3>
              <p className="text-xs text-sky-200">
                {currentStep === 6 ? 'E-Ticket & Boarding Pass Resmi' : `Langkah ${currentStep} dari 5: Pemesanan & Pembayaran`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-sky-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        {currentStep <= 5 && (
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
            <div className="flex items-center justify-between max-w-xl mx-auto text-xs font-bold">
              {[
                { num: 1, label: 'Rute' },
                { num: 2, label: 'Tanggal' },
                { num: 3, label: 'Kapal' },
                { num: 4, label: 'Manifest' },
                { num: 5, label: 'Pembayaran' },
              ].map((step, idx) => (
                <div key={step.num} className="flex items-center space-x-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold transition-all ${
                      currentStep === step.num
                        ? 'bg-sky-600 text-white ring-4 ring-sky-100 shadow-sm'
                        : currentStep > step.num
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {currentStep > step.num ? <Check className="w-3.5 h-3.5" /> : step.num}
                  </div>
                  <span
                    className={`hidden sm:inline text-[11px] ${
                      currentStep === step.num ? 'text-sky-900 font-black' : 'text-slate-500 font-medium'
                    }`}
                  >
                    {step.label}
                  </span>
                  {idx < 4 && <div className="hidden sm:block w-6 h-[2px] bg-slate-200 ml-1" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ================= STEP 1: PILIH RUTE SE-INDONESIA ================= */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  <span>Langkah 1: Pilih Rute Pelayaran Se-Indonesia</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Pilih dermaga asal dan dermaga tujuan penyeberangan antar-pulau atau teluk sungai di seluruh nusantara.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Dermaga Asal (Keberangkatan):</label>
                  <select
                    value={selectedOrigin}
                    onChange={(e) => setSelectedOrigin(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 outline-none"
                  >
                    {['Jawa & Bali', 'Sumatera', 'Kalimantan', 'Sulawesi', 'Nusa Tenggara', 'Maluku & Papua'].map((reg) => {
                      const regDocks = docks.filter((d) => d.region === reg || (!d.region && reg === 'Kalimantan'));
                      if (regDocks.length === 0) return null;
                      return (
                        <optgroup key={reg} label={`📍 ${reg}`}>
                          {regDocks.map((d) => (
                            <option key={d.id} value={d.name}>
                              {d.name} ({d.province || reg})
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Dermaga Tujuan (Kedatangan):</label>
                  <select
                    value={selectedDestination}
                    onChange={(e) => setSelectedDestination(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 outline-none"
                  >
                    {['Jawa & Bali', 'Sumatera', 'Kalimantan', 'Sulawesi', 'Nusa Tenggara', 'Maluku & Papua'].map((reg) => {
                      const regDocks = docks.filter((d) => d.region === reg || (!d.region && reg === 'Kalimantan'));
                      if (regDocks.length === 0) return null;
                      return (
                        <optgroup key={reg} label={`📍 ${reg}`}>
                          {regDocks.map((d) => (
                            <option key={d.id} value={d.name}>
                              {d.name} ({d.province || reg})
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Popular Fast Route Buttons */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-500 block mb-2">⚡ Pilihan Cepat Rute Populer:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { origin: 'Dermaga Semayang (Balikpapan)', dest: 'Dermaga Penajam (Penajam Paser Utara)', label: 'Balikpapan ➔ Penajam' },
                    { origin: 'Pelabuhan Merak (Banten)', dest: 'Pelabuhan Bakauheni (Lampung)', label: 'Merak ➔ Bakauheni' },
                    { origin: 'Pelabuhan Ketapang (Banyuwangi)', dest: 'Pelabuhan Gilimanuk (Bali)', label: 'Ketapang ➔ Gilimanuk' },
                    { origin: 'Pelabuhan Padangbai (Karangasem, Bali)', dest: 'Pelabuhan Lembar (Lombok Barat)', label: 'Padangbai ➔ Lembar' },
                    { origin: 'Pelabuhan Bira (Bulukumba, Sulsel)', dest: 'Pelabuhan Pamatata (Selayar, Sulsel)', label: 'Bira ➔ Selayar' },
                    { origin: 'Pelabuhan Nusantara Kendari (Sultra)', dest: 'Pelabuhan Murhum (Baubau, Buton)', label: 'Kendari ➔ Baubau' },
                    { origin: 'Pelabuhan Sorong (Papua Barat Daya)', dest: 'Pelabuhan Waisai (Raja Ampat)', label: 'Sorong ➔ Raja Ampat' },
                  ].map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedOrigin(r.origin);
                        setSelectedDestination(r.dest);
                      }}
                      className="text-[11px] font-bold px-3 py-1.5 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 rounded-xl border border-slate-200 transition-all"
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="py-2.5 px-6 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5"
                >
                  <span>Lanjut: Pilih Tanggal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: PILIH TANGGAL PERJALANAN ================= */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <span>Langkah 2: Pilih Tanggal Keberangkatan</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Pilih tanggal perjalanan Anda. Sistem akan memverifikasi prakiraan gelombang cuaca maritim BMKG.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700">Tanggal Keberangkatan:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none"
                />

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2.5 text-xs text-emerald-800">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Status Pelayaran: Kondisi Maritim Aman (Gelombang 0.4m - 1.0m)</span>
                    <span className="text-[11px] text-emerald-700">
                      Seluruh armada feri, speedboat cepat, dan kapal perintis siap melayani penyeberangan pada tanggal ini.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="py-2.5 px-6 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5"
                >
                  <span>Lanjut: Pilih Kapal & Jadwal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: PILIH KAPAL & JADWAL ================= */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Ship className="w-4 h-4 text-sky-600" />
                  <span>Langkah 3: Pilih Kapal & Jam Keberangkatan</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Rute: <strong>{selectedOrigin}</strong> ➔ <strong>{selectedDestination}</strong> (Tanggal: {selectedDate})
                </p>
              </div>

              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {availableSchedules.length === 0 ? (
                  <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-2">
                    <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
                    <p className="text-xs font-bold text-amber-900">
                      Tidak ada kapal khusus pada rute tersebut saat ini. Menampilkan kapal alternatif:
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedSchedule(allSchedules[0])}
                      className="text-xs font-bold text-sky-700 underline"
                    >
                      Pilih Kapal Armada Utama ({allSchedules[0]?.vesselName})
                    </button>
                  </div>
                ) : (
                  availableSchedules.map((sch) => {
                    const isSelected = activeSch?.id === sch.id;
                    return (
                      <div
                        key={sch.id}
                        onClick={() => setSelectedSchedule(sch)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20 shadow-sm'
                            : 'border-slate-200 hover:border-sky-300 bg-white'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-extrabold uppercase bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md">
                              {sch.vesselType}
                            </span>
                            <span className="font-extrabold text-slate-900 text-sm">{sch.vesselName}</span>
                          </div>
                          <div className="text-xs text-slate-600 flex items-center space-x-3">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5 text-sky-600" />
                              <strong>{sch.departureTime} WITA</strong> (Tiba: {sch.estimatedArrivalTime} WITA)
                            </span>
                            <span>• Kuota: {sch.maxPassengers - sch.bookedPassengers} Kursi Tersedia</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
                          <div className="text-left sm:text-right">
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Tarif Penumpang</div>
                            <div className="text-sm font-black text-sky-700">
                              Rp {sch.tariffPassenger.toLocaleString('id-ID')}
                            </div>
                          </div>

                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                              isSelected ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-3 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="py-2.5 px-6 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5"
                >
                  <span>Lanjut: Isi Manifest</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: PILIH JUMLAH PENUMPANG, KENDARAAN & MANIFEST ================= */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>Langkah 4: Pilih Jumlah Penumpang, Kendaraan & Manifest KTP</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Isi data penumpang sesuai identitas resmi KTP/SIM untuk manifest keselamatan pelayaran Syahbandar.
                </p>
              </div>

              {/* Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Penumpang Dewasa</span>
                    <span className="text-[10px] text-slate-500">Rp {activeSch?.tariffPassenger.toLocaleString('id-ID')} / orang</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={passengersCount <= 1}
                      onClick={() => setPassengersCount((p) => Math.max(1, p - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-sm disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-sm w-4 text-center">{passengersCount}</span>
                    <button
                      type="button"
                      disabled={passengersCount >= 10}
                      onClick={() => setPassengersCount((p) => p + 1)}
                      className="w-7 h-7 rounded-lg bg-sky-600 text-white font-bold text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Sepeda Motor</span>
                    <span className="text-[10px] text-slate-500">Rp {activeSch?.tariffMotorbike.toLocaleString('id-ID')} / unit</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={motorbikesCount <= 0}
                      onClick={() => setMotorbikesCount((m) => Math.max(0, m - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-sm disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-sm w-4 text-center">{motorbikesCount}</span>
                    <button
                      type="button"
                      disabled={motorbikesCount >= 5}
                      onClick={() => setMotorbikesCount((m) => m + 1)}
                      className="w-7 h-7 rounded-lg bg-sky-600 text-white font-bold text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Mobil / Roda 4</span>
                    <span className="text-[10px] text-slate-500">Rp {activeSch?.tariffCar.toLocaleString('id-ID')} / unit</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={carsCount <= 0}
                      onClick={() => setCarsCount((c) => Math.max(0, c - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-sm disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-sm w-4 text-center">{carsCount}</span>
                    <button
                      type="button"
                      disabled={carsCount >= 2}
                      onClick={() => setCarsCount((c) => c + 1)}
                      className="w-7 h-7 rounded-lg bg-sky-600 text-white font-bold text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Manifest Passenger Data */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-800 block">Daftar Manifest Penumpang (Sesuai KTP):</span>
                {passengersList.map((pax, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <input
                      type="text"
                      value={pax.name}
                      onChange={(e) => handleUpdatePassenger(idx, 'name', e.target.value)}
                      placeholder={`Nama Penumpang ${idx + 1}`}
                      className="p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium outline-none"
                    />
                    <input
                      type="text"
                      value={pax.idNumber}
                      onChange={(e) => handleUpdatePassenger(idx, 'idNumber', e.target.value)}
                      placeholder="NIK KTP / No Paspor"
                      className="p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium outline-none"
                    />
                  </div>
                ))}
              </div>

              {/* Vehicle detail if vehicle selected */}
              {(motorbikesCount > 0 || carsCount > 0) && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-amber-900 block">Data Kendaraan:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      placeholder="Nomor Plat Polisi (e.g. KT 1234 ABC)"
                      className="p-2 bg-white border border-amber-300 rounded-lg text-xs font-medium"
                    />
                    <input
                      type="text"
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      placeholder="Jenis / Merk Kendaraan"
                      className="p-2 bg-white border border-amber-300 rounded-lg text-xs font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Ganti Kapal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="py-2.5 px-6 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5"
                >
                  <span>Lanjut: Pilih Metode Pembayaran</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 5: PEMBAYARAN INTERAKTIF & PELUNASAN ================= */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-sky-600" />
                  <span>Langkah 5: Pilih Metode Pembayaran & Selesaikan Pelunasan</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Selesaikan pembayaran untuk memvalidasi pemesanan dan menerbitkan E-Ticket & QR Code Boarding Pass.
                </p>
              </div>

              {/* Price Breakdown Card */}
              <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div>
                    <div className="font-extrabold text-sky-300 text-sm">{activeSch?.vesselName}</div>
                    <div className="text-xs text-slate-300">
                      {activeSch?.originDockName} ➔ {activeSch?.destinationDockName}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">TOTAL TAGIHAN</span>
                    <span className="font-black text-xl text-amber-300">
                      Rp {grandTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
                  <div>
                    <span>Tarif Penumpang:</span>
                    <div className="font-bold text-white">Rp {(passengersCount * (activeSch?.tariffPassenger || 0)).toLocaleString('id-ID')}</div>
                  </div>
                  {(motorbikesCount > 0 || carsCount > 0) && (
                    <div>
                      <span>Tarif Kendaraan:</span>
                      <div className="font-bold text-white">
                        Rp {(motorbikesCount * (activeSch?.tariffMotorbike || 0) + carsCount * (activeSch?.tariffCar || 0)).toLocaleString('id-ID')}
                      </div>
                    </div>
                  )}
                  <div>
                    <span>Asuransi Jasa Raharja:</span>
                    <div className="font-bold text-emerald-400">Rp {insuranceFee.toLocaleString('id-ID')}</div>
                  </div>
                  <div>
                    <span>Pas Masuk Pelabuhan:</span>
                    <div className="font-bold text-white">Rp {portServiceFee.toLocaleString('id-ID')}</div>
                  </div>
                </div>
              </div>

              {/* 4 Payment Methods Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800">Pilih Opsi Pembayaran Resmi:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethodType('QR')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentMethodType === 'QR'
                        ? 'border-sky-500 bg-sky-50 text-sky-950 ring-2 ring-sky-500/20 font-bold shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-1.5">
                      <QrIcon className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold">QRIS / QR Pay</div>
                    <div className="text-[10px] text-slate-500">GoPay, OVO, BCA, Dana</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethodType('VA')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentMethodType === 'VA'
                        ? 'border-sky-500 bg-sky-50 text-sky-950 ring-2 ring-sky-500/20 font-bold shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-1.5">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold">Virtual Account</div>
                    <div className="text-[10px] text-slate-500">BCA, Mandiri, BRI, BNI</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethodType('TRANSFER')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentMethodType === 'TRANSFER'
                        ? 'border-sky-500 bg-sky-50 text-sky-950 ring-2 ring-sky-500/20 font-bold shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1.5">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold">Transfer Bank</div>
                    <div className="text-[10px] text-slate-500">Rekening Resmi PT KapalKu</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethodType('CASH')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentMethodType === 'CASH'
                        ? 'border-sky-500 bg-sky-50 text-sky-950 ring-2 ring-sky-500/20 font-bold shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-1.5">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold">Tunai / Cash Loket</div>
                    <div className="text-[10px] text-slate-500">Bayar di Kasir Pelabuhan</div>
                  </button>
                </div>
              </div>

              {/* Dynamic Interactive Payment Display Box */}
              <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                {/* 1. QRIS Payment */}
                {paymentMethodType === 'QR' && (
                  <div className="space-y-4 text-center sm:text-left sm:flex sm:items-center sm:space-x-6">
                    <div className="bg-white p-3 rounded-2xl border-2 border-slate-300 inline-block shadow-sm mx-auto shrink-0">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=00020101021226580016ID.KAPALKU.MERCHANT0118936000021000000001520458125303360540${grandTotal}5802ID5914KAPALKU_PAYMENT6009JAKARTA6304`}
                        alt="QRIS QR Code"
                        className="w-40 h-40 object-contain mx-auto"
                      />
                      <div className="text-[9px] font-extrabold text-slate-500 tracking-wider mt-1 text-center">
                        QRIS STANDAR PEMBAYARAN NASIONAL
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-700">
                      <div className="font-extrabold text-slate-900 text-sm">
                        Scan QRIS dengan Aplikasi Perbankan / E-Wallet Anda
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Buka aplikasi <strong>BCA mobile, Livin' by Mandiri, BRImo, BNI Mobile, GoPay, OVO, Dana, ShopeePay</strong>, lalu scan kode QR di samping.
                      </p>
                      <div className="p-2.5 bg-sky-100/70 border border-sky-200 rounded-xl text-sky-900 text-[11px] font-medium">
                        💡 Nominal Pembayaran: <strong>Rp {grandTotal.toLocaleString('id-ID')}</strong> (Tepat). E-ticket langsung terbit otomatis setelah tombol pelunasan ditekan.
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Virtual Account */}
                {paymentMethodType === 'VA' && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-700">Pilih Bank Virtual Account:</span>
                      {['BCA', 'Mandiri', 'BRI', 'BNI'].map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => setSelectedBank(bank)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                            selectedBank === bank
                              ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {bank}
                        </button>
                      ))}
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Nomor Virtual Account ({selectedBank}):</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(vaNumber, 'va')}
                          className="text-sky-600 hover:text-sky-800 text-[11px] font-bold flex items-center space-x-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedText === 'va' ? 'Tersalin!' : 'Salin Nomor VA'}</span>
                        </button>
                      </div>
                      <div className="font-mono font-black text-lg text-slate-900 tracking-wider">{vaNumber}</div>
                      <div className="text-[11px] text-slate-500">
                        Atas Nama: <strong>KAPALKU {userName.toUpperCase()}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Bank Transfer Manual */}
                {paymentMethodType === 'TRANSFER' && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-700">Pilih Rekening Tujuan:</span>
                      {['BCA', 'Mandiri', 'BRI', 'BNI'].map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => setSelectedBank(bank)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                            selectedBank === bank
                              ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {bank}
                        </button>
                      ))}
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Nomor Rekening Bank {selectedBank}:</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(bankAccount, 'rek')}
                          className="text-sky-600 hover:text-sky-800 text-[11px] font-bold flex items-center space-x-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedText === 'rek' ? 'Tersalin!' : 'Salin Rekening'}</span>
                        </button>
                      </div>
                      <div className="font-mono font-black text-lg text-slate-900 tracking-wider">{bankAccount}</div>
                      <div className="text-[11px] text-slate-500">
                        Atas Nama: <strong>PT KAPALKU MARITIM NUSANTARA</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Cash / Loket */}
                {paymentMethodType === 'CASH' && (
                  <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900">Kode Pembayaran Loket Pelabuhan:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(cashCode, 'cash')}
                        className="text-amber-800 text-[11px] font-bold flex items-center space-x-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedText === 'cash' ? 'Tersalin!' : 'Salin Kode'}</span>
                      </button>
                    </div>
                    <div className="font-mono font-black text-lg text-amber-800 tracking-wider">{cashCode}</div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Tunjukkan kode ini kepada kasir di loket dermaga keberangkatan. Pembayaran tunai harus diselesaikan paling lambat 30 menit sebelum jam keberangkatan.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Payment Action Button */}
              <div className="pt-3 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Ubah Data</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handleProcessPaymentAndUnlockTicket}
                  className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center space-x-2 disabled:opacity-60 cursor-pointer active:scale-[0.99] transition-all"
                >
                  {isProcessingPayment ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 text-emerald-200" />
                      <span>Selesaikan Pembayaran & Dapatkan E-Ticket</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 6: E-TICKET RESMI & QR CODE BOARDING PASS ================= */}
          {currentStep === 6 && createdReservation && (
            <div className="space-y-5 animate-in zoom-in-95 duration-200">
              {/* Success Badge */}
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Check className="w-7 h-7" />
                </div>
                <div className="inline-flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full">
                  <span>PEMBAYARAN LUNAS & TIKET RESMI DITERBITKAN</span>
                </div>
                <h4 className="text-lg font-black text-slate-900">E-Ticket & Boarding Pass KapalKu</h4>
                <p className="text-xs text-slate-500">
                  Tunjukkan barcode QR Code ini ke petugas gerbang keberangkatan dermaga sebelum menaiki kapal.
                </p>
              </div>

              {/* Digital Boarding Pass Ticket */}
              <div className="bg-white rounded-3xl border-2 border-sky-700 shadow-xl overflow-hidden relative">
                {/* Ticket Top Header Banner */}
                <div className="bg-[#0F2C59] text-white p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Ship className="w-5 h-5 text-sky-400" />
                    <div>
                      <div className="font-extrabold text-sm">{createdReservation.vesselName}</div>
                      <div className="text-[10px] text-sky-200">KAPALKU DIGITAL BOARDING PASS</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-300 uppercase font-bold">Pintu Masuk (Gate)</div>
                    <div className="font-mono font-black text-amber-300 text-sm">
                      {createdReservation.gateNumber || 'GATE 1A'}
                    </div>
                  </div>
                </div>

                {/* Ticket Body with Route & QR */}
                <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Left Info Details */}
                  <div className="sm:col-span-8 space-y-2.5">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Kode Booking:</span>
                        <span className="font-mono font-black text-sky-700 text-sm">{createdReservation.bookingCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nama Penumpang Utama:</span>
                        <span className="font-bold text-slate-900">{createdReservation.userName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Manifest:</span>
                        <span className="font-bold text-slate-900">
                          {createdReservation.passengersCount} Orang {createdReservation.motorbikesCount > 0 ? `+ ${createdReservation.motorbikesCount} Motor` : ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Rute Pelayaran:</span>
                        <span className="font-bold text-slate-900 truncate">
                          {createdReservation.originDockName} ➔ {createdReservation.destinationDockName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Waktu Berangkat:</span>
                        <span className="font-bold text-slate-900">
                          {createdReservation.travelDate} ({createdReservation.departureTime})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Metode & Status:</span>
                        <span className="font-bold text-emerald-700 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>LUNAS ({createdReservation.paymentMethod || 'QRIS Terpadu'})</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status Boarding Gate:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            createdReservation.checkInStatus === 'Sudah Check-In (Boarded)'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {createdReservation.checkInStatus || 'Belum Check-In'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right High-Res Scannable QR Code */}
                  <div className="sm:col-span-4 text-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-300 inline-block shadow-sm">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${createdReservation.bookingCode}`}
                        alt="QR Code Boarding Pass"
                        className="w-28 h-28 mx-auto"
                      />
                    </div>
                    <div className="font-mono text-[11px] font-black text-slate-800 mt-1">
                      {createdReservation.bookingCode}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Scan di Pintu Gate</div>
                  </div>
                </div>

                {/* Simulated Scan Test Area */}
                <div className="bg-sky-50 p-3 border-t border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                  <span className="text-sky-900 font-medium text-[11px]">
                    🧪 <strong>Uji Pemindaian Gate:</strong> Tekan tombol untuk menguji pemindaian QR Code di pintu dermaga.
                  </span>
                  <button
                    type="button"
                    disabled={isScanning || createdReservation.checkInStatus === 'Sudah Check-In (Boarded)'}
                    onClick={() => handleSimulateScan(createdReservation.bookingCode)}
                    className="py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1 disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <ScanLine className="w-3.5 h-3.5" />
                    <span>
                      {createdReservation.checkInStatus === 'Sudah Check-In (Boarded)'
                        ? '✅ Sudah Di-scan'
                        : isScanning
                        ? 'Memindai...'
                        : 'Simulasi Scan QR'}
                    </span>
                  </button>
                </div>
              </div>

              {simulatedScanResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{simulatedScanResult}</span>
                </div>
              )}

              {/* Final Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-between">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Cetak / Simpan PDF</span>
                </button>

                <div className="flex flex-col sm:flex-row gap-2">
                  {onTrackVessel && (
                    <button
                      type="button"
                      onClick={() => {
                        onTrackVessel(createdReservation.vesselName);
                        onClose();
                      }}
                      className="py-2.5 px-5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-black rounded-xl shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
                    >
                      <Ship className="w-4 h-4 text-sky-600" />
                      <span>Lacak Kapal di Live Map</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onSuccessViewTickets}
                    className="py-2.5 px-6 bg-sky-600 hover:bg-sky-700 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>Buka di Menu Tiket Saya</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
