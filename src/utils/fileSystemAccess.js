/**
 * File System Access API utility.
 * Allows the web application to interact directly with any user-selected
 * directory on their PC (Chrome, Edge, Brave, Opera).
 */

export function isFileSystemAccessSupported() {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Lets the user pick a folder on their PC and returns the directory handle.
 */
export async function pickPcDirectory() {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser.');
  }
  return await window.showDirectoryPicker({
    mode: 'readwrite',
  });
}

/**
 * Synchronize collections and markdown files into a native DirectoryHandle on the PC.
 */
export async function syncToDirectoryHandle(dirHandle, collections = [], files = {}, settings = null) {
  function sanitize(name) {
    return (name || 'Untitled').replace(/[<>:"/\\|?*]/g, '_').trim();
  }

  const writtenFileIds = new Set();
  let foldersCreated = 0;
  let filesExported = 0;

  async function writeMarkdownFile(targetDirHandle, file) {
    const safeName = sanitize(file.name.endsWith('.md') ? file.name : `${file.name}.md`);
    const fileHandle = await targetDirHandle.getFileHandle(safeName, { create: true });
    const writable = await fileHandle.createWritable();

    const frontmatter = [
      '---',
      `id: "${file.id}"`,
      `name: "${file.name}"`,
      file.youtubeUrl ? `youtubeUrl: "${file.youtubeUrl}"` : null,
      file.youtubeVideoId ? `youtubeVideoId: "${file.youtubeVideoId}"` : null,
      file.youtubeTitle ? `youtubeTitle: "${(file.youtubeTitle || '').replace(/"/g, '\\"')}"` : null,
      `createdAt: "${file.createdAt || new Date().toISOString()}"`,
      `updatedAt: "${file.updatedAt || new Date().toISOString()}"`,
      '---',
      '',
    ].filter(Boolean).join('\n');

    let body = file.content || '';
    if (body.startsWith('---\n')) {
      const secondDelim = body.indexOf('\n---\n', 4);
      if (secondDelim !== -1) body = body.slice(secondDelim + 5);
    }

    await writable.write(`${frontmatter}\n${body.trim()}\n`);
    await writable.close();
    writtenFileIds.add(file.id);
    filesExported += 1;
  }

  async function writeCollection(col, parentDirHandle) {
    const colName = sanitize(col.name);
    const colDirHandle = await parentDirHandle.getDirectoryHandle(colName, { create: true });
    foldersCreated += 1;

    // Write markdown files
    for (const fileId of col.fileIds || []) {
      const file = files[fileId];
      if (!file) continue;
      await writeMarkdownFile(colDirHandle, file);
    }

    // Recurse children
    for (const child of col.children || []) {
      await writeCollection(child, colDirHandle);
    }
  }

  // Also write backup JSON index
  const indexHandle = await dirHandle.getFileHandle('youtube_summary_backup.json', { create: true });
  const indexWritable = await indexHandle.createWritable();
  await indexWritable.write(JSON.stringify({ collections, files, settings }, null, 2));
  await indexWritable.close();

  // If settings provided, export dedicated settings.json
  if (settings) {
    const settingsHandle = await dirHandle.getFileHandle('settings.json', { create: true });
    const settingsWritable = await settingsHandle.createWritable();
    await settingsWritable.write(JSON.stringify(settings, null, 2));
    await settingsWritable.close();
  }

  for (const col of collections) {
    await writeCollection(col, dirHandle);
  }

  // Write any loose files that were not in any collection into root or Uncategorized
  const looseFiles = Object.values(files || {}).filter((f) => f && !writtenFileIds.has(f.id));
  if (looseFiles.length > 0) {
    const uncategorizedHandle = await dirHandle.getDirectoryHandle('Uncategorized', { create: true });
    foldersCreated += 1;
    for (const file of looseFiles) {
      await writeMarkdownFile(uncategorizedHandle, file);
    }
  }

  return { foldersCreated, filesExported };
}

/**
 * Downloads the full notebook database and custom settings as a portable JSON file onto the PC.
 */
export function downloadBackupToPc(state = {}) {
  const payload = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    collections: state.collections || [],
    files: state.files || {},
    settings: state.settings || null,
    metadata: {
      totalCollections: (state.collections || []).length,
      totalNotes: Object.keys(state.files || {}).length,
      hasCustomSettings: Boolean(state.settings),
    },
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = `youtube-summary-export-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return { success: true, fileName: a.download };
}

/**
 * Let the user pick any target directory on their PC and write all folders & markdown files directly.
 */
export async function exportNotesToPcFolder(collections = [], files = {}, settings = null) {
  const dirHandle = await pickPcDirectory();
  const result = await syncToDirectoryHandle(dirHandle, collections, files, settings);
  return {
    success: true,
    folderName: dirHandle.name,
    filesExported: result.filesExported,
    foldersCreated: result.foldersCreated,
  };
}

/**
 * Sync notes, collections, and settings directly to the project's local PC drive (./notes & ./data).
 */
export async function syncToLocalDisk(collections = [], files = {}, settings = null) {
  const res = await fetch('/api/storage/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collections, files, settings }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Open the notes directory in Windows File Explorer (or Finder/Linux file manager).
 */
export async function openLocalNotesFolder() {
  const res = await fetch('/api/storage/open-folder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Retrieve status and location of local PC disk storage.
 */
export async function getLocalNotesInfo() {
  const res = await fetch('/api/storage/info');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
