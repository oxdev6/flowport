import { NextResponse } from 'next/server';
import { analyzeOptimizations } from '../../../src/lib/optimizer/index.js';
import { analyzeProjectWithSlither } from '../../../src/lib/optimizer/slitherProject.js';
import { analyzeWasm } from '../../../src/lib/wasm/analyze.js';

/**
 * Mock optimization scanner endpoint
 * In a real implementation, this would run static analysis tools
 * such as Slither, Sourcify metadata look-ups, or custom bytecode
 * heuristics to surface gas and security improvements specifically
 * for Arbitrum. For now we simply return hard-coded recommendations
 * so that the UI can demonstrate end-to-end functionality.
 */
export async function POST(request) {
  try {
    const { code = '', slither = undefined, projectDir = undefined, withDiagnostics = false, wasmPath = undefined } = await request.json();

    if (!code.trim()) {
      return NextResponse.json({ ok: false, error: 'No code provided' }, { status: 400 });
    }

    if (slither === true) process.env.SLITHER_ENABLED = '1';
    if (slither === false) process.env.SLITHER_ENABLED = '0';

    let suggestions = [];
    if (projectDir) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ ok: false, error: 'Project directory scans are disabled in production' }, { status: 403 });
      }
      suggestions = analyzeProjectWithSlither(projectDir) || [];
    } else {
      suggestions = await analyzeOptimizations(code);
    }

    let diagnostics = [];
    if (!projectDir && withDiagnostics) {
      try {
        const { spawnSync } = await import('child_process');
        const tmp = await import('os');
        const fs = await import('fs');
        const p = await import('path');
        const dir = fs.mkdtempSync(p.join(tmp.tmpdir(), 'sol-'));
        const file = p.join(dir, 'Contract.sol');
        fs.writeFileSync(file, code, 'utf8');
        const res = spawnSync('npx', ['solhint', '-f', 'json', file], { encoding: 'utf8' });
        if (res.status === 0 || res.stdout) {
          const out = JSON.parse(res.stdout || '[]');
          diagnostics = Array.isArray(out) ? out : [];
        }
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
      } catch {}
    }

    // Compute metrics
    const total = suggestions.length;
    const high = suggestions.filter((s) => s.priority === 'high').length;
    const medium = suggestions.filter((s) => s.priority === 'medium').length;
    const low = suggestions.filter((s) => s.priority === 'low').length;
    const totalGasSavings = suggestions.reduce((sum, s) => {
      const num = parseInt(s.gas_savings?.match(/\d+/)?.[0] || '0', 10);
      return sum + num;
    }, 0);

    const wasm = wasmPath ? analyzeWasm({ wasmPath }) : undefined;
    return NextResponse.json({
      ok: true,
      suggestions,
      metrics: {
        total,
        high,
        medium,
        low,
        totalGasSavings,
      },
      diagnostics,
      wasm,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message || 'Failed to parse request',
      },
      { status: 400 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      'POST Solidity source { code: "..." } to receive mock optimization suggestions',
  });
}
