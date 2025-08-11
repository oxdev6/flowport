import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // MVP mock metrics; replace with snapshot aggregation
    const metrics = {
      avgGasSavedPerProject: 71234,
      topContracts: [
        { address: '0xabc...', interactions: 420 },
        { address: '0xdef...', interactions: 311 },
      ],
      adoptionTrend: [
        { date: '2025-07-01', projects: 10 },
        { date: '2025-07-15', projects: 14 },
        { date: '2025-08-01', projects: 21 },
      ],
    };
    return NextResponse.json({ success: true, metrics });
  } catch (error) {
    console.error('analytics metrics error', error);
    return NextResponse.json({ success: false, error: 'Failed to load metrics' }, { status: 500 });
  }
}


