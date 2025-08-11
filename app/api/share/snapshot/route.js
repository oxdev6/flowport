import { NextResponse } from 'next/server';
import { createSnapshot } from '../../../../src/lib/snapshots/storage.js';

export async function POST(req) {
  try {
    const body = await req.json();
    const { graph, title, description, makePublic } = body || {};
    if (!graph || !graph.txHash) {
      return NextResponse.json({ success: false, error: 'Missing graph payload' }, { status: 400 });
    }
    const snapshot = await createSnapshot({ graph, title, description, makePublic: !!makePublic });
    return NextResponse.json({ success: true, snapshot });
  } catch (error) {
    console.error('snapshot create error', error);
    return NextResponse.json({ success: false, error: 'Failed to create snapshot' }, { status: 500 });
  }
}


