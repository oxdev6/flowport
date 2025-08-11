import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

function getStorageDir() {
  const dir = process.env.SNAPSHOT_STORAGE_DIR || 'reports/snapshots';
  return path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function randomId() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

function randomToken() {
  return crypto.randomBytes(24).toString('base64url');
}

export async function createSnapshot({ graph, title, description, makePublic = false }) {
  const id = randomId();
  const shareToken = makePublic ? randomToken() : undefined;
  const snapshot = {
    id,
    version: 'v1',
    createdAt: new Date().toISOString(),
    public: !!makePublic,
    title: title || `Tx ${graph.txHash.slice(0, 10)}...`,
    description: description || '',
    shareToken,
    graph,
  };
  const dir = getStorageDir();
  await ensureDir(dir);
  const file = path.join(dir, `${id}.json`);
  await fs.writeFile(file, JSON.stringify(snapshot, null, 2));
  return snapshot;
}

export async function getSnapshot({ id, token }) {
  const dir = getStorageDir();
  const file = path.join(dir, `${id}.json`);
  try {
    const raw = await fs.readFile(file, 'utf8');
    const data = JSON.parse(raw);
    if (!data.public) {
      if (!token || token !== data.shareToken) return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}


