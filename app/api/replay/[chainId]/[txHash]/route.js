import { NextResponse } from 'next/server';
import { getTraceFrames } from '../../../../../src/lib/tracing/provider.js';
import { logError } from '../../../../../src/lib/logger.js';

export async function POST(_req, context) {
  const { chainId, txHash } = await context.params;
  try {
    if (!chainId || !txHash) {
      return NextResponse.json({ success: false, error: 'Missing chainId or txHash' }, { status: 400 });
    }
    const { frames } = await getTraceFrames({ chainId: Number(chainId), txHash: String(txHash) });
    let cumulative = 0;
    const replayFrames = frames.map((f, i) => {
      cumulative += Number(f.gasUsed || 0);
      return { step: i, stackDepth: f.depth || 0, nodeId: f.id, gasUsedCumulative: cumulative };
    });
    return NextResponse.json({ success: true, chainId: Number(chainId), txHash: String(txHash), frames: replayFrames });
  } catch (error) {
    logError('api/replay', 'replay route error', error, { chainId, txHash });
    return NextResponse.json({ success: false, error: 'Failed to build replay' }, { status: 500 });
  }
}


