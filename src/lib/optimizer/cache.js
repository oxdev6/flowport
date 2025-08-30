import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), '.optimizer-cache');

function ensureCacheDir() {
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch {}
}

export function computeSourceHash(source) {
  return crypto.createHash('sha256').update(source).digest('hex');
}

export function readCacheByHash(hash) {
  try {
    ensureCacheDir();
    const file = path.join(CACHE_DIR, `${hash}.json`);
    if (!fs.existsSync(file)) return null;
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeCacheByHash(hash, data) {
  try {
    ensureCacheDir();
    const file = path.join(CACHE_DIR, `${hash}.json`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch {}
}
