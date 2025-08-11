import { NextResponse } from 'next/server';
import { getTraceFrames } from '../../../../../src/lib/tracing/provider.js';
import { logError } from '../../../../../src/lib/logger.js';

export async function GET(_req, context) {
  const { chainId, txHash } = await context.params;
  try {
    if (!chainId || !txHash) {
      return NextResponse.json({ success: false, error: 'Missing chainId or txHash' }, { status: 400 });
    }
    const { frames } = await getTraceFrames({ chainId: Number(chainId), txHash: String(txHash) });
    const nodes = Object.fromEntries(frames.map((f) => [f.id, { ...f, logs: f.logs || [] }]));
    const tokenTransfers = buildMockTransfers(nodes);
    const graph = {
      chainId: Number(chainId),
      txHash: String(txHash),
      blocks: { number: 0, timestamp: Date.now() / 1000 },
      rootNodeId: '0',
      nodes,
      tokenTransfers,
      gasTotals: { gasUsed: 15000 },
    };
    return NextResponse.json({ success: true, graph });
  } catch (error) {
    logError('api/graph', 'graph route error', error, { chainId, txHash });
    return NextResponse.json({ success: false, error: 'Failed to build graph' }, { status: 500 });
  }
}

function buildMockTransfers(nodes) {
  const ids = Object.keys(nodes || {});
  if (ids.length < 2) return [];
  // create a single example ERC-20 transfer linked to the first call
  return [
    {
      from: nodes[ids[0]].from || '0xfrom',
      to: nodes[ids[1]].to || '0xto',
      token: '0xToken000000000000000000000000000000000000',
      amount: '100.0',
      decimals: 18,
      symbol: 'DEMO',
      atNodeId: ids[1]
    }
  ];
}


