import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Vessel, Dock, RouteItem, Schedule, Reservation } from '../../types';
import {
  getMaritimeRouteWaypoints,
  interpolatePositionOnPath,
  haversineDistance,
  SeaWaypoint,
} from '../../lib/maritimeRoutes';
import {
  Ship,
  MapPin,
  Navigation,
  Clock,
  Gauge,
  Compass,
  CheckCircle2,
  Ticket,
  Waves,
  Lock,
  Search,
  Calendar,
  Radio,
  Anchor,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface VesselTrackerMapProps {
  vessels: Vessel[];
  docks: Dock[];
  routes: RouteItem[];
  schedules?: Schedule[];
  reservations?: Reservation[];
  initialVesselName?: string;
  onOpenBookingWizard?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const VesselTrackerMap: React.FC<VesselTrackerMapProps> = ({
  vessels,
  docks,
  routes,
  reservations = [],
  initialVesselName,
  onOpenBookingWizard,
  onNavigateTab,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Active user booked reservations (valid and not cancelled)
  const activeBookings = reservations.filter(
    (r) => r.reservationStatus !== 'Dibatalkan'
  );

  // Selected reservation
  const [selectedBookingCode, setSelectedBookingCode] = useState<string>(() => {
    if (activeBookings.length > 0) {
      if (initialVesselName) {
        const match = activeBookings.find(
          (b) =>
            b.vesselName.toLowerCase().includes(initialVesselName.toLowerCase()) ||
            initialVesselName.toLowerCase().includes(b.vesselName.toLowerCase())
        );
        if (match) return match.bookingCode;
      }
      return activeBookings[0].bookingCode;
    }
    return '';
  });

  // Current active booking object
  const currentBooking =
    activeBookings.find((b) => b.bookingCode === selectedBookingCode) ||
    activeBookings[0] ||
    null;

  // Selected vessel matched from current active booking
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(() => {
    if (currentBooking) {
      const match = vessels.find(
        (v) =>
          v.name.toLowerCase().includes(currentBooking.vesselName.toLowerCase()) ||
          currentBooking.vesselName.toLowerCase().includes(v.name.toLowerCase())
      );
      if (match) return match;
    }
    return null;
  });

  // Sync vessel when selected booking changes
  useEffect(() => {
    if (currentBooking) {
      const match = vessels.find(
        (v) =>
          v.name.toLowerCase().includes(currentBooking.vesselName.toLowerCase()) ||
          currentBooking.vesselName.toLowerCase().includes(v.name.toLowerCase())
      );
      if (match) {
        setSelectedVessel(match);
      }
    } else {
      setSelectedVessel(null);
    }
  }, [currentBooking, selectedBookingCode, vessels]);

  // Find origin and destination docks
  const originDock = currentBooking
    ? docks.find(
        (d) =>
          d.name.toLowerCase().includes(currentBooking.originDockName.toLowerCase()) ||
          currentBooking.originDockName.toLowerCase().includes(d.name.toLowerCase())
      ) || null
    : null;

  const destDock = currentBooking
    ? docks.find(
        (d) =>
          d.name.toLowerCase().includes(currentBooking.destinationDockName.toLowerCase()) ||
          currentBooking.destinationDockName.toLowerCase().includes(d.name.toLowerCase())
      ) || null
    : null;

  // Compute realistic sea lane waypoints based on origin & destination
  const maritimeWaypoints: SeaWaypoint[] = React.useMemo(() => {
    return getMaritimeRouteWaypoints(originDock, destDock);
  }, [originDock, destDock]);

  // Current realistic position & heading on the sea lane
  const vesselNavState = React.useMemo(() => {
    if (!selectedVessel || maritimeWaypoints.length < 2) {
      return {
        lat: selectedVessel?.currentLat || originDock?.lat || -1.2721,
        lng: selectedVessel?.currentLng || originDock?.lng || 116.819,
        headingDeg: selectedVessel?.headingDeg || 45,
        progressFraction: 0.45,
      };
    }

    // Determine progress fraction along the sea lane
    let progress = 0.45;
    if (selectedVessel.status === 'Bertambat') {
      progress = 0.02;
    } else if (selectedVessel.status === 'Dalam Perjalanan') {
      progress = 0.48;
    }

    const interpolated = interpolatePositionOnPath(maritimeWaypoints, progress);
    return {
      lat: interpolated.lat,
      lng: interpolated.lng,
      headingDeg: interpolated.headingDeg || selectedVessel.headingDeg || 0,
      progressFraction: progress,
    };
  }, [selectedVessel, maritimeWaypoints, originDock]);

  // Leaflet Map Initialization (ONLY if user has active ticket)
  useEffect(() => {
    if (activeBookings.length === 0) return;
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = vesselNavState.lat;
      const initialLng = vesselNavState.lng;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 11,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap & KapalKu Live AIS Radar Alur Pelayaran',
        maxZoom: 18,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeBookings.length]);

  // Render Realistic Maritime Sea Lane, Waypoint Buoys, and Vessel
  useEffect(() => {
    if (activeBookings.length === 0 || !currentBooking) return;
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    if (maritimeWaypoints.length < 2) return;

    const fullPathCoords = maritimeWaypoints.map(
      (w) => [w.lat, w.lng] as [number, number]
    );

    // 1. Draw Wide Marine Channel Glow (Koridor Alur Pelayaran Aman)
    L.polyline(fullPathCoords, {
      color: '#0284c7',
      weight: 16,
      opacity: 0.15,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(markersLayerRef.current);

    // 2. Draw Full Official Maritime Nautical Lane (Alur Pelayaran Resmi)
    L.polyline(fullPathCoords, {
      color: '#0284c7',
      weight: 3.5,
      dashArray: '6, 8',
      opacity: 0.8,
      lineCap: 'round',
    }).addTo(markersLayerRef.current);

    // 3. Draw Traveled Leg vs Remaining Leg along the realistic waypoints
    const vesselLat = vesselNavState.lat;
    const vesselLng = vesselNavState.lng;

    // Split waypoints into traveled vs remaining
    const traveledPath: [number, number][] = [[maritimeWaypoints[0].lat, maritimeWaypoints[0].lng]];
    const remainingPath: [number, number][] = [[vesselLat, vesselLng]];

    // Build segments
    let passedShip = false;
    for (let i = 0; i < maritimeWaypoints.length - 1; i++) {
      const p1 = maritimeWaypoints[i];
      const p2 = maritimeWaypoints[i + 1];

      // Approximate check if current segment contains or is before ship
      if (!passedShip) {
        traveledPath.push([p2.lat, p2.lng]);
        // If this is near current vessel
        const dToVessel = haversineDistance(p2.lat, p2.lng, vesselLat, vesselLng);
        const segLen = haversineDistance(p1.lat, p1.lng, p2.lat, p2.lng);
        if (dToVessel < segLen * 0.6 || i >= Math.floor(maritimeWaypoints.length / 2)) {
          passedShip = true;
          // Replace last point with vessel position
          traveledPath[traveledPath.length - 1] = [vesselLat, vesselLng];
        }
      } else {
        remainingPath.push([p2.lat, p2.lng]);
      }
    }

    if (remainingPath.length === 1) {
      remainingPath.push([
        maritimeWaypoints[maritimeWaypoints.length - 1].lat,
        maritimeWaypoints[maritimeWaypoints.length - 1].lng,
      ]);
    }

    // Traveled line: solid marine cyan
    L.polyline(traveledPath, {
      color: '#0284c7',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
    }).addTo(markersLayerRef.current);

    // Remaining line: high-visibility animated-style dashed line
    L.polyline(remainingPath, {
      color: '#06b6d4',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.9,
      lineCap: 'round',
    }).addTo(markersLayerRef.current);

    // 4. Render Origin Dock Marker
    if (originDock) {
      const originIcon = L.divIcon({
        className: 'origin-dock-icon',
        html: `
          <div style="background-color:#0F2C59; color:white; padding:4px; border-radius:50%; border:3px solid white; box-shadow:0 4px 12px rgba(15,44,89,0.5); font-weight:bold; width:36px; height:36px; display:flex; align-items:center; justify-content:center; font-size:16px;">
            🚩
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const originMarker = L.marker([originDock.lat, originDock.lng], {
        icon: originIcon,
      }).addTo(markersLayerRef.current);

      originMarker.bindTooltip(
        `<div style="font-size:11px; font-family:sans-serif;">
          <b style="color:#0F2C59;">🚩 Pelabuhan Keberangkatan</b><br/>
          <b>${originDock.name}</b><br/>
          <span style="color:#64748b; font-size:10px;">${originDock.province || 'Asal Tiket'}</span>
        </div>`,
        { permanent: true, direction: 'top', offset: [0, -18] }
      );
    }

    // 5. Render Destination Dock Marker
    if (destDock) {
      const destIcon = L.divIcon({
        className: 'dest-dock-icon',
        html: `
          <div style="background-color:#0284C7; color:white; padding:4px; border-radius:50%; border:3px solid white; box-shadow:0 4px 12px rgba(2,132,199,0.5); font-weight:bold; width:36px; height:36px; display:flex; align-items:center; justify-content:center; font-size:16px;">
            🏁
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const destMarker = L.marker([destDock.lat, destDock.lng], {
        icon: destIcon,
      }).addTo(markersLayerRef.current);

      destMarker.bindTooltip(
        `<div style="font-size:11px; font-family:sans-serif;">
          <b style="color:#0284C7;">🏁 Pelabuhan Tujuan</b><br/>
          <b>${destDock.name}</b><br/>
          <span style="color:#64748b; font-size:10px;">${destDock.province || 'Tujuan Akhir'}</span>
        </div>`,
        { permanent: true, direction: 'top', offset: [0, -18] }
      );
    }

    // 6. Render Intermediate Nautical Waypoints (Buoys / Koridor Maritim)
    maritimeWaypoints.forEach((wp, idx) => {
      // Skip start and end docks
      if (idx === 0 || idx === maritimeWaypoints.length - 1) return;

      const buoyIcon = L.divIcon({
        className: 'nautical-buoy-icon',
        html: `
          <div style="background-color:#0284C7; color:white; width:22px; height:22px; border-radius:50%; border:2px solid #ffffff; box-shadow:0 2px 6px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:900;">
            ⚓
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const wpMarker = L.marker([wp.lat, wp.lng], { icon: buoyIcon }).addTo(
        markersLayerRef.current!
      );

      wpMarker.bindTooltip(
        `<div style="font-size:10px; font-family:sans-serif; padding:1px;">
          <span style="color:#0284C7; font-weight:800; text-transform:uppercase;">📍 Checkpoint Maritim #${idx}</span><br/>
          <b>${wp.name}</b><br/>
          <span style="color:#64748b;">Tipe: ${wp.nauticalType || 'Alur Pelayaran'}</span>
        </div>`,
        { permanent: false, direction: 'top', offset: [0, -10] }
      );
    });

    // 7. Render Booked Vessel Marker with Sonar Wave & Heading Indicator
    if (selectedVessel) {
      const heading = vesselNavState.headingDeg;
      const vesselIconHtml = `
        <div style="position:relative; width:58px; height:58px; display:flex; align-items:center; justify-content:center;">
          <!-- Sonar Radar Ping Pulse -->
          <div style="position:absolute; inset:0; border-radius:50%; background-color:#0284c7; opacity:0.6; animation:ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          
          <!-- Direction Pointer Arrow -->
          <div style="position:absolute; top:2px; transform:rotate(${heading}deg); transform-origin:center 27px; z-index:15;">
            <div style="width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-bottom:8px solid #0284C7; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4));"></div>
          </div>

          <!-- Vessel Badge -->
          <div style="position:relative; z-index:10; background-color:#0F2C59; color:white; width:44px; height:44px; border-radius:50%; border:3px solid white; box-shadow:0 4px 18px rgba(2,132,199,0.7); display:flex; align-items:center; justify-content:center; font-size:22px;">
            🚢
          </div>
        </div>
      `;

      const shipIcon = L.divIcon({
        className: 'booked-ship-icon',
        html: vesselIconHtml,
        iconSize: [58, 58],
        iconAnchor: [29, 29],
      });

      const shipMarker = L.marker([vesselLat, vesselLng], {
        icon: shipIcon,
        zIndexOffset: 1000,
      }).addTo(markersLayerRef.current);

      shipMarker.bindTooltip(
        `
        <div style="font-family:sans-serif; padding:3px; min-width:140px;">
          <div style="font-size:9px; font-weight:800; color:#0284C7; text-transform:uppercase; letter-spacing:0.5px; display:flex; items-center; justify-between;">
            <span>📍 KAPAL TIKET ANDA</span>
          </div>
          <div style="font-size:13px; font-weight:900; color:#0F2C59; margin-top:1px;">
            ${selectedVessel.name}
          </div>
          <div style="font-size:10px; color:#10B981; font-weight:700; margin-top:2px;">
            ● ${selectedVessel.status} (${selectedVessel.speedKts} knot)
          </div>
          <div style="font-size:10px; color:#64748b; margin-top:1px;">
            🧭 Haluan: ${heading}° (${heading > 180 ? 'Barat Daya' : 'Timur Laut'})
          </div>
        </div>
        `,
        { permanent: true, direction: 'top', offset: [0, -26] }
      );
    }

    // Auto-fit bounds with comfortable padding so the entire realistic route is visible
    const bounds = L.latLngBounds(fullPathCoords);
    mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
  }, [
    activeBookings.length,
    currentBooking,
    selectedVessel,
    maritimeWaypoints,
    vesselNavState,
    originDock,
    destDock,
  ]);

  const handleCenterOnShip = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [vesselNavState.lat, vesselNavState.lng],
        13,
        { animate: true, duration: 1.2 }
      );
    }
  };

  const handleFitRoute = () => {
    if (mapInstanceRef.current && maritimeWaypoints.length > 0) {
      const bounds = L.latLngBounds(
        maritimeWaypoints.map((w) => [w.lat, w.lng] as [number, number])
      );
      mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  };

  // ================= 1. JIKA BELUM MEMESAN TIKET: JANGAN TAMPILKAN PETA/KAPAL =================
  if (activeBookings.length === 0) {
    return (
      <div className="pb-16 pt-4 max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl text-center space-y-6">
          {/* Inactive Radar Lock Icon */}
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-sky-50 animate-pulse" />
            <div className="w-20 h-20 rounded-3xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center shadow-inner relative z-10">
              <Lock className="w-9 h-9 text-slate-400" />
            </div>
          </div>

          {/* Text Information */}
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
              <Radio className="w-3.5 h-3.5 text-slate-400" />
              <span>Live Map Radar Belum Aktif</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Belum Ada Tiket yang Dipesan
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Live Map pelacakan GPS real-time hanya akan menampilkan keberadaan kapal yang tiketnya telah Anda pesan dengan jalur alur pelayaran laut yang dilalui sebenarnya. Silakan lakukan pemesanan tiket terlebih dahulu untuk mengaktifkan radar pelacakan kapal Anda.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {onOpenBookingWizard && (
              <button
                type="button"
                onClick={onOpenBookingWizard}
                className="w-full sm:w-auto py-3.5 px-7 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-sky-600/30 flex items-center justify-center space-x-2 cursor-pointer transition-all hover:scale-105"
              >
                <Search className="w-4 h-4" />
                <span>Cari Jadwal & Pesan Tiket Sekarang</span>
              </button>
            )}

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('jadwal')}
                className="w-full sm:w-auto py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center space-x-2 cursor-pointer transition-all"
              >
                <Calendar className="w-4 h-4 text-slate-600" />
                <span>Lihat Jadwal Keberangkatan</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================= 2. JIKA SUDAH MEMESAN TIKET: TAMPILKAN LIVE MAP DENGAN ALUR PELAYARAN SEBENARNYA =================
  return (
    <div className="space-y-5 pb-12">
      {/* Top Main Status Bar & Active Ticket Header */}
      <div className="bg-gradient-to-r from-[#071E3D] via-[#0F2C59] to-[#0284C7] p-5 sm:p-6 rounded-3xl text-white shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 px-3 py-1 rounded-full text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>RADAR AIS AKTIF - ALUR PELAYARAN LAUT RESMI</span>
            </div>
            <h3 className="font-black text-lg sm:text-2xl text-white flex items-center space-x-2">
              <Ship className="w-6 h-6 text-sky-300" />
              <span>{currentBooking?.vesselName || 'Kapal Pesanan Anda'}</span>
              {currentBooking?.bookingCode && (
                <span className="font-mono text-xs bg-white/20 px-2.5 py-1 rounded-lg text-amber-300 font-extrabold">
                  {currentBooking.bookingCode}
                </span>
              )}
            </h3>
          </div>

          {/* Ticket switcher if user has more than 1 active booking */}
          {activeBookings.length > 1 && (
            <div className="flex items-center space-x-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-sm">
              <span className="text-xs text-sky-200 font-bold px-2">Pilih Tiket:</span>
              <div className="flex space-x-1">
                {activeBookings.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBookingCode(b.bookingCode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedBookingCode === b.bookingCode
                        ? 'bg-white text-slate-900 shadow font-extrabold'
                        : 'text-sky-200 hover:bg-white/10'
                    }`}
                  >
                    {b.vesselName.split(' ')[0]} ({b.departureTime})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Metrics Grid */}
        {currentBooking && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm space-y-1">
              <span className="text-[10px] text-sky-200 uppercase font-bold block">Rute Perjalanan</span>
              <div className="font-black text-sm text-white truncate">
                {currentBooking.originDockName}
              </div>
              <div className="text-sky-300 text-[11px] truncate">➔ {currentBooking.destinationDockName}</div>
            </div>

            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm space-y-1">
              <span className="text-[10px] text-sky-200 uppercase font-bold block">Jadwal Keberangkatan</span>
              <div className="font-black text-sm text-white">{currentBooking.travelDate}</div>
              <div className="text-amber-300 font-bold text-[11px]">Pukul {currentBooking.departureTime}</div>
            </div>

            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm space-y-1">
              <span className="text-[10px] text-sky-200 uppercase font-bold block">Kecepatan & Haluan</span>
              <div className="font-black text-sm text-white">
                {selectedVessel ? `${selectedVessel.speedKts} knot` : '14.2 knot'}
              </div>
              <div className="text-sky-200 text-[11px]">
                {vesselNavState.headingDeg}° Haluan Laut ({vesselNavState.headingDeg > 180 ? 'Barat Daya' : 'Timur Laut'})
              </div>
            </div>

            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm space-y-1">
              <span className="text-[10px] text-sky-200 uppercase font-bold block">Status Pelayaran</span>
              <div className="font-black text-sm text-emerald-300 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{selectedVessel?.status || 'Sedang Berlayar'}</span>
              </div>
              <div className="text-sky-200 text-[11px]">
                Checkpoint: {maritimeWaypoints.length} Titik Alur Maritim
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MAP & TELEMETRY SECTION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Map Container */}
        <div className="lg:col-span-8 bg-slate-100 rounded-3xl border border-slate-200 shadow-inner overflow-hidden relative h-[500px] sm:h-[580px]">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Floating Radar Tag */}
          <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 shadow-lg text-xs space-y-1.5 max-w-[260px] sm:max-w-xs">
            <div className="font-extrabold text-slate-900 text-[11px] uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
              <span>Alur Pelayaran Kapal Anda</span>
            </div>
            <div className="text-[11px] text-slate-600 leading-snug">
              Jalur laut mengikuti koridor perairan nyata (selat, teluk, & TSS) menghindari daratan.
            </div>
            <div className="flex items-center space-x-2 pt-1 text-[10px] text-slate-500 font-bold border-t border-slate-100">
              <span className="inline-block w-3 h-1 bg-[#0284c7] rounded-sm"></span>
              <span>Sudah Dilalui</span>
              <span className="inline-block w-3 h-1 bg-[#06b6d4] border-b border-dashed border-sky-400"></span>
              <span>Akan Dilalui</span>
            </div>
          </div>

          {/* Floating Map Controls */}
          <div className="absolute bottom-4 right-4 z-[400] flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleFitRoute}
              className="bg-white hover:bg-slate-50 text-slate-800 py-2.5 px-3.5 rounded-2xl shadow-xl text-xs font-bold flex items-center space-x-1.5 border border-slate-200 cursor-pointer transition-all hover:scale-105"
            >
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>Lihat Seluruh Jalur</span>
            </button>

            {selectedVessel && (
              <button
                type="button"
                onClick={handleCenterOnShip}
                className="bg-[#0F2C59] hover:bg-[#1E40AF] text-white py-2.5 px-4 rounded-2xl shadow-xl text-xs font-extrabold flex items-center space-x-2 border border-sky-400/40 cursor-pointer transition-all hover:scale-105"
              >
                <Navigation className="w-4 h-4 text-sky-400 animate-pulse" />
                <span>Pusatkan ke Kapal</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Telemetry & Maritime Checkpoints */}
        <div className="lg:col-span-4 space-y-4">
          {selectedVessel ? (
            <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-md space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200">
                    {selectedVessel.type}
                  </span>
                  <h3 className="font-black text-lg text-slate-900 mt-1 flex items-center space-x-1.5">
                    <Ship className="w-4 h-4 text-sky-600" />
                    <span>{selectedVessel.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedVessel.registrationNumber}</p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-black ${
                    selectedVessel.status === 'Dalam Perjalanan'
                      ? 'bg-sky-100 text-sky-800'
                      : selectedVessel.status === 'Bertambat'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedVessel.status === 'Delay'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selectedVessel.status === 'Dalam Perjalanan' && '🔵 Berlayar'}
                  {selectedVessel.status === 'Bertambat' && '🟢 Sandar'}
                  {selectedVessel.status === 'Delay' && '🟡 Delay'}
                  {selectedVessel.status === 'Batal' && '🔴 Batal'}
                </span>
              </div>

              {/* Rute Sesuai Tiket */}
              {currentBooking && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Alur Pelayaran Sesuai Tiket
                  </span>
                  <div className="font-extrabold text-xs text-slate-800">
                    {currentBooking.originDockName} ➔ {currentBooking.destinationDockName}
                  </div>
                </div>
              )}

              {/* Real-time Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center space-x-1">
                    <Gauge className="w-3 h-3 text-sky-600" />
                    <span>Kecepatan</span>
                  </span>
                  <div className="font-black text-slate-900 text-sm">
                    {selectedVessel.speedKts} knot
                  </div>
                  <span className="text-[10px] text-slate-400">
                    ~{(selectedVessel.speedKts * 1.852).toFixed(1)} km/jam
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center space-x-1">
                    <Compass className="w-3 h-3 text-sky-600" />
                    <span>Arah Haluan</span>
                  </span>
                  <div className="font-black text-slate-900 text-sm">
                    {vesselNavState.headingDeg}°
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {vesselNavState.headingDeg > 180 ? 'Barat Daya' : 'Timur Laut'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-sky-600" />
                    <span>Posisi Kapal</span>
                  </span>
                  <div className="font-mono font-bold text-slate-900 text-[11px]">
                    {vesselNavState.lat.toFixed(4)}, {vesselNavState.lng.toFixed(4)}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-sky-600" />
                    <span>Update GPS</span>
                  </span>
                  <div className="font-bold text-slate-900 text-xs">
                    {selectedVessel.lastUpdated}
                  </div>
                </div>
              </div>

              {/* Maritime Checkpoints List */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-wide flex items-center space-x-1">
                    <Anchor className="w-3.5 h-3.5 text-sky-600" />
                    <span>Titik Koridor Alur Laut</span>
                  </span>
                  <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                    {maritimeWaypoints.length} Titik
                  </span>
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {maritimeWaypoints.map((wp, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-sky-50/60 border border-slate-100 flex items-center justify-between text-[11px] transition-colors"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 font-black text-[9px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <div className="font-bold text-slate-800 truncate">{wp.name}</div>
                          <div className="text-[9px] text-slate-400">
                            {wp.nauticalType || 'Alur Pelayaran'} • {wp.lat.toFixed(3)}, {wp.lng.toFixed(3)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weather Banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-start space-x-2">
                <Waves className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Status Cuaca Alur Pelayaran: Aman</span>
                  <span className="text-[11px] text-emerald-700">
                    Tinggi gelombang ~0.5m, angin 8-12 knot. Pelayaran alur laut berjalan lancar.
                  </span>
                </div>
              </div>

              {/* Action Button: View E-Ticket */}
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('tiket')}
                  className="w-full py-2.5 px-4 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-2xl border border-sky-200 flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Buka E-Ticket & QR Gate Masuk</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center text-slate-500">
              <Ship className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold">Memuat telemetri GPS kapal pesanan Anda...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
