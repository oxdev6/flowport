import fs from 'fs';
import path from 'path';

export function loadOrbitConfig(configPath = process.env.ORBIT_CONFIG) {
  try {
    if (!configPath) return null;
    const p = path.resolve(process.cwd(), configPath);
    if (!fs.existsSync(p)) return null;
    const json = JSON.parse(fs.readFileSync(p, 'utf8'));
    // expected: { name, rpcUrl, chainId, explorerApiKey? }
    if (!json.rpcUrl || !json.chainId) return null;
    return json;
  } catch {
    return null;
  }
}


