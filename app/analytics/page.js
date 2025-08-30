
'use client';
import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const Sparkline = dynamic(() => import('../components/charts/Sparkline'), { ssr: false });
const BarMini = dynamic(() => import('../components/charts/BarMini'), { ssr: false });

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [range, setRange] = useState('30d');
  const [chain, setChain] = useState('all');

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

  const kpis = useMemo(() => {
    if (!metrics) return [];
    return [
      { label: 'Avg Gas Saved / Project', value: metrics.avgGasSavedPerProject, delta: '+12% vs last', tone: 'success' },
      { label: 'Top Projects (30d)', value: metrics.topContracts?.length || 0, delta: '+3', tone: 'info' },
      { label: 'Adoption (last point)', value: metrics.adoptionTrend?.slice(-1)[0]?.projects || 0, delta: '+2', tone: 'warning' },
    ];
  }, [metrics]);

  function exportCsv() {
    if (!metrics) return;
    const rows = [
      ['avgGasSavedPerProject', String(metrics.avgGasSavedPerProject)],
      ...((metrics.topContracts || []).map((c) => ['topContract', c.address, String(c.interactions)])),
      ...((metrics.adoptionTrend || []).map((p) => ['adoption', p.date, String(p.projects)])),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'dao-metrics.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-semibold text-white">DAO Metrics</h1>
          <div className="flex items-center gap-2">
            <select className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-blue-100" value={range} onChange={(e)=>setRange(e.target.value)}>
              <option value="7d">7d</option>
              <option value="30d">30d</option>
              <option value="90d">90d</option>
            </select>
            <select className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-blue-100" value={chain} onChange={(e)=>setChain(e.target.value)}>
              <option value="all">All Chains</option>
              <option value="42161">Arbitrum One</option>
              <option value="421614">Arbitrum Sepolia</option>
            </select>
            <Button variant="secondary" size="sm" onClick={exportCsv}>Download CSV</Button>
          </div>
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
              {kpis.map((k, idx) => (
                <div key={idx} className="bg-white/10 border border-white/20 rounded-xl p-6">
                  <div className="text-sm text-blue-200 mb-1">{k.label}</div>
                  <div className="text-3xl font-semibold text-white">{k.value}</div>
                  <div className="mt-2">
                    <Badge tone={k.tone}>{k.delta}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/10 border border-white/20 rounded-xl p-6">
                <div className="text-sm text-blue-200 mb-3">Top Contracts</div>
                <BarMini items={metrics.topContracts.map((c) => ({ label: c.address.slice(0,6) + '…', value: c.interactions }))} height={160} />
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl p-6">
                <div className="text-sm text-blue-200 mb-3">Adoption Trend</div>
                <Sparkline points={metrics.adoptionTrend.map((p) => ({ label: p.date, value: p.projects }))} height={160} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


