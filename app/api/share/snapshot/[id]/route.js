import { NextResponse } from 'next/server';
import { getSnapshot } from '../../../../../src/lib/snapshots/storage.js';

export async function GET(req, { params }) {
  const { id } = params || {};
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') || undefined;
    const snapshot = await getSnapshot({ id, token });
    if (!snapshot) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, snapshot });
  } catch (error) {
    console.error('snapshot fetch error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch snapshot' }, { status: 500 });
  }
}


