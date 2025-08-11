import React from 'react';

export default function OptimizePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-950 flex items-center justify-center p-8">
      <div className="bg-white/10 border border-white/20 rounded-xl p-8 max-w-xl text-center">
        <h1 className="text-2xl md:text-3xl font-semibold text-white mb-4">Optimization Scanner (Coming Soon)</h1>
        <p className="text-blue-200 mb-4">Our automated scanner will analyze your Solidity code and suggest Arbitrum-specific gas and security optimizations.</p>
        <p className="text-blue-300 text-sm">Stay tuned — this feature ships in the next release.</p>
      </div>
    </div>
  );
}
