import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const root = process.cwd();
    const filePath = path.join(root, 'reports', 'analysis-123456.json');
    let report;
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      report = JSON.parse(raw);
    } catch {
      report = buildMock();
    }

    const list = [
      {
        id: 'analysis-123456',
        title: 'Pre‑Migration Report — Demo Project',
        summary: {
          avgGasSaved: report?.gas_analysis?.savings_percentage || 95.0,
          risk: report?.migration?.risk_level || 'Low',
          difficulty: report?.migration?.difficulty || 'Easy',
        },
        createdAt: '2025-08-10'
      }
    ];
    return NextResponse.json({ success: true, reports: list });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to list reports' }, { status: 500 });
  }
}

function buildMock() {
  return {
    migration: { risk_level: 'Low', difficulty: 'Easy' },
    gas_analysis: { savings_percentage: 95.0 }
  };
}


