import React from 'react';
import { WeatherReport } from '../../types';
import { CloudSun, Waves, Wind, AlertTriangle, ShieldAlert, CheckCircle2, Info } from 'lucide-react';

interface WeatherPageProps {
  reports: WeatherReport[];
}

export const WeatherPage: React.FC<WeatherPageProps> = ({ reports }) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Official Safety Notice Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-5 rounded-2xl shadow-md space-y-2">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-6 h-6 text-amber-100 shrink-0" />
          <h2 className="text-base sm:text-lg font-extrabold">Himbauan Resmi Keselamatan Pelayaran</h2>
        </div>
        <p className="text-xs sm:text-sm text-amber-50 leading-relaxed">
          Informasi cuaca dan kondisi gelombang bersumber dari BMKG & Syahbandar. Keputusan resmi izin keberangkatan pelayaran sepenuhnya berada di bawah wewenang Kantor Kesyahbandaran dan Otoritas Pelabuhan (KSOP) demi keselamatan jiwa di laut.
        </p>
      </div>

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <CloudSun className="w-5 h-5 text-sky-600" />
            <span>Cuaca Laut & Gelombang BMKG</span>
          </h2>
          <p className="text-xs text-slate-500">
            Monitoring kondisi cuaca, tinggi gelombang, dan kecepatan angin per rute pelayaran
          </p>
        </div>
      </div>

      {/* Weather Cards per Route */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reports.map((report) => {
          const isDanger = report.status === 'Berbahaya' || report.status === 'Siaga';
          const isWarning = report.status === 'Waspada';

          return (
            <div
              key={report.id}
              className={`bg-white p-5 rounded-2xl border shadow-sm transition-all space-y-4 ${
                isDanger
                  ? 'border-red-300 ring-1 ring-red-200'
                  : isWarning
                  ? 'border-amber-300'
                  : 'border-slate-200'
              }`}
            >
              {/* Route & Status Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Rute Layanan</span>
                  <h3 className="font-extrabold text-slate-900 text-base">{report.routeName}</h3>
                  <p className="text-[11px] text-slate-500">{report.originDockName} → {report.destinationDockName}</p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-black ${
                    report.status === 'Aman'
                      ? 'bg-emerald-100 text-emerald-800'
                      : report.status === 'Waspada'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {report.status === 'Aman' && '🟢 Aman'}
                  {report.status === 'Waspada' && '🟡 Waspada'}
                  {report.status === 'Siaga' && '🟠 Siaga'}
                  {report.status === 'Berbahaya' && '🔴 Berbahaya'}
                </span>
              </div>

              {/* Weather Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {/* Condition */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <CloudSun className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block font-semibold">Cuaca</span>
                  <span className="font-extrabold text-slate-800">{report.condition}</span>
                </div>

                {/* Wave Height */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Waves className="w-5 h-5 text-sky-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block font-semibold">Gelombang</span>
                  <span className="font-extrabold text-slate-800">{report.waveHeightMeters} Meter</span>
                </div>

                {/* Wind */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Wind className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block font-semibold">Angin</span>
                  <span className="font-extrabold text-slate-800">{report.windSpeedKmH} km/jam</span>
                </div>
              </div>

              {/* Advice Box */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1">
                <span className="font-bold text-slate-900 block flex items-center space-x-1">
                  <Info className="w-3.5 h-3.5 text-sky-600" />
                  <span>Himbauan Syahbandar:</span>
                </span>
                <p className="text-[11px] leading-relaxed text-slate-600">{report.officialAdvice}</p>
              </div>

              <div className="text-[10px] text-slate-400 text-right pt-1">
                Diperbarui: {report.updatedAt}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
