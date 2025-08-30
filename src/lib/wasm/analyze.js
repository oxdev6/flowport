import { spawnSync } from 'child_process';

function run(cmd, args) {
  try {
    const res = spawnSync(cmd, args, { encoding: 'utf8' });
    return { code: res.status ?? 0, stdout: res.stdout || '', stderr: res.stderr || '' };
  } catch (e) {
    return { code: 127, stdout: '', stderr: e?.message || 'failed to spawn' };
  }
}

export function analyzeWasm({ wasmPath, outOptimizedPath, optLevel = 'O3' }) {
  const reports = {};
  // wasm-opt
  const opt = run('wasm-opt', [`-${optLevel}`, '--vacuum', '--metrics', wasmPath, '-o', outOptimizedPath || wasmPath]);
  reports.wasmOpt = opt;
  // twiggy top
  const top = run('twiggy', ['top', wasmPath]);
  reports.twiggyTop = top;
  // twiggy paths (most impactful)
  const paths = run('twiggy', ['paths', wasmPath]);
  reports.twiggyPaths = paths;
  return reports;
}


