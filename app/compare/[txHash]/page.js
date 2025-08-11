'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

const GraphView = dynamic(() => import('../../components/GraphView'), { ssr: false });

export default function ComparePage({ params, searchParams }) {
  const { txHash } = params || {};
  const sourceChain = searchParams?.sourceChain || '11155111';
  const targetChain = searchParams?.targetChain || '421614';
  const [summary, setSummary] = useState(null);
  const [leftGraph, setLeftGraph] = useState(null);
  const [rightGraph, setRightGraph] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/compare/${txHash}?sourceChain=${sourceChain}&targetChain=${targetChain}`);
      const data = await res.json();
      if (data.success) setSummary(data.summary);
      // Load two graphs in parallel using existing graph API with same tx hash
      const [l, r] = await Promise.all([
        fetch(`/api/graph/${sourceChain}/${txHash}`).then((r) => r.json()).catch(() => ({})),
        fetch(`/api/graph/${targetChain}/${txHash}`).then((r) => r.json()).catch(() => ({})),
      ]);
      if (l?.success) setLeftGraph(l.graph);
      if (r?.success) setRightGraph(r.graph);
    }
    if (txHash) load();
  }, [txHash, sourceChain, targetChain]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-white">Cross-Network Compare</h1>
        <div className="text-sm text-blue-200 font-mono">{txHash}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/10 border border-white/20 rounded-xl p-2 h-[60vh] text-blue-200">
            {leftGraph ? (
              <GraphView graph={leftGraph} />
            ) : (
              <div className="h-full flex items-center justify-center text-blue-300">Loading {sourceChain}…</div>
            )}
          </div>
          <div className="bg-white/10 border border-white/20 rounded-xl p-2 h-[60vh] text-blue-200">
            {rightGraph ? (
              <GraphView graph={rightGraph} />
            ) : (
              <div className="h-full flex items-center justify-center text-blue-300">Loading {targetChain}…</div>
            )}
          </div>
        </div>
        {summary && (
          <div className="mt-4 p-4 bg-white/10 border border-white/20 rounded-xl text-white">
            <div className="font-medium mb-2">Deltas</div>
            <div className="text-blue-200">Gas saved: {summary.deltas.gasSaved}</div>
            <div className="text-blue-200">Time saved: {summary.deltas.timeSavedMs} ms</div>
          </div>
        )}
      </div>
    </div>
  );
}


