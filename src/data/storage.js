/**
 * Cloud-Only Storage Adapter
 *
 * All application collections and notes are stored exclusively in the Supabase Cloud.
 * Zero data is written to localStorage or local PC disk.
 */

export const DEFAULT_STATE = {
  collections: [],
  files: {},
};

let storageListeners = new Set();
let currentStatus = {
  isCloud: true,
  savedToPc: false,
  saving: false,
  pcPath: 'Cloud (Supabase)',
  lastSaved: null,
  error: null,
};

// Guarantee no stale data remains in localStorage
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('youtube-summary-app-v1');
  }
} catch {
  /* ignore */
}

export function subscribeStorageStatus(listener) {
  storageListeners.add(listener);
  listener(currentStatus);
  return () => storageListeners.delete(listener);
}

/**
 * Returns empty default state (real state is hydrated purely from Supabase Cloud)
 */
export function loadStateSync() {
  return DEFAULT_STATE;
}

/**
 * Cloud-only mode: No PC disk querying
 */
export async function loadStateFromPc() {
  return DEFAULT_STATE;
}

export function loadState() {
  return DEFAULT_STATE;
}

/**
 * No-op: Persistence is handled directly by syncService via Supabase
 */
export function saveState() {
  // Cloud-only mode: syncService handles all persistence to Supabase
}

export async function openPcNotesFolder() {
  return { success: false, message: 'Cloud-only mode: local folder disabled' };
}

export async function getPcStorageInfo() {
  return { isCloud: true, provider: 'Supabase' };
}
