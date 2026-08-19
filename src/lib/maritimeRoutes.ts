import { Dock } from '../types';

export interface SeaWaypoint {
  name: string;
  lat: number;
  lng: number;
  nauticalType?: 'Pelabuhan' | 'Alur TSS' | 'Selat' | 'Teluk' | 'Laut Lepas';
}

// Master Realistic Maritime Sea Lanes Database for Indonesia
export const MARITIME_SEA_LANES: Record<string, SeaWaypoint[]> = {
  // 1. Teluk Balikpapan (Balikpapan Semayang <-> Penajam)
  'balikpapan-penajam': [
    { name: 'Dermaga Semayang Balikpapan', lat: -1.2721, lng: 116.8190, nauticalType: 'Pelabuhan' },
    { name: 'Alur Keluar Kolam Semayang', lat: -1.2785, lng: 116.8120, nauticalType: 'Alur TSS' },
    { name: 'Alur Teluk Balikpapan Tengah', lat: -1.2670, lng: 116.7975, nauticalType: 'Selat' },
    { name: 'Pendekatan Penajam Buoy 2', lat: -1.2540, lng: 116.7865, nauticalType: 'Alur TSS' },
    { name: 'Dermaga Penajam PPU', lat: -1.2485, lng: 116.7820, nauticalType: 'Pelabuhan' },
  ],

  // 2. Sungai Mahakam (Samarinda Pasar Pagi <-> Tenggarong)
  'samarinda-tenggarong': [
    { name: 'Dermaga Pasar Pagi Samarinda', lat: -0.5021, lng: 117.1537, nauticalType: 'Pelabuhan' },
    { name: 'Alur Mahakam Karang Asam', lat: -0.5195, lng: 117.1320, nauticalType: 'Alur TSS' },
    { name: 'Tikungan Teluk Lerong', lat: -0.5280, lng: 117.0980, nauticalType: 'Selat' },
    { name: 'Alur Mahakam Loa Duri', lat: -0.5360, lng: 117.0620, nauticalType: 'Selat' },
    { name: 'Tikungan Mahakam Loa Kulu', lat: -0.5010, lng: 117.0280, nauticalType: 'Alur TSS' },
    { name: 'Alur Mahakam Sukarame', lat: -0.4620, lng: 116.9980, nauticalType: 'Selat' },
    { name: 'Dermaga Tenggarong', lat: -0.4285, lng: 116.9820, nauticalType: 'Pelabuhan' },
  ],

  // 3. Selat Sunda (Merak <-> Bakauheni)
  'merak-bakauheni': [
    { name: 'Pelabuhan Merak Banten', lat: -5.9328, lng: 105.9997, nauticalType: 'Pelabuhan' },
    { name: 'TSS Selat Sunda Alur Timur', lat: -5.9280, lng: 105.9810, nauticalType: 'Alur TSS' },
    { name: 'Perlintasan Selat Sunda Tengah', lat: -5.9080, lng: 105.8820, nauticalType: 'Selat' },
    { name: 'TSS Pendekatan Bakauheni', lat: -5.8810, lng: 105.7920, nauticalType: 'Alur TSS' },
    { name: 'Pelabuhan Bakauheni Lampung', lat: -5.8672, lng: 105.7533, nauticalType: 'Pelabuhan' },
  ],

  // 4. Selat Bali (Ketapang <-> Gilimanuk)
  'ketapang-gilimanuk': [
    { name: 'Pelabuhan Ketapang Banyuwangi', lat: -8.1481, lng: 114.3976, nauticalType: 'Pelabuhan' },
    { name: 'Alur Keluar Ketapang', lat: -8.1510, lng: 114.4110, nauticalType: 'Alur TSS' },
    { name: 'Jalur Tengah Selat Bali', lat: -8.1585, lng: 114.4260, nauticalType: 'Selat' },
    { name: 'Kolam Pelabuhan Gilimanuk', lat: -8.1633, lng: 114.4371, nauticalType: 'Pelabuhan' },
  ],

  // 5. Bali - Nusa Penida (Sanur <-> Buyuk)
  'sanur-buyuk': [
    { name: 'Dermaga Sanur Denpasar', lat: -8.6742, lng: 115.2630, nauticalType: 'Pelabuhan' },
    { name: 'Muara Pantai Sanur', lat: -8.6820, lng: 115.2850, nauticalType: 'Teluk' },
    { name: 'Selat Badung Deepwater', lat: -8.6910, lng: 115.3850, nauticalType: 'Selat' },
    { name: 'Alur Masuk Selat Nusa Penida', lat: -8.6830, lng: 115.5120, nauticalType: 'Alur TSS' },
    { name: 'Dermaga Buyuk Nusa Penida', lat: -8.6761, lng: 115.5492, nauticalType: 'Pelabuhan' },
  ],

  // 6. Bali - Lombok (Padangbai <-> Lembar)
  'padangbai-lembar': [
    { name: 'Pelabuhan Padangbai Bali', lat: -8.5322, lng: 115.5083, nauticalType: 'Pelabuhan' },
    { name: 'Teluk Padangbai Luar', lat: -8.5490, lng: 115.5380, nauticalType: 'Teluk' },
    { name: 'Selat Lombok TSS Perlintasan', lat: -8.6350, lng: 115.7800, nauticalType: 'Selat' },
    { name: 'Pendekatan Teluk Lembar', lat: -8.7120, lng: 116.0280, nauticalType: 'Alur TSS' },
    { name: 'Pelabuhan Lembar Lombok', lat: -8.7291, lng: 116.0722, nauticalType: 'Pelabuhan' },
  ],

  // 7. Teluk Jakarta (Marina Ancol <-> Pulau Pramuka Kep. Seribu)
  'ancol-pramuka': [
    { name: 'Dermaga Marina Ancol', lat: -6.1189, lng: 106.8322, nauticalType: 'Pelabuhan' },
    { name: 'Alur Muara Ancol', lat: -6.1010, lng: 106.8250, nauticalType: 'Teluk' },
    { name: 'Barat Daya Pulau Damar', lat: -6.0250, lng: 106.7820, nauticalType: 'Alur TSS' },
    { name: 'Jalur Timur Pulau Pari', lat: -5.8820, lng: 106.6950, nauticalType: 'Selat' },
    { name: 'Alur Masuk Pulau Panggang/Pramuka', lat: -5.7650, lng: 106.6320, nauticalType: 'Alur TSS' },
    { name: 'Dermaga Pulau Pramuka', lat: -5.7460, lng: 106.6136, nauticalType: 'Pelabuhan' },
  ],

  // 8. Sulawesi - Selat Makassar (Balikpapan <-> Makassar)
  'balikpapan-makassar': [
    { name: 'Dermaga Semayang Balikpapan', lat: -1.2721, lng: 116.8190, nauticalType: 'Pelabuhan' },
    { name: 'Alur Teluk Balikpapan Luar', lat: -1.3850, lng: 116.9450, nauticalType: 'Teluk' },
    { name: 'ALKI II Selat Makassar Tengah', lat: -2.6500, lng: 117.8500, nauticalType: 'Laut Lepas' },
    { name: 'ALKI II Barat Kep. Spermonde', lat: -4.6500, lng: 118.7500, nauticalType: 'Laut Lepas' },
    { name: 'Alur Pendekatan Pelabuhan Makassar', lat: -5.1120, lng: 119.3450, nauticalType: 'Alur TSS' },
    { name: 'Pelabuhan Soekarno-Hatta Makassar', lat: -5.1322, lng: 119.4082, nauticalType: 'Pelabuhan' },
  ],

  // 9. Sulawesi - Selat Makassar (Balikpapan <-> Parepare)
  'balikpapan-parepare': [
    { name: 'Dermaga Semayang Balikpapan', lat: -1.2721, lng: 116.8190, nauticalType: 'Pelabuhan' },
    { name: 'Alur Teluk Balikpapan Luar', lat: -1.3850, lng: 116.9450, nauticalType: 'Teluk' },
    { name: 'ALKI II Selat Makassar Poros Parepare', lat: -2.9500, lng: 118.2500, nauticalType: 'Laut Lepas' },
    { name: 'Teluk Parepare Alur Masuk', lat: -3.9780, lng: 119.5600, nauticalType: 'Teluk' },
    { name: 'Pelabuhan Parepare', lat: -4.0112, lng: 119.6201, nauticalType: 'Pelabuhan' },
  ],

  // 10. Sulawesi - Selat Makassar (Balikpapan <-> Mamuju)
  'balikpapan-mamuju': [
    { name: 'Dermaga Semayang Balikpapan', lat: -1.2721, lng: 116.8190, nauticalType: 'Pelabuhan' },
    { name: 'Alur Teluk Balikpapan Luar', lat: -1.3850, lng: 116.9450, nauticalType: 'Teluk' },
    { name: 'Selat Makassar Lintasan Mamuju', lat: -2.1500, lng: 117.9500, nauticalType: 'Laut Lepas' },
    { name: 'Teluk Mamuju Alur Simboro', lat: -2.6520, lng: 118.8100, nauticalType: 'Teluk' },
    { name: 'Pelabuhan Simboro Mamuju', lat: -2.6801, lng: 118.8611, nauticalType: 'Pelabuhan' },
  ],

  // 11. Sulawesi - Selat Makassar (Balikpapan <-> Palu Pantoloan)
  'balikpapan-palu': [
    { name: 'Dermaga Semayang Balikpapan', lat: -1.2721, lng: 116.8190, nauticalType: 'Pelabuhan' },
    { name: 'ALKI II Selat Makassar Utara', lat: -0.1500, lng: 118.9500, nauticalType: 'Laut Lepas' },
    { name: 'Teluk Palu Alur Luar', lat: -0.6120, lng: 119.7650, nauticalType: 'Teluk' },
    { name: 'Pendekatan Pantoloan Buoy', lat: -0.6850, lng: 119.8250, nauticalType: 'Alur TSS' },
    { name: 'Pelabuhan Pantoloan Palu', lat: -0.7121, lng: 119.8530, nauticalType: 'Pelabuhan' },
  ],

  // 12. Sulawesi Selatan (Bulukumba Bira <-> Pamatata Selayar)
  'bira-selayar': [
    { name: 'Pelabuhan Bira Bulukumba', lat: -5.6133, lng: 120.4578, nauticalType: 'Pelabuhan' },
    { name: 'Tanjung Bira Alur Selatan', lat: -5.6420, lng: 120.4710, nauticalType: 'Alur TSS' },
    { name: 'Selat Selayar Jalur Deepwater', lat: -5.7650, lng: 120.4580, nauticalType: 'Selat' },
    { name: 'Alur Masuk Pelabuhan Pamatata', lat: -5.8720, lng: 120.4450, nauticalType: 'Alur TSS' },
    { name: 'Pelabuhan Pamatata Selayar', lat: -5.8890, lng: 120.4421, nauticalType: 'Pelabuhan' },
  ],

  // 13. Sulawesi Tenggara (Kendari <-> Baubau Murhum)
  'kendari-baubau': [
    { name: 'Pelabuhan Nusantara Kendari', lat: -3.9782, lng: 122.5831, nauticalType: 'Pelabuhan' },
    { name: 'Teluk Kendari Alur Luar', lat: -3.9880, lng: 122.6850, nauticalType: 'Teluk' },
    { name: 'Selat Buton Utara', lat: -4.7500, lng: 122.7800, nauticalType: 'Selat' },
    { name: 'Selat Buton Tengah', lat: -5.1800, lng: 122.6900, nauticalType: 'Selat' },
    { name: 'Pelabuhan Murhum Baubau', lat: -5.4621, lng: 122.5982, nauticalType: 'Pelabuhan' },
  ],

  // 14. Sulawesi Selatan - Tenggara (Makassar <-> Baubau)
  'makassar-baubau': [
    { name: 'Pelabuhan Soekarno-Hatta Makassar', lat: -5.1322, lng: 119.4082, nauticalType: 'Pelabuhan' },
    { name: 'Alur Barat Takalar', lat: -5.6200, lng: 119.3500, nauticalType: 'Alur TSS' },
    { name: 'Selatan Tanjung Bira', lat: -5.7500, lng: 120.4800, nauticalType: 'Laut Lepas' },
    { name: 'Laut Flores Utara', lat: -5.6800, lng: 121.6500, nauticalType: 'Laut Lepas' },
    { name: 'Selat Buton Barat', lat: -5.5200, lng: 122.5100, nauticalType: 'Selat' },
    { name: 'Pelabuhan Murhum Baubau', lat: -5.4621, lng: 122.5982, nauticalType: 'Pelabuhan' },
  ],

  // 15. Sulawesi Utara & Gorontalo (Bitung <-> Gorontalo)
  'bitung-gorontalo': [
    { name: 'Pelabuhan Bitung', lat: 1.4422, lng: 125.1912, nauticalType: 'Pelabuhan' },
    { name: 'Selat Lembeh Luar', lat: 1.3650, lng: 125.1650, nauticalType: 'Selat' },
    { name: 'Laut Maluku Barat', lat: 0.8500, lng: 124.6500, nauticalType: 'Laut Lepas' },
    { name: 'Teluk Tomini Alur Timur', lat: 0.4200, lng: 123.3500, nauticalType: 'Teluk' },
    { name: 'Pelabuhan Gorontalo', lat: 0.5188, lng: 123.0611, nauticalType: 'Pelabuhan' },
  ],

  // 16. Sulawesi Tengah & Gorontalo (Luwuk Banggai <-> Gorontalo)
  'luwuk-gorontalo': [
    { name: 'Pelabuhan Luwuk Banggai', lat: -0.9511, lng: 122.7911, nauticalType: 'Pelabuhan' },
    { name: 'Alur Selat Peleng', lat: -0.8200, lng: 122.8800, nauticalType: 'Selat' },
    { name: 'Teluk Tomini Perlintasan Tengah', lat: -0.1500, lng: 123.0500, nauticalType: 'Laut Lepas' },
    { name: 'Alur Masuk Teluk Gorontalo', lat: 0.4800, lng: 123.0600, nauticalType: 'Teluk' },
    { name: 'Pelabuhan Gorontalo', lat: 0.5188, lng: 123.0611, nauticalType: 'Pelabuhan' },
  ],

  // 17. Kepulauan Riau (Batam <-> Tanjung Pinang)
  'batam-tanjungpinang': [
    { name: 'Pelabuhan Batam Center', lat: 1.1301, lng: 104.0531, nauticalType: 'Pelabuhan' },
    { name: 'Teluk Tering Alur Keluar', lat: 1.1710, lng: 104.0720, nauticalType: 'Teluk' },
    { name: 'Selat Riau TSS Inter-Island', lat: 1.1150, lng: 104.2250, nauticalType: 'Selat' },
    { name: 'Alur Masuk Tanjung Pinang', lat: 0.9550, lng: 104.4050, nauticalType: 'Alur TSS' },
    { name: 'Pelabuhan Sri Bintan Pura', lat: 0.9281, lng: 104.4421, nauticalType: 'Pelabuhan' },
  ],

  // 18. Aceh (Banda Aceh <-> Sabang)
  'bandaaceh-sabang': [
    { name: 'Pelabuhan Ulee Lheue Banda Aceh', lat: 5.5614, lng: 95.2831, nauticalType: 'Pelabuhan' },
    { name: 'Teluk Meuraxa Alur Luar', lat: 5.6020, lng: 95.2740, nauticalType: 'Teluk' },
    { name: 'Selat Benggala TSS', lat: 5.7150, lng: 95.3120, nauticalType: 'Selat' },
    { name: 'Teluk Balohan Alur Masuk', lat: 5.8180, lng: 95.3340, nauticalType: 'Teluk' },
    { name: 'Pelabuhan Balohan Sabang', lat: 5.8322, lng: 95.3382, nauticalType: 'Pelabuhan' },
  ],

  // 19. Nusa Tenggara Timur (Labuan Bajo <-> Pulau Komodo)
  'labuanbajo-komodo': [
    { name: 'Pelabuhan Labuan Bajo', lat: -8.4901, lng: 119.8802, nauticalType: 'Pelabuhan' },
    { name: 'Selat Flores Alur Labuan Bajo', lat: -8.5180, lng: 119.7650, nauticalType: 'Selat' },
    { name: 'Utara Pulau Rinca', lat: -8.5550, lng: 119.6350, nauticalType: 'Selat' },
    { name: 'Teluk Loh Liang Alur Komodo', lat: -8.5920, lng: 119.5250, nauticalType: 'Teluk' },
    { name: 'Pelabuhan Pulau Komodo', lat: -8.6011, lng: 119.5022, nauticalType: 'Pelabuhan' },
  ],

  // 20. Papua Barat Daya (Sorong <-> Waisai Raja Ampat)
  'sorong-rajaampat': [
    { name: 'Pelabuhan Sorong', lat: -0.8711, lng: 131.2501, nauticalType: 'Pelabuhan' },
    { name: 'Selat Sele Alur Utara', lat: -0.7850, lng: 131.1550, nauticalType: 'Selat' },
    { name: 'Selat Dampier Jalur Internasional', lat: -0.5820, lng: 130.9520, nauticalType: 'Selat' },
    { name: 'Teluk Waisai Alur Masuk', lat: -0.4520, lng: 130.8350, nauticalType: 'Teluk' },
    { name: 'Pelabuhan Waisai Raja Ampat', lat: -0.4321, lng: 130.8122, nauticalType: 'Pelabuhan' },
  ],

  // 21. Maluku (Ambon <-> Banda Neira)
  'ambon-bandaneira': [
    { name: 'Pelabuhan Yos Sudarso Ambon', lat: -3.6931, lng: 128.1811, nauticalType: 'Pelabuhan' },
    { name: 'Teluk Ambon Alur Luar', lat: -3.7850, lng: 128.1520, nauticalType: 'Teluk' },
    { name: 'Laut Banda Barat Jalur Pelayaran', lat: -4.1200, lng: 128.9200, nauticalType: 'Laut Lepas' },
    { name: 'Pendekatan Kepulauan Banda', lat: -4.4750, lng: 129.8450, nauticalType: 'Alur TSS' },
    { name: 'Pelabuhan Banda Neira', lat: -4.5231, lng: 129.9011, nauticalType: 'Pelabuhan' },
  ],
};

/**
 * Match origin and destination dock to the corresponding realistic maritime sea lane.
 */
export function getMaritimeRouteWaypoints(originDock: Dock | null, destDock: Dock | null): SeaWaypoint[] {
  if (!originDock || !destDock) return [];

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const oName = norm(originDock.name);
  const dName = norm(destDock.name);

  // Match lookup keys
  const matchPair = (term1: string, term2: string, key: string) => {
    const has1 = oName.includes(term1) || dName.includes(term1);
    const has2 = oName.includes(term2) || dName.includes(term2);
    if (has1 && has2) {
      const isReverse = dName.includes(term1);
      const lane = MARITIME_SEA_LANES[key];
      if (!lane) return null;
      return isReverse ? [...lane].reverse() : [...lane];
    }
    return null;
  };

  const matched =
    matchPair('semayang', 'penajam', 'balikpapan-penajam') ||
    matchPair('balikpapan', 'penajam', 'balikpapan-penajam') ||
    matchPair('samarinda', 'tenggarong', 'samarinda-tenggarong') ||
    matchPair('merak', 'bakauheni', 'merak-bakauheni') ||
    matchPair('ketapang', 'gilimanuk', 'ketapang-gilimanuk') ||
    matchPair('sanur', 'buyuk', 'sanur-buyuk') ||
    matchPair('sanur', 'penida', 'sanur-buyuk') ||
    matchPair('padangbai', 'lembar', 'padangbai-lembar') ||
    matchPair('ancol', 'pramuka', 'ancol-pramuka') ||
    matchPair('balikpapan', 'makassar', 'balikpapan-makassar') ||
    matchPair('semayang', 'makassar', 'balikpapan-makassar') ||
    matchPair('balikpapan', 'parepare', 'balikpapan-parepare') ||
    matchPair('balikpapan', 'mamuju', 'balikpapan-mamuju') ||
    matchPair('balikpapan', 'palu', 'balikpapan-palu') ||
    matchPair('semayang', 'pantoloan', 'balikpapan-palu') ||
    matchPair('bira', 'pamatata', 'bira-selayar') ||
    matchPair('bira', 'selayar', 'bira-selayar') ||
    matchPair('kendari', 'baubau', 'kendari-baubau') ||
    matchPair('makassar', 'baubau', 'makassar-baubau') ||
    matchPair('bitung', 'gorontalo', 'bitung-gorontalo') ||
    matchPair('luwuk', 'gorontalo', 'luwuk-gorontalo') ||
    matchPair('batam', 'bintan', 'batam-tanjungpinang') ||
    matchPair('batam', 'pinang', 'batam-tanjungpinang') ||
    matchPair('ulee', 'balohan', 'bandaaceh-sabang') ||
    matchPair('aceh', 'sabang', 'bandaaceh-sabang') ||
    matchPair('labuan', 'komodo', 'labuanbajo-komodo') ||
    matchPair('sorong', 'waisai', 'sorong-rajaampat') ||
    matchPair('sorong', 'ampat', 'sorong-rajaampat') ||
    matchPair('ambon', 'banda', 'ambon-bandaneira');

  if (matched) {
    // Ensure the start and end match exact dock coordinates
    const adjusted = [...matched];
    adjusted[0] = { ...adjusted[0], lat: originDock.lat, lng: originDock.lng, name: originDock.name };
    adjusted[adjusted.length - 1] = {
      ...adjusted[adjusted.length - 1],
      lat: destDock.lat,
      lng: destDock.lng,
      name: destDock.name,
    };
    return adjusted;
  }

  // Fallback: Generate curved nautical midpoint waypoints over sea rather than crossing direct land
  const midLat = (originDock.lat + destDock.lat) / 2;
  const midLng = (originDock.lng + destDock.lng) / 2;
  const deltaLat = destDock.lat - originDock.lat;
  const deltaLng = destDock.lng - originDock.lng;

  // Slight sea arc offset perpendicular to heading
  const arcLat = midLat - deltaLng * 0.08;
  const arcLng = midLng + deltaLat * 0.08;

  return [
    { name: originDock.name, lat: originDock.lat, lng: originDock.lng, nauticalType: 'Pelabuhan' },
    { name: 'Alur Pelayaran Keluar Pelabuhan', lat: originDock.lat + deltaLat * 0.2, lng: originDock.lng + deltaLng * 0.2, nauticalType: 'Alur TSS' },
    { name: 'Perairan Alur Laut Maritim', lat: arcLat, lng: arcLng, nauticalType: 'Selat' },
    { name: 'Alur Masuk Kolam Pelabuhan Tujuan', lat: destDock.lat - deltaLat * 0.2, lng: destDock.lng - deltaLng * 0.2, nauticalType: 'Alur TSS' },
    { name: destDock.name, lat: destDock.lat, lng: destDock.lng, nauticalType: 'Pelabuhan' },
  ];
}

/**
 * Calculates distance between 2 lat/lng points in km (Haversine formula).
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates bearing/heading in degrees from point 1 to point 2.
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Given a set of waypoints and a fraction progress (0.0 to 1.0),
 * computes exact vessel coordinate and nautical heading along the real sea lane path.
 */
export function interpolatePositionOnPath(
  waypoints: SeaWaypoint[],
  progress: number
): { lat: number; lng: number; headingDeg: number; segmentIndex: number } {
  if (waypoints.length === 0) return { lat: 0, lng: 0, headingDeg: 0, segmentIndex: 0 };
  if (waypoints.length === 1) return { lat: waypoints[0].lat, lng: waypoints[0].lng, headingDeg: 0, segmentIndex: 0 };

  const clampedProgress = Math.max(0, Math.min(1, progress));

  // Compute segment lengths
  const segmentDistances: number[] = [];
  let totalDistance = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const dist = haversineDistance(
      waypoints[i].lat,
      waypoints[i].lng,
      waypoints[i + 1].lat,
      waypoints[i + 1].lng
    );
    segmentDistances.push(dist);
    totalDistance += dist;
  }

  if (totalDistance === 0) {
    return { lat: waypoints[0].lat, lng: waypoints[0].lng, headingDeg: 0, segmentIndex: 0 };
  }

  const targetDistance = clampedProgress * totalDistance;
  let accumulatedDist = 0;

  for (let i = 0; i < segmentDistances.length; i++) {
    const segDist = segmentDistances[i];
    if (accumulatedDist + segDist >= targetDistance || i === segmentDistances.length - 1) {
      const segFraction = segDist > 0 ? (targetDistance - accumulatedDist) / segDist : 0;
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];

      const lat = p1.lat + (p2.lat - p1.lat) * segFraction;
      const lng = p1.lng + (p2.lng - p1.lng) * segFraction;
      const headingDeg = calculateBearing(p1.lat, p1.lng, p2.lat, p2.lng);

      return { lat, lng, headingDeg: Math.round(headingDeg), segmentIndex: i };
    }
    accumulatedDist += segDist;
  }

  const last = waypoints[waypoints.length - 1];
  return { lat: last.lat, lng: last.lng, headingDeg: 0, segmentIndex: waypoints.length - 2 };
}
