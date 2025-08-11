"use client";
import React, { useState } from 'react';

export default function OptimizePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const runScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.ok) {
        setResults(data.suggestions);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-950 flex items-center justify-center p-8">
      <div className="bg-white/10 border border-white/20 rounded-xl p-8 max-w-2xl w-full space-y-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-white text-center">Optimization Scanner</h1>

        <textarea
          className="w-full h-48 p-4 bg-black/40 text-blue-100 rounded-md border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-blue-400 text-sm font-mono"
          placeholder="Paste your Solidity contract here..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <button
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md disabled:opacity-50"
          disabled={loading || !code.trim()}
          onClick={runScan}
        >
          {loading ? 'Scanning...' : 'Run Scan'}
        </button>

        {error && <p className="text-red-400 text-center text-sm">{error}</p>}

        {results && (
          <div className="space-y-4">
            <h2 className="text-xl text-blue-200 font-semibold">Suggestions</h2>
            <ul className="space-y-2">
              {results.map((s, i) => (
                <li
                  key={i}
                  className="bg-slate-800/60 p-4 rounded-md border border-white/10"
                >
                  <p className="text-blue-100 font-medium">{s.title}</p>
                  <p className="text-blue-300 text-sm mt-1">{s.description}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
