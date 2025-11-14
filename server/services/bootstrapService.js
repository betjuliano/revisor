import { initializeDatabase } from '../db.js';
import { ensureSnapshotExists } from './snapshotService.js';

export const databaseReady = initializeDatabase();
export const snapshotReady = ensureSnapshotExists();

export async function ensureReady() {
  await Promise.all([databaseReady, snapshotReady]);
}
