'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ReportsIndex() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState(null);
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/reports');
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed');
        setItems(data.reports);
      } catch (e) {
        setErr(e.message);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-white">Pre‑Migration Reports</h1>
        {err && <div className="bg-white/10 border border-white/20 rounded-xl p-4 text-red-400">{err}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((it) => (
            <Link key={it.id} href={`/reports/${it.id}`} className="bg-white/10 border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-colors">
              <div className="font-medium text-white mb-1">{it.title}</div>
              <div className="text-xs text-blue-300">Created: {it.createdAt}</div>
              <div className="mt-3 text-sm text-blue-200">Gas Savings: {it.summary.avgGasSaved}%</div>
              <div className="text-sm text-blue-200">Risk: {it.summary.risk}</div>
              <div className="text-sm text-blue-200">Difficulty: {it.summary.difficulty}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


