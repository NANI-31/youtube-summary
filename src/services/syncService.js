import { supabase, isSupabaseConfigured } from '../utils/supabase.js';
import { addApiLog } from './apiLogger.js';
import { saveSettings } from '../data/settings.js';

export const SUPABASE_SETTINGS_SQL = `-- Run this once in your Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'app_settings',
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  thumbnail JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access to read and write app settings
DROP POLICY IF EXISTS "Allow anon all on settings" ON public.settings;
CREATE POLICY "Allow anon all on settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
`;

let pushTimeout = null;
let statusListeners = new Set();
let currentSyncStatus = {
  configured: isSupabaseConfigured(),
  status: isSupabaseConfigured() ? 'idle' : 'unconfigured', // 'idle' | 'syncing' | 'synced' | 'error' | 'unconfigured'
  lastSynced: null,
  error: null,
};

function notifySyncStatus(update) {
  currentSyncStatus = { ...currentSyncStatus, ...update };
  statusListeners.forEach((fn) => {
    try {
      fn(currentSyncStatus);
    } catch (e) {
      console.error('[syncService] Listener error:', e);
    }
  });
}

/**
 * Subscribe to sync status updates
 */
export function subscribeSyncStatus(listener) {
  statusListeners.add(listener);
  listener(currentSyncStatus);
  return () => statusListeners.delete(listener);
}

export function getSyncStatus() {
  return currentSyncStatus;
}

let settingsPushTimeout = null;
let pendingPushSettings = null;
let settingsStatusListeners = new Set();
let currentSettingsSyncStatus = {
  configured: isSupabaseConfigured(),
  status: isSupabaseConfigured() ? 'idle' : 'unconfigured', // 'idle' | 'syncing' | 'synced' | 'table_missing' | 'error' | 'unconfigured'
  lastSynced: null,
  error: null,
};

function notifySettingsSyncStatus(update) {
  currentSettingsSyncStatus = { ...currentSettingsSyncStatus, ...update };
  settingsStatusListeners.forEach((fn) => {
    try {
      fn(currentSettingsSyncStatus);
    } catch (e) {
      console.error('[syncService] Settings listener error:', e);
    }
  });
}

/**
 * Subscribe to settings sync status updates
 */
export function subscribeSettingsSyncStatus(listener) {
  settingsStatusListeners.add(listener);
  listener(currentSettingsSyncStatus);
  return () => settingsStatusListeners.delete(listener);
}

export function getSettingsSyncStatus() {
  return currentSettingsSyncStatus;
}

/**
 * Flatten recursive Redux collections tree into flat database rows with parent_id
 */
export function flattenCollections(collections, parentId = null) {
  let flat = [];
  if (!Array.isArray(collections)) return flat;

  const cleanParentId =
    parentId && typeof parentId === 'string' && parentId.trim() !== ''
      ? parentId.trim()
      : null;

  for (const col of collections) {
    flat.push({
      id: col.id,
      name: col.name || 'Untitled Folder',
      parent_id: cleanParentId,
      created_at: col.createdAt || col.created_at || new Date().toISOString(),
      updated_at: col.updatedAt || col.updated_at || new Date().toISOString(),
    });
    if (col.children && col.children.length > 0) {
      flat = flat.concat(flattenCollections(col.children, col.id));
    }
  }
  return flat;
}

/**
 * Sort flat collections so parents appear before children (prevents foreign key constraint errors)
 */
export function sortCollectionsByHierarchy(flatCollections) {
  const depthMap = new Map();
  // Level 0: root nodes (parent_id == null)
  flatCollections.forEach((c) => {
    if (!c.parent_id) depthMap.set(c.id, 0);
  });

  let changed = true;
  let passes = 0;
  while (changed && passes < 20) {
    changed = false;
    passes++;
    flatCollections.forEach((c) => {
      if (!depthMap.has(c.id) && c.parent_id && depthMap.has(c.parent_id)) {
        depthMap.set(c.id, depthMap.get(c.parent_id) + 1);
        changed = true;
      }
    });
  }

  flatCollections.forEach((c) => {
    if (!depthMap.has(c.id)) depthMap.set(c.id, 99);
  });

  return [...flatCollections].sort((a, b) => (depthMap.get(a.id) || 0) - (depthMap.get(b.id) || 0));
}

/**
 * Unflatten database rows into recursive Redux collection tree structure
 */
export function unflattenCollections(flatCollections, files = {}) {
  const map = {};
  const roots = [];

  for (const item of flatCollections) {
    map[item.id] = {
      id: item.id,
      name: item.name,
      children: [],
      fileIds: [],
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      updatedAt: item.updated_at || item.updatedAt || new Date().toISOString(),
    };
  }

  // Populate fileIds for collections
  for (const [fileId, file] of Object.entries(files)) {
    const colId = file.collectionId || file.collection_id;
    if (colId && map[colId]) {
      if (!map[colId].fileIds.includes(fileId)) {
        map[colId].fileIds.push(fileId);
      }
    }
  }

  // Construct hierarchy
  for (const item of flatCollections) {
    const parentId = item.parent_id || item.parentId;
    if (parentId && map[parentId] && parentId !== item.id) {
      if (!map[parentId].children.some((c) => c.id === item.id)) {
        map[parentId].children.push(map[item.id]);
      }
    } else {
      if (!roots.some((r) => r.id === item.id)) {
        roots.push(map[item.id]);
      }
    }
  }

  return roots;
}

/**
 * Convert Redux files dictionary to Supabase notes table rows
 */
export function notesToSupabaseRows(files = {}) {
  return Object.values(files).map((file) => {
    let colId = null;
    if (file.collectionId && typeof file.collectionId === 'string' && file.collectionId.trim() !== '') {
      colId = file.collectionId.trim();
    } else if (file.collection_id && typeof file.collection_id === 'string' && file.collection_id.trim() !== '') {
      colId = file.collection_id.trim();
    }

    return {
      id: file.id,
      name: file.name || 'Untitled.md',
      content: file.content || '',
      youtube_url: file.youtubeUrl || file.youtube_url || '',
      youtube_video_id: file.youtubeVideoId || file.youtube_video_id || '',
      youtube_title: file.youtubeTitle || file.youtube_title || '',
      collection_id: colId,
      created_at: file.createdAt || file.created_at || new Date().toISOString(),
      updated_at: file.updatedAt || file.updated_at || new Date().toISOString(),
    };
  });
}

/**
 * Convert Supabase notes table rows to Redux files dictionary
 */
export function supabaseRowsToFiles(rows = []) {
  const files = {};
  for (const row of rows) {
    files[row.id] = {
      id: row.id,
      name: row.name || 'Untitled.md',
      content: row.content || '',
      youtubeUrl: row.youtube_url || '',
      youtubeVideoId: row.youtube_video_id || '',
      youtubeTitle: row.youtube_title || '',
      collectionId: row.collection_id || null,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    };
  }
  return files;
}

/**
 * Pull all data from Supabase and return Redux-formatted state
 */
export async function pullFromSupabase() {
  if (!isSupabaseConfigured() || !supabase) {
    notifySyncStatus({ configured: false, status: 'unconfigured' });
    return null;
  }

  notifySyncStatus({ configured: true, status: 'syncing', error: null });

  try {
    const colStart = performance.now();
    const colsRes = await supabase.from('collections').select('*');
    const colLatency = performance.now() - colStart;

    if (colsRes.error) {
      addApiLog({
        operation: 'SELECT',
        table: 'collections',
        endpoint: '/rest/v1/collections?select=*',
        status: 'error',
        statusCode: colsRes.status || 500,
        latencyMs: colLatency,
        summary: `Query collections failed: ${colsRes.error.message}`,
        details: colsRes.error,
      });
      throw new Error(`Collections query failed: ${colsRes.error.message}`);
    }

    addApiLog({
      operation: 'SELECT',
      table: 'collections',
      endpoint: '/rest/v1/collections?select=*',
      status: 'success',
      statusCode: colsRes.status || 200,
      latencyMs: colLatency,
      recordsCount: (colsRes.data || []).length,
      summary: `Retrieved ${(colsRes.data || []).length} collections`,
      details: { count: (colsRes.data || []).length },
    });

    const noteStart = performance.now();
    const notesRes = await supabase.from('notes').select('*');
    const noteLatency = performance.now() - noteStart;

    if (notesRes.error) {
      addApiLog({
        operation: 'SELECT',
        table: 'notes',
        endpoint: '/rest/v1/notes?select=*',
        status: 'error',
        statusCode: notesRes.status || 500,
        latencyMs: noteLatency,
        summary: `Query notes failed: ${notesRes.error.message}`,
        details: notesRes.error,
      });
      throw new Error(`Notes query failed: ${notesRes.error.message}`);
    }

    addApiLog({
      operation: 'SELECT',
      table: 'notes',
      endpoint: '/rest/v1/notes?select=*',
      status: 'success',
      statusCode: notesRes.status || 200,
      latencyMs: noteLatency,
      recordsCount: (notesRes.data || []).length,
      summary: `Retrieved ${(notesRes.data || []).length} notes`,
      details: { count: (notesRes.data || []).length },
    });

    const rawCols = colsRes.data || [];
    const rawNotes = notesRes.data || [];

    // If remote database has data, convert to Redux format
    if (rawCols.length > 0 || rawNotes.length > 0) {
      const validColIds = new Set(rawCols.map((c) => c.id));
      // Auto-heal notes whose collection_id points to a non-existent or deleted collection
      const healedNotes = rawNotes.map((note) => {
        if (note.collection_id && !validColIds.has(note.collection_id)) {
          console.warn(
            `[syncService] Note "${note.name}" (${note.id}) pointed to non-existent collection "${note.collection_id}". Recovered to root.`
          );
          return { ...note, collection_id: null };
        }
        return note;
      });

      const files = supabaseRowsToFiles(healedNotes);
      const collections = unflattenCollections(rawCols, files);

      notifySyncStatus({
        status: 'synced',
        lastSynced: new Date().toLocaleTimeString(),
        error: null,
      });

      return { collections, files, source: 'supabase' };
    }

    notifySyncStatus({ status: 'idle', error: null });
    return { collections: [], files: {}, source: 'supabase-empty' };
  } catch (err) {
    console.warn('[syncService] Pull failed:', err.message);
    notifySyncStatus({ status: 'error', error: err.message });
    return null;
  }
}

let pendingPushState = null;

/**
 * Debounced push to Supabase to mirror state changes
 */
export function queuePush(state, delayMs = 600) {
  if (!isSupabaseConfigured() || !supabase) return;

  pendingPushState = state;
  notifySyncStatus({ configured: true, status: 'syncing' });

  if (pushTimeout) clearTimeout(pushTimeout);

  pushTimeout = setTimeout(async () => {
    try {
      const toPush = pendingPushState;
      pendingPushState = null;
      if (toPush) {
        await pushToSupabase(toPush);
      }
      notifySyncStatus({
        status: 'synced',
        lastSynced: new Date().toLocaleTimeString(),
        error: null,
      });
    } catch (err) {
      console.error('[syncService] Push failed:', err);
      notifySyncStatus({ status: 'error', error: err.message });
    }
  }, delayMs);
}

// Flush pending changes before page unloads or reloads to prevent lost updates
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (pendingPushState && pushTimeout) {
      clearTimeout(pushTimeout);
      pushToSupabase(pendingPushState).catch(() => {});
      pendingPushState = null;
    }
  });
}

/**
 * Push collections and notes directly to Supabase with upsert & prune deletions
 */
export async function pushToSupabase({ collections, files }) {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase is not configured. Please add credentials in .env.');
  }

  const flatCollections = sortCollectionsByHierarchy(flattenCollections(collections));
  const noteRows = notesToSupabaseRows(files);

  // 1. Upsert collections
  if (flatCollections.length > 0) {
    const start = performance.now();
    const { error: colErr, status } = await supabase
      .from('collections')
      .upsert(flatCollections, { onConflict: 'id' });
    const latency = performance.now() - start;

    if (colErr) {
      addApiLog({
        operation: 'UPSERT',
        table: 'collections',
        endpoint: '/rest/v1/collections',
        status: 'error',
        statusCode: status || 500,
        latencyMs: latency,
        summary: `Upsert collections failed: ${colErr.message}`,
        details: colErr,
      });
      throw new Error(`Collections sync error: ${colErr.message}`);
    }

    addApiLog({
      operation: 'UPSERT',
      table: 'collections',
      endpoint: '/rest/v1/collections',
      status: 'success',
      statusCode: status || 201,
      latencyMs: latency,
      recordsCount: flatCollections.length,
      summary: `Upserted ${flatCollections.length} collection folder(s)`,
      details: { collections: flatCollections.map((c) => ({ id: c.id, name: c.name })) },
    });
  }

  // 2. Upsert notes
  if (noteRows.length > 0) {
    const start = performance.now();
    const { error: noteErr, status } = await supabase
      .from('notes')
      .upsert(noteRows, { onConflict: 'id' });
    const latency = performance.now() - start;

    if (noteErr) {
      addApiLog({
        operation: 'UPSERT',
        table: 'notes',
        endpoint: '/rest/v1/notes',
        status: 'error',
        statusCode: status || 500,
        latencyMs: latency,
        summary: `Upsert notes failed: ${noteErr.message}`,
        details: noteErr,
      });
      throw new Error(`Notes sync error: ${noteErr.message}`);
    }

    addApiLog({
      operation: 'UPSERT',
      table: 'notes',
      endpoint: '/rest/v1/notes',
      status: 'success',
      statusCode: status || 201,
      latencyMs: latency,
      recordsCount: noteRows.length,
      summary: `Upserted ${noteRows.length} note(s)`,
      details: { notes: noteRows.map((n) => ({ id: n.id, name: n.name })) },
    });
  }

  return { success: true };
}

/**
 * Explicitly delete a collection and its entire subtree from Supabase (safe, targeted deletion).
 */
export async function deleteCollectionFromSupabase(collectionId, deletedFileIds = [], subColIds = []) {
  if (!isSupabaseConfigured() || !supabase || !collectionId) return;

  const start = performance.now();
  const allColIds = Array.from(new Set([collectionId, ...(subColIds || [])]));

  // 1. Delete all notes belonging to ANY of these collections
  await supabase.from('notes').delete().in('collection_id', allColIds);

  // 2. Also delete any specific note IDs that were in that collection subtree if passed
  if (Array.isArray(deletedFileIds) && deletedFileIds.length > 0) {
    await supabase.from('notes').delete().in('id', deletedFileIds);
  }

  // 3. Delete any child subcollections whose parent_id points to any of these collections
  await supabase.from('collections').delete().in('parent_id', allColIds);

  // 4. Delete all the collections themselves
  const { error, status } = await supabase.from('collections').delete().in('id', allColIds);
  const latency = performance.now() - start;

  addApiLog({
    operation: 'DELETE',
    table: 'collections',
    endpoint: `/rest/v1/collections?id=in.(${allColIds.join(',')})`,
    status: error ? 'error' : 'success',
    statusCode: status || 204,
    latencyMs: latency,
    recordsCount: allColIds.length,
    summary: `Deleted collection folder(s) and associated notes (${allColIds.length} folder(s))`,
    details: { collectionIds: allColIds, deletedFileIds, error },
  });
}

/**
 * Explicitly delete a single note from Supabase (safe, targeted deletion).
 */
export async function deleteNoteFromSupabase(noteId) {
  if (!isSupabaseConfigured() || !supabase || !noteId) return;

  const start = performance.now();
  const { error, status } = await supabase.from('notes').delete().eq('id', noteId);
  const latency = performance.now() - start;

  addApiLog({
    operation: 'DELETE',
    table: 'notes',
    endpoint: `/rest/v1/notes?id=eq.${noteId}`,
    status: error ? 'error' : 'success',
    statusCode: status || 204,
    latencyMs: latency,
    recordsCount: 1,
    summary: `Explicitly deleted note (${noteId})`,
    details: { id: noteId, error },
  });
}

/**
 * Initial One-Click Migration Utility:
 * Imports local notes and collections directly into Supabase.
 */
export async function migrateLocalDataToSupabase(customData = null) {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase is not configured. Please fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
  }

  notifySyncStatus({ configured: true, status: 'syncing', error: null });

  let dataToMigrate = customData;

  // 1. Try reading from ./data/storage.json via /api/storage
  if (!dataToMigrate) {
    try {
      const res = await fetch('/api/storage');
      if (res.ok) {
        const json = await res.json();
        if ((json.collections && json.collections.length > 0) || (json.files && Object.keys(json.files).length > 0)) {
          dataToMigrate = json;
        }
      }
    } catch {
      /* ignore */
    }
  }

  // 2. Fall back to customData or empty
  if (!dataToMigrate) {
    dataToMigrate = { collections: [], files: {} };
  }

  const collections = dataToMigrate?.collections || [];
  const files = dataToMigrate?.files || {};

  const flatCollections = sortCollectionsByHierarchy(flattenCollections(collections));
  const noteRows = notesToSupabaseRows(files);

  if (flatCollections.length === 0 && noteRows.length === 0) {
    notifySyncStatus({ status: 'synced', error: null });
    return {
      success: true,
      collectionsCount: 0,
      notesCount: 0,
      message: 'No collections or notes found to migrate.',
    };
  }

  const migStart = performance.now();

  // Insert collections in hierarchical order
  if (flatCollections.length > 0) {
    const { error: colErr, status } = await supabase
      .from('collections')
      .upsert(flatCollections, { onConflict: 'id' });
    if (colErr) {
      addApiLog({
        operation: 'MIGRATE',
        table: 'collections',
        endpoint: '/rest/v1/collections',
        status: 'error',
        statusCode: status || 500,
        latencyMs: performance.now() - migStart,
        summary: `Migration failed on collections: ${colErr.message}`,
        details: colErr,
      });
      notifySyncStatus({ status: 'error', error: colErr.message });
      throw new Error(`Failed to migrate collections: ${colErr.message}`);
    }
  }

  // Insert notes
  if (noteRows.length > 0) {
    const { error: notesErr, status } = await supabase
      .from('notes')
      .upsert(noteRows, { onConflict: 'id' });
    if (notesErr) {
      addApiLog({
        operation: 'MIGRATE',
        table: 'notes',
        endpoint: '/rest/v1/notes',
        status: 'error',
        statusCode: status || 500,
        latencyMs: performance.now() - migStart,
        summary: `Migration failed on notes: ${notesErr.message}`,
        details: notesErr,
      });
      notifySyncStatus({ status: 'error', error: notesErr.message });
      throw new Error(`Failed to migrate notes: ${notesErr.message}`);
    }
  }

  const totalLatency = performance.now() - migStart;
  addApiLog({
    operation: 'MIGRATE',
    table: 'system',
    endpoint: '/rest/v1/collections & notes',
    status: 'success',
    statusCode: 200,
    latencyMs: totalLatency,
    recordsCount: flatCollections.length + noteRows.length,
    summary: `Migrated ${flatCollections.length} collections and ${noteRows.length} notes`,
    details: { collections: flatCollections.length, notes: noteRows.length },
  });

  notifySyncStatus({
    status: 'synced',
    lastSynced: new Date().toLocaleTimeString(),
    error: null,
  });

  return {
    success: true,
    collectionsCount: flatCollections.length,
    notesCount: noteRows.length,
  };
}

/**
 * Save custom user settings (Theme, Syntax Colors, Preview Width, Thumbnails) to Supabase
 */
export async function pushSettingsToSupabase(settings) {
  if (!isSupabaseConfigured() || !supabase) {
    notifySettingsSyncStatus({ configured: false, status: 'unconfigured' });
    return { success: false, error: 'Supabase is not configured' };
  }

  notifySettingsSyncStatus({ configured: true, status: 'syncing', error: null });
  const start = performance.now();

  const payload = {
    id: 'app_settings',
    theme: settings?.theme || {},
    thumbnail: settings?.thumbnail || {},
    updated_at: new Date().toISOString(),
  };

  try {
    const { error, status } = await supabase
      .from('settings')
      .upsert([payload], { onConflict: 'id' });
    const latency = performance.now() - start;

    if (error) {
      const isMissingTable =
        error.code === 'PGRST205' ||
        (error.message && error.message.toLowerCase().includes('schema cache')) ||
        (error.message && error.message.toLowerCase().includes('settings'));

      addApiLog({
        operation: 'UPSERT',
        table: 'settings',
        endpoint: '/rest/v1/settings',
        status: isMissingTable ? 'warning' : 'error',
        statusCode: status || 500,
        latencyMs: latency,
        summary: isMissingTable
          ? 'Table "settings" not found in Supabase. Run SQL schema in Supabase dashboard to enable cloud settings.'
          : `Upsert settings failed: ${error.message}`,
        details: error,
      });

      notifySettingsSyncStatus({
        status: isMissingTable ? 'table_missing' : 'error',
        error: error.message,
      });

      return { success: false, tableMissing: isMissingTable, error: error.message };
    }

    addApiLog({
      operation: 'UPSERT',
      table: 'settings',
      endpoint: '/rest/v1/settings',
      status: 'success',
      statusCode: status || 200,
      latencyMs: latency,
      recordsCount: 1,
      summary: 'Saved custom settings (Theme, Editor Colors, Preview Dimensions, Thumbnail) to Supabase',
      details: {
        themeKeys: Object.keys(payload.theme || {}),
        editorColorsCount: Object.keys(payload.theme?.editorColors || {}).length,
        previewColorsCount: Object.keys(payload.theme?.previewColors || {}).length,
        thumbnailKeys: Object.keys(payload.thumbnail || {}),
      },
    });

    notifySettingsSyncStatus({
      status: 'synced',
      lastSynced: new Date().toLocaleTimeString(),
      error: null,
    });

    return { success: true };
  } catch (err) {
    const latency = performance.now() - start;
    addApiLog({
      operation: 'UPSERT',
      table: 'settings',
      endpoint: '/rest/v1/settings',
      status: 'error',
      statusCode: 500,
      latencyMs: latency,
      summary: `Network error saving settings: ${err.message}`,
      details: err,
    });
    notifySettingsSyncStatus({ status: 'error', error: err.message });
    return { success: false, error: err.message };
  }
}

/**
 * Retrieve custom settings from Supabase
 */
export async function pullSettingsFromSupabase() {
  if (!isSupabaseConfigured() || !supabase) {
    notifySettingsSyncStatus({ configured: false, status: 'unconfigured' });
    return null;
  }

  notifySettingsSyncStatus({ configured: true, status: 'syncing', error: null });
  const start = performance.now();

  try {
    const { data, error, status } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 'app_settings')
      .maybeSingle();
    const latency = performance.now() - start;

    if (error) {
      const isMissingTable =
        error.code === 'PGRST205' ||
        (error.message && error.message.toLowerCase().includes('schema cache')) ||
        (error.message && error.message.toLowerCase().includes('settings'));

      addApiLog({
        operation: 'SELECT',
        table: 'settings',
        endpoint: '/rest/v1/settings?id=eq.app_settings',
        status: isMissingTable ? 'warning' : 'error',
        statusCode: status || 500,
        latencyMs: latency,
        summary: isMissingTable
          ? 'Table "settings" not found in Supabase. Run SQL schema script to enable cloud settings.'
          : `Fetch settings failed: ${error.message}`,
        details: error,
      });

      notifySettingsSyncStatus({
        status: isMissingTable ? 'table_missing' : 'error',
        error: error.message,
      });
      return null;
    }

    if (data && (data.theme || data.thumbnail)) {
      addApiLog({
        operation: 'SELECT',
        table: 'settings',
        endpoint: '/rest/v1/settings?id=eq.app_settings',
        status: 'success',
        statusCode: status || 200,
        latencyMs: latency,
        recordsCount: 1,
        summary: 'Retrieved custom settings from Supabase',
        details: {
          hasTheme: Boolean(data.theme),
          hasThumbnail: Boolean(data.thumbnail),
          updatedAt: data.updated_at,
        },
      });

      notifySettingsSyncStatus({
        status: 'synced',
        lastSynced: new Date().toLocaleTimeString(),
        error: null,
      });

      return {
        theme: data.theme || {},
        thumbnail: data.thumbnail || {},
        updatedAt: data.updated_at,
      };
    }

    addApiLog({
      operation: 'SELECT',
      table: 'settings',
      endpoint: '/rest/v1/settings?id=eq.app_settings',
      status: 'success',
      statusCode: status || 200,
      latencyMs: latency,
      recordsCount: 0,
      summary: 'Settings table is empty in Supabase (will auto-populate on next change)',
      details: null,
    });

    notifySettingsSyncStatus({
      status: 'idle',
      error: null,
    });

    return null;
  } catch (err) {
    const latency = performance.now() - start;
    addApiLog({
      operation: 'SELECT',
      table: 'settings',
      endpoint: '/rest/v1/settings?id=eq.app_settings',
      status: 'error',
      statusCode: 500,
      latencyMs: latency,
      summary: `Network error retrieving settings: ${err.message}`,
      details: err,
    });
    notifySettingsSyncStatus({ status: 'error', error: err.message });
    return null;
  }
}

/**
 * Debounced queue to push settings to Supabase on slider/picker changes
 */
export function queuePushSettings(settings, delayMs = 600) {
  if (!isSupabaseConfigured() || !supabase) return;

  pendingPushSettings = settings;
  notifySettingsSyncStatus({ configured: true, status: 'syncing' });

  if (settingsPushTimeout) clearTimeout(settingsPushTimeout);

  settingsPushTimeout = setTimeout(async () => {
    try {
      const toPush = pendingPushSettings;
      pendingPushSettings = null;
      if (toPush) {
        await pushSettingsToSupabase(toPush);
      }
    } catch (err) {
      console.error('[syncService] Settings push failed:', err);
    }
  }, delayMs);
}

// Flush pending settings before page unloads
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (pendingPushSettings && settingsPushTimeout) {
      clearTimeout(settingsPushTimeout);
      pushSettingsToSupabase(pendingPushSettings).catch(() => {});
      pendingPushSettings = null;
    }
  });
}

/**
 * Service initialization and store wiring
 */
export const syncService = {
  init(store) {
    // 1. Subscribe to sync status updates and broadcast to Redux
    subscribeSyncStatus((status) => {
      try {
        store.dispatch({ type: 'notes/setSyncStatus', payload: status });
      } catch (e) {
        console.error('[syncService] Dispatch error:', e);
      }
    });

    // 2. Clean up any obsolete localStorage to guarantee 100% pure cloud storage
    try {
      localStorage.removeItem('youtube-summary-app-v1');
    } catch {
      /* ignore */
    }

    // 3. Initial load: fetch notes & custom settings directly from Supabase Cloud on startup
    if (isSupabaseConfigured()) {
      async function loadWithRetry(attemptsLeft = 3, delay = 1500) {
        const remoteData = await pullFromSupabase();
        if (remoteData) {
          store.dispatch({
            type: 'notes/setSyncedState',
            payload: {
              collections: remoteData.collections || [],
              files: remoteData.files || {},
            },
          });
          return true;
        }
        if (attemptsLeft > 1) {
          console.warn(`[syncService] Initial pull failed, retrying in ${delay}ms...`);
          setTimeout(() => loadWithRetry(attemptsLeft - 1, delay * 1.5), delay);
        } else {
          // If all retries fail, still mark store as loaded so user is not blocked forever
          store.dispatch({
            type: 'notes/setSyncedState',
            payload: {
              collections: [],
              files: {},
            },
          });
        }
      }
      loadWithRetry();

      // Pull custom settings from Supabase
      pullSettingsFromSupabase()
        .then((remoteSettings) => {
          if (remoteSettings && (remoteSettings.theme || remoteSettings.thumbnail)) {
            store.dispatch({
              type: 'settings/setSettings',
              payload: {
                theme: remoteSettings.theme,
                thumbnail: remoteSettings.thumbnail,
              },
            });
            saveSettings({
              theme: remoteSettings.theme,
              thumbnail: remoteSettings.thumbnail,
            });
          }
        })
        .catch((e) => {
          console.warn('[syncService] Startup settings sync warning:', e);
        });

      // 4. Realtime subscription: broadcast settings changes across open browsers & tabs instantly
      try {
        supabase
          .channel('public_settings_realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'settings' },
            (payload) => {
              const newRecord = payload.new;
              if (newRecord && (newRecord.theme || newRecord.thumbnail)) {
                store.dispatch({
                  type: 'settings/setSettings',
                  payload: {
                    theme: newRecord.theme,
                    thumbnail: newRecord.thumbnail,
                  },
                });
                saveSettings({
                  theme: newRecord.theme,
                  thumbnail: newRecord.thumbnail,
                });
              }
            }
          )
          .subscribe();
      } catch (rtErr) {
        console.warn('[syncService] Settings realtime channel warning:', rtErr);
      }
    } else {
      store.dispatch({
        type: 'notes/setSyncedState',
        payload: {
          collections: [],
          files: {},
        },
      });
    }
  },
  queuePush,
  pushToSupabase,
  pullFromSupabase,
  pushSettingsToSupabase,
  pullSettingsFromSupabase,
  queuePushSettings,
  deleteCollectionFromSupabase,
  deleteNoteFromSupabase,
  migrateLocalDataToSupabase,
  getSyncStatus,
  subscribeSyncStatus,
  getSettingsSyncStatus,
  subscribeSettingsSyncStatus,
};
