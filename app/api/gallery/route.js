import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // MVP curated list of public snapshot metadata (mock)
    const gallery = [
      { id: 'demo-1', title: 'ERC-20 Transfer Burst', chainId: 421614, txHash: '0xabc' },
      { id: 'demo-2', title: 'NFT Mint', chainId: 421614, txHash: '0xabc' },
      { id: 'demo-3', title: 'Multi-call Migration', chainId: 421614, txHash: '0xabc' },
    ];
    return NextResponse.json({ success: true, gallery });
  } catch (error) {
    console.error('gallery error', error);
    return NextResponse.json({ success: false, error: 'Failed to load gallery' }, { status: 500 });
  }
}


