import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(_req, context) {
  const { id } = await context.params;
  try {
    const root = process.cwd();
    const filePath = path.join(root, 'reports', `${id}.json`);
    const htmlPath = path.join(root, 'reports', `${id}.html`);
    let json = {};
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      json = JSON.parse(raw);
    } catch { /* use empty json */ }
    let html = '';
    try {
      html = await fs.readFile(htmlPath, 'utf8');
    } catch { /* optional */ }
    return NextResponse.json({ success: true, report: { id, json, html } });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
  }
}


