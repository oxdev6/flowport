import { getMockTrace } from './providers/mock.js';
import { getRpcTrace } from './providers/rpc.js';

// Select tracing source via env TRACING_PROVIDER: 'auto' | 'rpc' | 'mock'
// - auto: try rpc then fallback to mock
export async function getTraceFrames({ chainId, txHash }) {
  const mode = (process.env.TRACING_PROVIDER || 'auto').toLowerCase();
  if (mode === 'mock') return getMockTrace({ chainId, txHash });
  if (mode === 'rpc') {
    const rpc = await safeRpc({ chainId, txHash });
    if (rpc) return rpc;
    throw new Error('RPC tracing failed');
  }
  // auto
  const rpc = await safeRpc({ chainId, txHash });
  if (rpc) return rpc;
  return getMockTrace({ chainId, txHash });
}

async function safeRpc({ chainId, txHash }) {
  try {
    return await getRpcTrace({ chainId, txHash });
  } catch (_e) {
    return null;
  }
}


