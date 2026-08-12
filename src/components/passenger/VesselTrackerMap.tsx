import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Vessel, Dock, RouteItem } from '../../types';
import { Ship, MapPin, Navigation, Clock, Users, Gauge, Filter, Info, AlertTriangle } from 'lucide-react';

interface VesselTrackerMapProps {
  vessels: Vessel[];
  docks: Dock[];
  routes: RouteItem[];
}

export const VesselTrackerMap: React.FC<VesselTrackerMapProps> = ({ vessels, docks, routes }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(vessels[0] || null);
  const [statusFilter, setStatusFilter] = useState<string>('Semua');

  // Center map around Kalimantan & Kepulauan Seribu coordinates
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = selectedVessel ? selectedVessel.currentLat : -1.2610;
      const initialLng = selectedVessel ? selectedVessel.currentLng : 116.8010;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
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
  }, []);

  // Render markers & polylines
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    // 1. Render Docks
    docks.forEach((dock) => {
      const dockIcon = L.divIcon({
        className: 'custom-dock-icon',
        html: `<div style="background-color:#0F2C59; color:white; padding:6px; border-radius:50%; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3); font-weight:bold; width:28px; height:28px; display:flex; align-items:center; justify-content:center; font-size:12px;">⚓</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([dock.lat, dock.lng], { icon: dockIcon }).addTo(markersLayerRef.current!);
      marker.bindTooltip(`<b>${dock.name}</b><br/>Status: ${dock.status}`, { direction: 'top' });
    });

    // 2. Filter vessels
    const filteredVessels = vessels.filter((v) => {
      if (statusFilter === 'Semua') return true;
      return v.status === statusFilter;
    });

    // 3. Render Vessels
    filteredVessels.forEach((vessel) => {
      const statusColor =
        vessel.status === 'Dalam Perjalanan'
          ? '#0284C7' // Blue
          : vessel.status === 'Bertambat'
          ? '#10B981' // Green
          : vessel.status === 'Delay'
          ? '#F59E0B' // Yellow
          : '#EF4444'; // Red

      const shipSvg = `<div style="background-color:${statusColor}; color:white; width:34px; height:34px; border-radius:50%; border:3px solid white; box-shadow:0 4px 10px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; font-size:16px;" class="${vessel.status === 'Dalam Perjalanan' ? 'radar-vessel' : ''}">🚢</div>`;

      const shipIcon = L.divIcon({
        className: 'custom-ship-icon',
        html: shipSvg,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([vessel.currentLat, vessel.currentLng], { icon: shipIcon }).addTo(
        markersLayerRef.current!
      );

      marker.on('click', () => {
        setSelectedVessel(vessel);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([vessel.currentLat, vessel.currentLng]);
        }
      });
    });

    // 4. Draw Route lines if a vessel is selected
    if (selectedVessel) {
      const route = routes.find((r) => r.id === selectedVessel.currentRouteId) || routes[0];
      if (route) {
        const originDock = docks.find((d) => d.id === route.originDockId);
        const destDock = docks.find((d) => d.id === route.destinationDockId);

        if (originDock && destDock) {
          const latlngs: [number, number][] = [
            [originDock.lat, originDock.lng],
            [selectedVessel.currentLat, selectedVessel.currentLng],
            [destDock.lat, destDock.lng],
          ];

          const polyline = L.polyline(latlngs, {
            color: '#0284C7',
            weight: 3,
            dashArray: '6, 8',
            opacity: 0.8,
          }).addTo(markersLayerRef.current!);
        }
      }
    }
  }, [vessels, docks, routes, statusFilter, selectedVessel]);

  const handleCenterOnShip = (vessel: Vessel) => {
    setSelectedVessel(vessel);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([vessel.currentLat, vessel.currentLng], 14, {
        animate: true,
      });
    }
  };

  const getRouteName = (v: Vessel) => {
    const route = routes.find((r) => r.id === v.currentRouteId);
    return route ? route.name : 'Rute Penyeberangan Lokal';
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header & Status Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
            <Navigation className="w-5 h-5 text-sky-600" />
            <span>Live Vessel Tracker (Peta Posisi Kapal)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Pelacakan GPS kapal real-time di perairan dan alur sungai
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['Semua', 'Dalam Perjalanan', 'Bertambat', 'Delay', 'Batal'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map & Drawer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
        {/* Interactive Leaflet Map Canvas */}
        <div className="lg:col-span-2 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner overflow-hidden relative min-h-[380px]">
          <div ref={mapContainerRef} className="w-full h-full min-h-[380px]" />

          {/* Floating Map Legend */}
          <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-200/80 shadow-md text-[11px] font-semibold text-slate-700 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Bertambat</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
              <span>Dalam Perjalanan</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Delay</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Batal</span>
            </div>
          </div>
        </div>

        {/* Selected Vessel Details & Fleet Selector */}
        <div className="space-y-4 overflow-y-auto max-h-[600px] pr-1">
          {selectedVessel ? (
            <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-md space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                    {selectedVessel.type}
                  </span>
                  <h3 className="font-bold text-lg text-slate-900 mt-1">{selectedVessel.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedVessel.registrationNumber}</p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    selectedVessel.status === 'Dalam Perjalanan'
                      ? 'bg-sky-100 text-sky-800 animate-pulse'
                      : selectedVessel.status === 'Bertambat'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedVessel.status === 'Delay'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selectedVessel.status === 'Dalam Perjalanan' && '🔵 Dalam Perjalanan'}
                  {selectedVessel.status === 'Bertambat' && '🟢 Bertambat'}
                  {selectedVessel.status === 'Delay' && '🟡 Delay'}
                  {selectedVessel.status === 'Batal' && '🔴 Batal'}
                </span>
              </div>

              {/* Vessel Attributes */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Rute Layanan</span>
                  <span className="font-bold text-slate-800 text-right">{getRouteName(selectedVessel)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium flex items-center space-x-1">
                    <Gauge className="w-3.5 h-3.5 text-sky-600" />
                    <span>Kecepatan</span>
                  </span>
                  <span className="font-bold text-slate-800">{selectedVessel.speedKts} knot ({selectedVessel.headingDeg}°)</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-sky-600" />
                    <span>Kapasitas Penumpang</span>
                  </span>
                  <span className="font-bold text-slate-800">12 / {selectedVessel.capacityPassengers} orang</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>Update Terakhir</span>
                  </span>
                  <span className="font-bold text-slate-800">{selectedVessel.lastUpdated}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Nakhoda / Operator</span>
                  <span className="font-bold text-slate-800">{selectedVessel.operatorName}</span>
                </div>
              </div>

              {/* Notice Banner */}
              <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl flex items-start space-x-2 text-[11px] text-sky-900">
                <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>Posisi GPS dikirim langsung dari perangkat GPS nakhoda di atas kapal.</span>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-500">
              <Ship className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold">Pilih kapal pada peta untuk melihat detail</p>
            </div>
          )}

          {/* Quick Fleet Selection List */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Daftar Armada Terdekat ({vessels.length})
            </h4>

            <div className="space-y-2">
              {vessels.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleCenterOnShip(v)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                    selectedVessel?.id === v.id
                      ? 'border-sky-500 bg-sky-50/80 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900">{v.name}</div>
                    <div className="text-[10px] text-slate-500">{getRouteName(v)}</div>
                  </div>

                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {v.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
