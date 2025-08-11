import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  const { txHash } = params || {};
  try {
    const { searchParams } = new URL(req.url);
    const sourceChain = Number(searchParams.get('sourceChain'));
    const targetChain = Number(searchParams.get('targetChain'));
    if (!txHash || !sourceChain || !targetChain) {
      return NextResponse.json({ success: false, error: 'Missing txHash, sourceChain, or targetChain' }, { status: 400 });
    }
    // Mock diff summary
    const summary = {
      txHash,
      source: { chainId: sourceChain, gasUsed: 120000, durationMs: 1200 },
      target: { chainId: targetChain, gasUsed: 45000, durationMs: 200 },
      deltas: { gasSaved: 75000, timeSavedMs: 1000 },
    };
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error('compare route error', error);
    return NextResponse.json({ success: false, error: 'Failed to compare' }, { status: 500 });
  }
}


