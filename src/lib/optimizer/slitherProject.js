import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

function slitherAvailable() {
  try {
    const r = spawnSync('slither', ['--version'], { stdio: 'ignore' });
    return r.status === 0;
  } catch {
    return false;
  }
}

export function analyzeProjectWithSlither(projectDir) {
  if (!slitherAvailable()) return [];
  const dir = path.resolve(projectDir);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return [];
  const outFile = path.join(dir, `.slither-report-${Date.now()}.json`);
  try {
    const args = [dir, '--json', outFile];
    const r = spawnSync('slither', args, { encoding: 'utf8' });
    if (r.status !== 0) return [];
    if (!fs.existsSync(outFile)) return [];
    const raw = fs.readFileSync(outFile, 'utf8');
    const report = JSON.parse(raw);
    return normalize(report);
  } catch {
    return [];
  } finally {
    try { fs.unlinkSync(outFile); } catch {}
  }
}

function normalize(report) {
  const detectors = Array.isArray(report?.results?.detectors) ? report.results.detectors : [];
  return detectors.map((d) => {
    const severity = (d.impact || 'Medium').toLowerCase();
    const priority = severity === 'high' ? 'high' : severity === 'low' ? 'low' : 'medium';
    return {
      type: 'slither_project_' + (d.check || 'issue'),
      priority,
      title: d.check || d.short_description || 'Slither Project Finding',
      description: d.description || d.explanation || 'Project-level finding',
      gas_savings: '0 gas (security finding)',
      recommendation: d.more_info || 'Review per Slither recommendation',
      impact: severity.charAt(0).toUpperCase() + severity.slice(1),
    };
  });
}


