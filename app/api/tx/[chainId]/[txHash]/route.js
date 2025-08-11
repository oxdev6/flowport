import { NextResponse } from 'next/server';

export async function GET(_req, context) {
  const { chainId, txHash } = await context.params;
  try {
    if (!chainId || !txHash) {
      return NextResponse.json({ success: false, error: 'Missing chainId or txHash' }, { status: 400 });
    }

    // MVP: return mocked metadata structure; integrate provider later
    const mock = {
      success: true,
      chainId: Number(chainId),
      txHash: String(txHash),
      tx: {
        from: '0x0000000000000000000000000000000000000000',
        to: '0x0000000000000000000000000000000000000001',
        value: '0',
        nonce: 0,
      },
      receipt: {
        status: 1,
        gasUsed: 21000,
        logs: [],
      },
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(mock);
  } catch (error) {
    console.error('tx route error', error);
    return NextResponse.json({ success: false, error: 'Failed to load tx' }, { status: 500 });
  }
}


