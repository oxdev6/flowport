import { NextResponse } from 'next/server';

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
    const { code = '' } = await request.json();

    // Very light heuristic to pretend we analysed the code
    const usesPublicVars = code.includes('public');
    const suggestions = [];

    if (usesPublicVars) {
      suggestions.push({
        title: 'Prefer External over Public Functions',
        description:
          'Mark functions as external when they are not used internally to save ~20 gas per call.',
        severity: 'info',
      });
    }

    suggestions.push(
      {
        title: 'Enable Optimizer with 200 Runs',
        description:
          'Compile with `solc --optimize --optimize-runs 200` to reduce runtime gas on Arbitrum Nitro.',
        severity: 'info',
      },
      {
        title: 'Use Calldata for Memory-Only Parameters',
        description:
          'Change `function foo(uint256[] memory values)` to `function foo(uint256[] calldata values)` to avoid unnecessary copies.',
        severity: 'warning',
      },
      {
        title: 'Compress Storage Slots',
        description:
          'Pack `uint128`, `uint128` into a single slot to save 2100 gas on SSTORE during migration.',
        severity: 'info',
      },
    );

    return NextResponse.json({ ok: true, suggestions });
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
