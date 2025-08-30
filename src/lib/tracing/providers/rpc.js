import { ethers } from 'ethers';

// Minimal RPC-based tracer using debug_traceTransaction when available.
// Falls back to empty to let caller use mock.
export async function getRpcTrace({ chainId, txHash }) {
  const url = pickRpcUrl(chainId);
  if (!url) throw new Error('No RPC URL configured');
  const provider = new ethers.JsonRpcProvider(url);
  // Fetch trace via debug_traceTransaction if the node supports it
  try {
    const trace = await provider.send('debug_traceTransaction', [txHash, { tracer: 'callTracer' }]);
    const frames = flattenCallTracer(trace);
    return { chainId, txHash, frames };
  } catch (e) {
    // As a lighter fallback, build a single-frame graph from receipt basics
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!tx || !receipt) throw e;
    const frames = [
      { id: '0', parentId: null, type: 'CALL', from: tx.from, to: tx.to, functionSig: '0x', functionName: 'tx', gasUsed: Number(receipt.gasUsed), depth: 0, status: receipt.status ? 'success' : 'revert', children: [] },
    ];
    return { chainId, txHash, frames };
  }
}

function pickRpcUrl(chainId) {
  // Read from env, e.g., ARB_SEPOLIA_RPC and ETH_SEPOLIA_RPC
  if (String(chainId) === '421614') return process.env.ARB_SEPOLIA_RPC || process.env.ETH_RPC_URL;
  if (String(chainId) === '11155111') return process.env.ETH_SEPOLIA_RPC || process.env.ETH_RPC_URL;
  return process.env.ETH_RPC_URL || null;
}

function flattenCallTracer(root) {
  const frames = [];
  let id = 0;
  function walk(node, parentId, depth) {
    const myId = String(id++);
    frames.push({ id: myId, parentId, type: node.type || 'CALL', from: node.from, to: node.to, functionSig: node.input?.slice(0, 10) || '0x', functionName: '', gasUsed: Number(node.gasUsed || 0), depth, status: 'success', children: [] });
    if (Array.isArray(node.calls)) {
      for (const c of node.calls) {
        const childId = walk(c, myId, depth + 1);
        frames[frames.length - 1].children.push(childId);
      }
    }
    return myId;
  }
  walk(root, null, 0);
  // backfill children arrays
  const _byId = Object.fromEntries(frames.map((f) => [f.id, f]));
  for (const f of frames) {
    if (Array.isArray(f.children)) continue; // already set
    f.children = [];
  }
  return frames;
}


