import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { Reservation, User, Schedule } from '../../types';
import { api } from '../../lib/api';
import {
  ScanLine,
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  QrCode,
  Ship,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  Volume2,
  RefreshCw,
  Ticket,
  ChevronRight,
  Car,
  FileCheck,
  Zap,
  ZapOff,
  SwitchCamera,
  Info,
  ExternalLink,
  Lock,
  Share2,
} from 'lucide-react';

interface OfficerScannerPageProps {
  currentUser: User | null;
  reservations: Reservation[];
  schedules: Schedule[];
  onRefreshData: () => void;
  onOpenRoleLinks?: () => void;
}

export const OfficerScannerPage: React.FC<OfficerScannerPageProps> = ({
  currentUser,
  reservations,
  schedules,
  onRefreshData,
  onOpenRoleLinks,
}) => {
  const [scanInput, setScanInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [lastDetectedCode, setLastDetectedCode] = useState<string | null>(null);
  const [detectionFlash, setDetectionFlash] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    status: 'VALID' | 'ALREADY_CHECKED_IN' | 'UNPAID' | 'CANCELLED' | 'NOT_FOUND';
    reservation?: Reservation;
    message: string;
  } | null>(null);

  const [recentScans, setRecentScans] = useState<
    Array<{
      code: string;
      name: string;
      vessel: string;
      status: string;
      time: string;
      success: boolean;
    }>
  >([]);

  // Check browser permissions query if supported
  useEffect(() => {
    if (navigator.permissions && (navigator.permissions as any).query) {
      (navigator.permissions as any)
        .query({ name: 'camera' as any })
        .then((res: any) => {
          setCameraPermissionStatus(res.state || 'unknown');
          res.onchange = () => {
            setCameraPermissionStatus(res.state || 'unknown');
          };
        })
        .catch(() => {
          setCameraPermissionStatus('unknown');
        });
    }
  }, []);

  // Sound Synth via Web Audio API
  const playSound = (type: 'success' | 'warning' | 'error') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
        if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(330, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
        if (navigator.vibrate) navigator.vibrate(150);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.45);
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
    } catch (e) {
      // Audio not permitted
    }
  };

  const handleValidateCode = useCallback(async (codeToScan: string) => {
    if (!codeToScan.trim()) return;
    setIsValidating(true);
    try {
      const res = await api.validateTicket(codeToScan.trim().toUpperCase());
      setValidationResult(res);

      if (res.status === 'VALID') {
        playSound('success');
      } else if (res.status === 'ALREADY_CHECKED_IN') {
        playSound('warning');
      } else {
        playSound('error');
      }
    } catch (err: any) {
      setValidationResult({
        valid: false,
        status: 'NOT_FOUND',
        message: err.message || 'Gagal memproses validasi tiket',
      });
      playSound('error');
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Parse raw text from QR/Barcode to extract clean booking code
  const extractBookingCode = (rawText: string): string => {
    const text = rawText.trim();
    // Check if matches standard KPK-XXXXXX
    const match = text.match(/KPK-[A-Z0-9_-]+/i);
    if (match) {
      return match[0].toUpperCase();
    }
    // Try JSON parsing
    try {
      const parsed = JSON.parse(text);
      if (parsed.bookingCode) return parsed.bookingCode.toUpperCase();
      if (parsed.code) return parsed.code.toUpperCase();
    } catch (e) {}
    return text.toUpperCase();
  };

  // Frame processing loop for scanning
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      scanLoopRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      scanLoopRef.current = requestAnimationFrame(processFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const now = Date.now();
    // Throttle frame decoding: check every ~150ms
    if (now - lastScanTimeRef.current > 150) {
      lastScanTimeRef.current = now;
      let detectedCode: string | null = null;

      // 1. Try native BarcodeDetector if available in browser
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'upc_a'],
          });
          barcodeDetector
            .detect(canvas)
            .then((barcodes: any[]) => {
              if (barcodes && barcodes.length > 0) {
                const raw = barcodes[0].rawValue;
                handleCodeDetected(raw);
              }
            })
            .catch(() => {});
        } catch (e) {}
      }

      // 2. jsQR software fallback (always active for high precision QR parsing)
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          detectedCode = code.data;
        }
      } catch (e) {}

      if (detectedCode) {
        handleCodeDetected(detectedCode);
      }
    }

    scanLoopRef.current = requestAnimationFrame(processFrame);
  }, [handleValidateCode]);

  const handleCodeDetected = (rawCode: string) => {
    const code = extractBookingCode(rawCode);
    if (!code) return;

    // Cooldown logic: do not scan the same code within 3 seconds
    if (code === lastDetectedCode && Date.now() - lastScanTimeRef.current < 3000) {
      return;
    }

    setLastDetectedCode(code);
    setScanInput(code);
    setDetectionFlash(true);
    setTimeout(() => setDetectionFlash(false), 800);

    handleValidateCode(code);
  };

  // Start Camera Stream
  const startCamera = async (deviceId?: string, mode?: 'environment' | 'user') => {
    setCameraError(null);
    setIsDetecting(true);

    // Stop existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Akses kamera tidak didukung pada peramban web ini.');
      }

      const activeMode = mode || facingMode;
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: { ideal: activeMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
        audio: false,
      };

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Fallback with simplest constraint
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = mediaStream;
      setCameraPermissionStatus('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);

      // Check torch capability
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        setHasTorch(!!capabilities.torch);
      }

      // Enumerate camera devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setAvailableCameras(videoDevices);
      } catch (e) {}

      // Start scan loop
      if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = requestAnimationFrame(processFrame);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraPermissionStatus('denied');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Izin akses kamera diblokir oleh browser. Silakan izinkan akses kamera pada ikon gembok/kamera di bilah alamat browser.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Perangkat kamera tidak ditemukan pada perangkat Anda.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain lalu coba lagi.');
      } else {
        setCameraError(err.message || 'Tidak dapat memulai pemindai kamera.');
      }
      setIsCameraActive(false);
    } finally {
      setIsDetecting(false);
    }
  };

  const stopCamera = () => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setIsTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch toggle not supported', e);
    }
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(undefined, nextMode);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleConfirmBoarding = async () => {
    if (!validationResult?.reservation) return;
    const ticketCode = validationResult.reservation.bookingCode;
    const officerName = currentUser?.name || 'Petugas Gate Dermaga';

    try {
      const res = await api.checkInTicket(ticketCode, officerName);
      playSound('success');

      // Update recent scans list
      const newScanLog = {
        code: ticketCode,
        name: res.reservation.userName,
        vessel: res.reservation.vesselName,
        status: 'Boarding Disetujui',
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        success: true,
      };
      setRecentScans([newScanLog, ...recentScans.slice(0, 9)]);

      setValidationResult({
        valid: true,
        status: 'ALREADY_CHECKED_IN',
        reservation: res.reservation,
        message: `✅ SUKSES! Penumpang ${res.reservation.userName} telah diverifikasi dan diizinkan naik ke kapal.`,
      });

      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Gagal melakukan check-in');
    }
  };

  // Quick tickets from state available for test scanning
  const unboardedTickets = reservations.filter(
    (r) => r.paymentStatus === 'Lunas' && r.checkInStatus !== 'Sudah Check-In (Boarded)'
  );
  const boardedTickets = reservations.filter(
    (r) => r.checkInStatus === 'Sudah Check-In (Boarded)'
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Officer Banner */}
      <div className="bg-gradient-to-r from-[#0B2447] via-[#19376D] to-[#1F6E8C] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-cyan-500/30 border border-cyan-400/40 rounded-full text-cyan-200 text-xs font-bold mb-2">
              <ScanLine className="w-3.5 h-3.5 text-cyan-300" />
              <span>TERMINAL PETUGAS GATE DERMAGA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pemindai Kamera & Verifikasi Tiket Boarding
            </h1>
            <p className="text-xs sm:text-sm text-cyan-100/90 mt-1 max-w-2xl">
              Pindai QR Code atau Barcode pada boarding pass penumpang menggunakan kamera perangkat secara instan untuk verifikasi manifes dan otorisasi gate.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            {onOpenRoleLinks && (
              <button
                type="button"
                onClick={onOpenRoleLinks}
                className="px-3 py-2 bg-cyan-500/30 hover:bg-cyan-500/50 border border-cyan-400/40 text-cyan-100 hover:text-white rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer shadow-sm"
                title="Lihat Link Akses Role Terpisah"
              >
                <Share2 className="w-4 h-4 text-cyan-300" />
                <span>Link Akses 3 Role</span>
              </button>
            )}

            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3.5 rounded-2xl flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500 text-white flex items-center justify-center font-bold text-base shadow-md">
                OFF
              </div>
              <div>
                <div className="text-xs font-bold text-white">{currentUser?.name || 'Petugas Jaga'}</div>
                <div className="text-[10px] text-cyan-200 font-mono">Status: On-Duty (Gate Boarding)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scanner & Input (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Scanner Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-cyan-50 text-cyan-700 rounded-xl">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Pemindai Kamera Aktif</h3>
                  <p className="text-xs text-slate-500">
                    {isCameraActive ? 'Kamera aktif mendeteksi barcode/QR secara real-time' : 'Arahkan kamera ke tiket atau ketik kode booking'}
                  </p>
                </div>
              </div>

              {/* Camera Action Buttons */}
              <div className="flex items-center space-x-2">
                {isCameraActive && (
                  <>
                    {hasTorch && (
                      <button
                        onClick={toggleTorch}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isTorchOn ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        title="Nyalakan/Matikan Lampu Kilat (Senter)"
                      >
                        {isTorchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      onClick={toggleFacingMode}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="Ganti Kamera Depan / Belakang"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                  </>
                )}

                <button
                  onClick={isCameraActive ? stopCamera : () => startCamera()}
                  disabled={isDetecting}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    isCameraActive
                      ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                      : 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-md shadow-cyan-600/30'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>{isCameraActive ? 'Tutup Kamera' : 'Buka & Izinkan Kamera'}</span>
                </button>
              </div>
            </div>

            {/* Camera Viewfinder */}
            {isCameraActive ? (
              <div className={`relative aspect-video sm:aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border-2 transition-all shadow-inner flex items-center justify-center ${
                detectionFlash ? 'border-emerald-400 ring-4 ring-emerald-400/50' : 'border-cyan-500'
              }`}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Laser animation overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                  <div className={`w-56 sm:w-64 h-56 sm:h-64 border-2 rounded-2xl relative flex items-center justify-center transition-all ${
                    detectionFlash
                      ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.7)]'
                      : 'border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                  }`}>
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />

                    {/* Scanning moving line */}
                    {!detectionFlash && (
                      <div className="w-full h-0.5 bg-cyan-400 shadow-[0_0_12px_#06b6d4] animate-bounce" />
                    )}

                    {detectionFlash && (
                      <div className="text-emerald-300 font-extrabold text-sm sm:text-base flex items-center space-x-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-emerald-400/60 shadow-lg">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>KODE TERDETEKSI!</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-cyan-200 font-semibold bg-slate-900/80 px-3 py-1 rounded-full mt-4 backdrop-blur-sm flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Posisikan QR Code Tiket di dalam kotak (Otomatis Terbaca)</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Kamera Belum Aktif</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                    Klik tombol <strong>"Buka & Izinkan Kamera"</strong> untuk mengaktifkan pemindaian QR Code dan Barcode tiket penumpang secara otomatis.
                  </p>
                </div>
                <button
                  onClick={() => startCamera()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-600/30 inline-flex items-center space-x-1.5 cursor-pointer transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Aktifkan Pemindai Kamera</span>
                </button>
              </div>
            )}

            {/* Camera Error / Permission Instructions */}
            {cameraError && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs space-y-2">
                <div className="flex items-start space-x-2 font-bold text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Petunjuk Akses Kamera:</span>
                </div>
                <p className="leading-relaxed text-amber-800">{cameraError}</p>
                <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200 text-[11px] space-y-1 text-slate-700">
                  <div className="font-semibold text-slate-800">Cara mengizinkan kamera di browser:</div>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-600">
                    <li>Klik ikon <strong>Gembok 🔒</strong> atau <strong>Kamera 📷</strong> di bilah alamat browser (URL bar).</li>
                    <li>Ubah setelan <strong>Kamera</strong> menjadi <strong>Izinkan (Allow)</strong>.</li>
                    <li>Klik tombol <strong>Coba Buka Kamera Lagi</strong> di bawah.</li>
                  </ol>
                </div>
                <button
                  onClick={() => startCamera()}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
                >
                  Coba Buka Kamera Lagi
                </button>
              </div>
            )}

            {/* Manual Code Input Barcode Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleValidateCode(scanInput);
              }}
              className="space-y-3"
            >
              <div className="relative">
                <ScanLine className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value.toUpperCase())}
                  placeholder="Atau ketik Kode Tiket Manual (Contoh: KPK-892110)"
                  className="w-full pl-11 pr-24 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm sm:text-base font-mono font-bold tracking-wider text-slate-900 focus:bg-white focus:border-cyan-500 outline-none uppercase"
                />
                <button
                  type="submit"
                  disabled={isValidating || !scanInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  {isValidating ? 'Memeriksa...' : 'Validasi'}
                </button>
              </div>
            </form>

            {/* Quick Demo Scan Chips */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Klik Cepat Tiket Demo untuk Uji Coba Scan:</span>
                <span className="text-[10px] text-cyan-600 font-mono">{unboardedTickets.length} Siap Naik</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {unboardedTickets.slice(0, 4).map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => {
                      setScanInput(ticket.bookingCode);
                      handleValidateCode(ticket.bookingCode);
                    }}
                    className="bg-slate-100 hover:bg-cyan-50 hover:border-cyan-300 border border-slate-200 px-3 py-1.5 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-1 font-mono text-xs font-bold text-cyan-700 group-hover:text-cyan-800">
                      <Ticket className="w-3 h-3" />
                      <span>{ticket.bookingCode}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {ticket.userName} ({ticket.vesselName})
                    </div>
                  </button>
                ))}

                {boardedTickets.slice(0, 2).map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => {
                      setScanInput(ticket.bookingCode);
                      handleValidateCode(ticket.bookingCode);
                    }}
                    className="bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl text-left transition-all cursor-pointer"
                    title="Uji coba tiket yang sudah pernah boarding"
                  >
                    <div className="font-mono text-xs font-bold text-amber-800">
                      {ticket.bookingCode} (Sudah Boarded)
                    </div>
                    <div className="text-[10px] text-amber-700">{ticket.userName}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Validation Result Card & Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {validationResult ? (
            <div
              className={`rounded-3xl border p-6 space-y-5 shadow-lg transition-all animate-in zoom-in-95 duration-200 ${
                validationResult.status === 'VALID'
                  ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/30'
                  : validationResult.status === 'ALREADY_CHECKED_IN'
                  ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30'
                  : 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/30'
              }`}
            >
              {/* Status Header Badge */}
              <div className="flex items-center space-x-3">
                {validationResult.status === 'VALID' && (
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                )}
                {validationResult.status === 'ALREADY_CHECKED_IN' && (
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                )}
                {validationResult.status !== 'VALID' && validationResult.status !== 'ALREADY_CHECKED_IN' && (
                  <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md">
                    <XCircle className="w-7 h-7" />
                  </div>
                )}

                <div>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      validationResult.status === 'VALID'
                        ? 'bg-emerald-200 text-emerald-900'
                        : validationResult.status === 'ALREADY_CHECKED_IN'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    {validationResult.status === 'VALID' && 'TIKET SAH & VALID'}
                    {validationResult.status === 'ALREADY_CHECKED_IN' && 'PERINGATAN: SUDAH BOARDING'}
                    {validationResult.status === 'UNPAID' && 'TIKET BELUM LUNAS'}
                    {validationResult.status === 'CANCELLED' && 'TIKET DIBATALKAN'}
                    {validationResult.status === 'NOT_FOUND' && 'TIKET TIDAK DITEMUKAN'}
                  </span>
                  <div className="font-bold text-slate-900 text-sm sm:text-base mt-0.5">
                    {validationResult.reservation?.bookingCode || 'KODE TIDAK DIKENAL'}
                  </div>
                </div>
              </div>

              {/* Message */}
              <p className="text-xs text-slate-700 bg-white/70 p-3 rounded-2xl border border-slate-200/60 leading-relaxed">
                {validationResult.message}
              </p>

              {/* Reservation Details */}
              {validationResult.reservation && (
                <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Nama Penumpang</span>
                    <span className="font-bold text-slate-900">{validationResult.reservation.userName}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Armada Kapal</span>
                    <span className="font-bold text-indigo-700">
                      {validationResult.reservation.vesselName} ({validationResult.reservation.vesselType})
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Rute Pelayaran</span>
                    <span className="font-semibold text-slate-800 text-right">
                      {validationResult.reservation.originDockName} ➔ {validationResult.reservation.destinationDockName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Jadwal Keberangkatan</span>
                    <span className="font-bold text-slate-900">
                      {validationResult.reservation.departureTime} ({validationResult.reservation.travelDate})
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Jumlah Muatan</span>
                    <span className="font-bold text-slate-900">
                      {validationResult.reservation.passengersCount} Orang
                      {(validationResult.reservation.motorbikesCount || 0) > 0 && ` + ${validationResult.reservation.motorbikesCount} Motor`}
                      {(validationResult.reservation.carsCount || 0) > 0 && ` + ${validationResult.reservation.carsCount} Mobil`}
                    </span>
                  </div>

                  {validationResult.reservation.vehiclePlate && (
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Plat Kendaraan</span>
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {validationResult.reservation.vehiclePlate}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Status Pembayaran</span>
                    <span className="font-extrabold text-emerald-600">
                      LUNAS (Rp {validationResult.reservation.totalPrice.toLocaleString('id-ID')})
                    </span>
                  </div>
                </div>
              )}

              {/* Action: Confirm Boarding */}
              {validationResult.status === 'VALID' && (
                <button
                  onClick={handleConfirmBoarding}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 text-sm sm:text-base transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <FileCheck className="w-5 h-5" />
                  <span>IZINKAN NAIK KAPAL (BOARDING)</span>
                </button>
              )}

              <button
                onClick={() => {
                  setValidationResult(null);
                  setScanInput('');
                  setLastDetectedCode(null);
                }}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold py-2.5 rounded-xl cursor-pointer"
              >
                Pindai Tiket Lainnya
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-3 flex flex-col items-center justify-center min-h-[320px]">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <ScanLine className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">Menunggu Pemindaian Tiket</h4>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Arahkan kamera ke QR Code / Barcode tiket penumpang atau ketik kode booking untuk menampilkan status manifes dan otorisasi boarding.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Scans Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-cyan-600" />
            <h3 className="font-bold text-slate-900 text-base">Riwayat Scan & Boarding Hari Ini</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">{recentScans.length} Aktivitas Baru</span>
        </div>

        {recentScans.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Belum ada aktivitas scan pada sesi ini. Pindai tiket pertama Anda di atas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Kode Tiket</th>
                  <th className="py-2.5 px-3">Nama Penumpang</th>
                  <th className="py-2.5 px-3">Kapal</th>
                  <th className="py-2.5 px-3">Status Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {recentScans.map((scan, i) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-mono text-slate-500">{scan.time}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-cyan-700">{scan.code}</td>
                    <td className="py-2.5 px-3 text-slate-900 font-semibold">{scan.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{scan.vessel}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{scan.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
