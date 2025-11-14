import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const dataDir = path.join(projectRoot, 'data');
const snapshotPath = path.join(dataDir, 'users.json');

let ensurePromise;
let writeQueue = Promise.resolve();

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

export function getSnapshotPath() {
  return snapshotPath;
}

export async function ensureSnapshotExists() {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await ensureDataDir();
      try {
        await fs.access(snapshotPath);
      } catch {
        const initialPayload = {
          updatedAt: new Date().toISOString(),
          users: [],
          transactions: {},
        };
        await writeSnapshot(initialPayload);
      }
    })();
  }
  await ensurePromise;
}

function enqueueWrite(task) {
  const next = writeQueue.then(task);
  writeQueue = next.catch(() => {});
  return next;
}

export function writeSnapshot(payload) {
  return enqueueWrite(async () => {
    await ensureDataDir();
    const tempPath = `${snapshotPath}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(payload, null, 2), 'utf-8');
    await fs.rename(tempPath, snapshotPath);
  });
}

export async function persistSnapshot(users, transactionsMap) {
  await ensureSnapshotExists();
  const payload = {
    updatedAt: new Date().toISOString(),
    users,
    transactions: transactionsMap,
  };
  await writeSnapshot(payload);
}

export async function readSnapshot() {
  await ensureSnapshotExists();
  const raw = await fs.readFile(snapshotPath, 'utf-8');
  return JSON.parse(raw);
}
