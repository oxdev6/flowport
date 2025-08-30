'use client';
import { useState } from 'react';

export default function DeployPage() {
  const [network, setNetwork] = useState('arbitrumSepolia');
  const [contract, setContract] = useState('Counter');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoVerify, setAutoVerify] = useState(true);

  async function startDeploy() {
    setLoading(true);
    try {
      const res = await fetch('/api/deploy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ network, contract, autoVerify }) });
      const data = await res.json();
      setStatus(data);
      if (autoVerify && data?.deployment?.address) {
        // fire-and-forget verify; in a real app, poll status
        fetch('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ network, address: data.deployment.address, constructorArgs: [] }) });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-white">One-Click Deploy</h1>
        <div className="bg-white/10 border border-white/20 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-blue-200 mb-1">Network</label>
            <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white" value={network} onChange={(e) => setNetwork(e.target.value)}>
              <option value="arbitrumSepolia">Arbitrum Sepolia (421614)</option>
              <option value="arbitrum">Arbitrum One (42161)</option>
              <option value="orbit:demo">Orbit Chain (demo)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-blue-2 00 mb-1">Contract</label>
            <input className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white" value={contract} onChange={(e) => setContract(e.target.value)} />
          </div>
          <label className="inline-flex items-center gap-2 text-blue-200 text-sm">
            <input type="checkbox" className="accent-blue-500" checked={autoVerify} onChange={(e)=>setAutoVerify(e.target.checked)} />
            Auto-verify on Arbiscan after deploy
          </label>
          <button onClick={startDeploy} disabled={loading} className="bg-gradient-to-r from-blue-900 to-blue-600 text-white py-2 px-4 rounded hover:from-blue-950 hover:to-blue-700">
            {loading ? 'Starting…' : 'Deploy'}
          </button>
        </div>
        {status && (
          <div className="bg-white/10 border border-white/20 rounded-xl p-6 text-blue-200">
            <div>Network: {status.deployment?.network}</div>
            <div>Contract: {status.deployment?.contract}</div>
            <div>Address: {status.deployment?.address}</div>
            <div>Tx: {status.deployment?.txHash}</div>
            {autoVerify && <div className="mt-2 text-xs text-blue-300">Verification: queued</div>}
          </div>
        )}
      </div>
    </div>
  );
}


