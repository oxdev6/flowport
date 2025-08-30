import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { network = 'arbitrumSepolia', address = '', constructorArgs = [] } = body || {};
    if (!address) return NextResponse.json({ success: false, error: 'Missing address' }, { status: 400 });

    // Best-effort spawn for local/dev use
    const { spawn } = await import('child_process');
    const args = ['hardhat', 'verify', '--network', network, address, ...constructorArgs.map(String)];

    const out = [];
    const err = [];
    const proc = spawn('npx', args, { cwd: process.cwd(), env: process.env });
    proc.stdout.on('data', (d) => out.push(String(d)));
    proc.stderr.on('data', (d) => err.push(String(d)));

    const code = await new Promise((resolve) => proc.on('exit', (c) => resolve(c ?? 0)));
    const stdout = out.join('');
    const stderr = err.join('');
    const ok = code === 0 || /Already Verified/i.test(stdout + stderr);
    return NextResponse.json({ success: ok, code, stdout, stderr });
  } catch (e) {
    return NextResponse.json({ success: false, error: e?.message || 'verify failed' }, { status: 500 });
  }
}


