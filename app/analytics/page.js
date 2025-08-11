'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

const Sparkline = dynamic(() => import('../components/charts/Sparkline'), { ssr: false });
const BarMini = dynamic(() => import('../components/charts/BarMini'), { ssr: false });

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/analytics/metrics');
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed');
        setMetrics(data.metrics);
      } catch (e) {
        setError(e.message);
        setMetrics({
          avgGasSavedPerProject: 71234,
          topContracts: [
            { address: '0xabc...', interactions: 420 },
            { address: '0xdef...', interactions: 311 },
          ],
          adoptionTrend: [
            { date: '2025-07-01', projects: 10 },
            { date: '2025-07-15', projects: 14 },
            { date: '2025-08-01', projects: 21 },
          ],
        });
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold text-white">Visual Analytics</h1>
        </div>
        {!metrics && (
          <div className="bg-white/10 border border-white/20 rounded-xl p-6 text-blue-200">Loading…</div>
        )}
        {error && (
          <div className="bg-white/10 border border-white/20 rounded-xl p-4 text-red-400">
            {error}
          </div>
        )}
        {metrics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 border border-white/20 rounded-xl p-6">
                <div className="text-sm text-blue-200 mb-1">Avg Gas Saved / Project</div>
                <div className="text-3xl font-semibold text-white">{metrics.avgGasSavedPerProject}</div>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl p-6">
                <div className="text-sm text-blue-200 mb-3">Top Contracts</div>
                <BarMini items={metrics.topContracts.map((c) => ({ label: c.address.slice(0,6) + '…', value: c.interactions }))} height={120} />
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl p-6">
                <div className="text-sm text-blue-200 mb-3">Adoption Trend</div>
                <Sparkline points={metrics.adoptionTrend.map((p) => ({ label: p.date, value: p.projects }))} height={120} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


