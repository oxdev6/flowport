import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

function isSlitherAvailable() {
  try {
    const r = spawnSync('slither', ['--version'], { stdio: 'ignore' });
    return r.status === 0;
  } catch {
    return false;
  }
}

export function slitherEnabled() {
  if (process.env.SLITHER_ENABLED === '1') return true;
  if (process.env.SLITHER_ENABLED === '0') return false;
  // auto-detect
  return isSlitherAvailable();
}

export function runSlitherOnSource(source) {
  if (!slitherEnabled()) return { suggestions: [], used: false };

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'optimizer-'));
  const solFile = path.join(tmpDir, 'Contract.sol');
  const outFile = path.join(tmpDir, 'slither.json');
  try {
    // Minimal wrapper around provided source
    fs.writeFileSync(
      solFile,
      source.startsWith('// SPDX-License-Identifier:') || source.includes('pragma solidity')
        ? source
        : `// SPDX-License-Identifier: UNLICENSED\npragma solidity ^0.8.0;\n${source}`,
      'utf8'
    );

    const args = [solFile, '--json', outFile];
    const r = spawnSync('slither', args, { encoding: 'utf8' });
    if (r.status !== 0) {
      return { suggestions: [], used: false };
    }
    if (!fs.existsSync(outFile)) return { suggestions: [], used: false };
    const raw = fs.readFileSync(outFile, 'utf8');
    const report = JSON.parse(raw);
    const suggestions = normalizeSlither(report);
    return { suggestions, used: true };
  } catch {
    return { suggestions: [], used: false };
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

function normalizeSlither(report) {
  const findings = Array.isArray(report?.results?.detectors) ? report.results.detectors : [];
  return findings.map((f) => {
    const title = f.check || f.short_description || 'Slither Finding';
    const description = f.description || f.explanation || f.full_description || 'Issue detected by Slither';
    const severity = (f.impact || f.impact_severity || 'Medium').toLowerCase();
    const priority = severity === 'high' ? 'high' : severity === 'low' ? 'low' : 'medium';
    return {
      type: 'slither_' + (f.check || 'issue'),
      priority,
      title,
      description,
      gas_savings: '0 gas (security finding)',
      recommendation: f.more_info || 'Review and remediate per Slither recommendation',
      impact: severity.charAt(0).toUpperCase() + severity.slice(1),
    };
  });
}
