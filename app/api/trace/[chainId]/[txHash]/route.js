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
    return NextResponse.json({ success: true, chainId: Number(chainId), txHash: String(txHash), frames });
  } catch (error) {
    logError('api/trace', 'trace route error', error, { chainId, txHash });
    return NextResponse.json({ success: false, error: 'Failed to trace tx' }, { status: 500 });
  }
}


