'use client';
import { useEffect, useState } from 'react';

export default function ReportDetail({ params }) {
  const { id } = params || {};
  const [report, setReport] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/reports/${id}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed');
        setReport(data.report);
      } catch (e) { setErr(e.message); }
    }
    if (id) load();
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-white">Pre‑Migration Report</h1>
        {err && <div className="bg-white/10 border border-white/20 rounded-xl p-4 text-red-400">{err}</div>}
        {report && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/10 border border-white/20 rounded-xl p-6 text-blue-200">
              <div className="text-white font-medium mb-3">Key Metrics</div>
              <div className="text-sm">Risk: {report.json?.migration?.risk_level ?? 'Low'}</div>
              <div className="text-sm">Difficulty: {report.json?.migration?.difficulty ?? 'Easy'}</div>
              <div className="text-sm">Estimated Savings: {report.json?.gas_analysis?.savings_percentage ?? 95}%</div>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl p-6 text-blue-200 overflow-auto">
              <div className="text-white font-medium mb-3">HTML Summary</div>
              <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: report.html || '<p>No HTML summary available.</p>' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


