import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { extractYouTubeVideoId } from '../../utils/youtube.js';

function now() {
  return new Date().toISOString();
}

/** Recursively find collection by id */
export function findCollection(id, nodes) {
  if (!id || !Array.isArray(nodes)) return null;
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findCollection(id, node.children);
      if (found) return found;
    }
  }
  return null;
}

/** Recursively collect all file IDs in a collection subtree */
export function collectFileIds(node) {
  if (!node) return [];
  const ids = [...(node.fileIds || [])];
  for (const child of node.children || []) {
    ids.push(...collectFileIds(child));
  }
  return ids;
}

/** Recursively collect all collection IDs in a subtree (including root node) */
export function collectCollectionIds(node) {
  if (!node) return [];
  const ids = [node.id];
  for (const child of node.children || []) {
    ids.push(...collectCollectionIds(child));
  }
  return ids;
}

/** Recursively delete collection from parent siblings array */
function removeCollectionFromTree(id, nodes) {
  if (!id || !Array.isArray(nodes)) return null;
  const idx = nodes.findIndex((n) => n.id === id);
  if (idx !== -1) {
    const [deleted] = nodes.splice(idx, 1);
    return deleted;
  }
  for (const node of nodes) {
    if (node.children?.length) {
      const deleted = removeCollectionFromTree(id, node.children);
      if (deleted) return deleted;
    }
  }
  return null;
}

// Initial state: Pure cloud in-memory state (hydrated from Supabase)
const initialState = {
  collections: [],
  files: {},
  selectedFileId: null,
  selectedCollectionId: null,
  storageStatus: {
    isCloud: true,
    saving: false,
    lastSaved: null,
    error: null,
  },
  syncStatus: {
    configured: false,
    status: 'idle',
    lastSynced: null,
    error: null,
  },
  isLoaded: false,
};

// Backwards-compatible stubs
export const fetchNotesFromPc = createAsyncThunk('notes/fetchFromPc', async () => null);
export const openPcNotesFolderThunk = createAsyncThunk('notes/openPcFolder', async () => null);

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    setStorageStatus(state, action) {
      state.storageStatus = { ...state.storageStatus, ...action.payload };
    },
    setSyncStatus(state, action) {
      state.syncStatus = { ...state.syncStatus, ...action.payload };
    },
    setSyncedState(state, action) {
      const { collections, files } = action.payload;
      if (Array.isArray(collections)) state.collections = collections;
      if (files && typeof files === 'object') state.files = files;
      state.isLoaded = true;
    },
    selectFile(state, action) {
      state.selectedFileId = action.payload;
      if (action.payload && state.files[action.payload]) {
        state.selectedCollectionId = state.files[action.payload].collectionId;
      }
    },
    selectCollection(state, action) {
      state.selectedCollectionId = action.payload;
      state.selectedFileId = null;
    },
    createCollection(state, action) {
      const { name, parentId = null } = action.payload;
      if (!name || !name.trim()) return;
      const normalizedParentId =
        parentId && typeof parentId === 'string' && parentId.trim() !== ''
          ? parentId.trim()
          : null;

      const newCol = {
        id: uuidv4(),
        name: name.trim(),
        children: [],
        fileIds: [],
        createdAt: now(),
        updatedAt: now(),
      };

      if (!normalizedParentId) {
        state.collections.push(newCol);
      } else {
        const parent = findCollection(normalizedParentId, state.collections);
        if (parent) {
          parent.children.push(newCol);
          parent.updatedAt = now();
        }
      }
    },
    renameCollection(state, action) {
      const { id, newName } = action.payload;
      if (!newName || !newName.trim()) return;
      const col = findCollection(id, state.collections);
      if (col) {
        col.name = newName.trim();
        col.updatedAt = now();
      }
    },
    deleteCollection(state, action) {
      const id = action.payload;
      const deletedNode = removeCollectionFromTree(id, state.collections);
      if (deletedNode) {
        const deletedFileIds = collectFileIds(deletedNode);
        // Clean up files in subtree
        deletedFileIds.forEach((fid) => {
          delete state.files[fid];
        });
        // Deselect if active note was deleted
        if (state.selectedFileId && deletedFileIds.includes(state.selectedFileId)) {
          state.selectedFileId = null;
        }
        if (state.selectedCollectionId === id) {
          state.selectedCollectionId = null;
        }
      }
    },
    createFile(state, action) {
      const { name, collectionId } = action.payload;
      if (!name || !name.trim()) return;
      const id = uuidv4();
      const trimmed = name.trim();
      const fileName = trimmed.endsWith('.md') ? trimmed : `${trimmed}.md`;
      const normalizedColId =
        collectionId && typeof collectionId === 'string' && collectionId.trim() !== ''
          ? collectionId.trim()
          : null;

      const newFile = {
        id,
        name: fileName,
        content: `# ${fileName.replace(/\.md$/, '')}\n\n`,
        youtubeUrl: '',
        youtubeVideoId: '',
        youtubeTitle: '',
        collectionId: normalizedColId,
        createdAt: now(),
        updatedAt: now(),
      };

      state.files[id] = newFile;
      state.selectedFileId = id;

      if (normalizedColId) {
        const col = findCollection(normalizedColId, state.collections);
        if (col) {
          if (!col.fileIds) col.fileIds = [];
          if (!col.fileIds.includes(id)) {
            col.fileIds.push(id);
          }
          col.updatedAt = now();
        }
      }
    },
    updateFile(state, action) {
      const { id, updates } = action.payload;
      const file = state.files[id];
      if (!file) return;

      Object.assign(file, updates, { updatedAt: now() });

      // Auto-extract video ID if URL changed
      if (updates.youtubeUrl !== undefined) {
        file.youtubeVideoId = extractYouTubeVideoId(updates.youtubeUrl) || '';
      }

      // Auto-extract video ID from content if not explicitly set
      if (updates.content !== undefined && !file.youtubeUrl) {
        const match = updates.content.match(
          /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?(?:[^"'\s]*&)?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})[^\s]*/
        );
        if (match) {
          file.youtubeUrl = match[0];
          file.youtubeVideoId = match[1];
        }
      }
    },
    renameFile(state, action) {
      const { id, newName } = action.payload;
      if (!newName || !newName.trim()) return;
      const file = state.files[id];
      if (!file) return;

      const trimmed = newName.trim();
      const fileName = trimmed.endsWith('.md') ? trimmed : `${trimmed}.md`;
      file.name = fileName;
      file.updatedAt = now();
    },
    deleteFile(state, action) {
      const id = action.payload;
      const file = state.files[id];
      if (!file) return;

      const collectionId = file.collectionId;
      delete state.files[id];

      if (state.selectedFileId === id) {
        state.selectedFileId = null;
      }

      if (collectionId) {
        const col = findCollection(collectionId, state.collections);
        if (col && col.fileIds) {
          col.fileIds = col.fileIds.filter((fid) => fid !== id);
          col.updatedAt = now();
        }
      }
    },
    moveFile(state, action) {
      const { fileId, targetCollectionId } = action.payload;
      const file = state.files[fileId];
      if (!file) return;

      const normalizedTargetId =
        targetCollectionId && typeof targetCollectionId === 'string' && targetCollectionId.trim() !== ''
          ? targetCollectionId.trim()
          : null;

      const oldCol = findCollection(file.collectionId, state.collections);
      if (oldCol && oldCol.fileIds) {
        oldCol.fileIds = oldCol.fileIds.filter((id) => id !== fileId);
        oldCol.updatedAt = now();
      }

      file.collectionId = normalizedTargetId;
      file.updatedAt = now();

      if (normalizedTargetId) {
        const newCol = findCollection(normalizedTargetId, state.collections);
        if (newCol) {
          if (!newCol.fileIds) newCol.fileIds = [];
          if (!newCol.fileIds.includes(fileId)) {
            newCol.fileIds.push(fileId);
          }
          newCol.updatedAt = now();
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchNotesFromPc.fulfilled, (state, action) => {
      const pcData = action.payload;
      if (
        pcData &&
        ((pcData.collections && pcData.collections.length > 0) ||
          (pcData.files && Object.keys(pcData.files).length > 0))
      ) {
        state.collections = pcData.collections || [];
        state.files = pcData.files || {};
      }
      state.isLoaded = true;
    });
  },
});

export const {
  setStorageStatus,
  setSyncStatus,
  setSyncedState,
  selectFile,
  selectCollection,
  createCollection,
  renameCollection,
  deleteCollection,
  createFile,
  updateFile,
  renameFile,
  deleteFile,
  moveFile,
} = notesSlice.actions;

export default notesSlice.reducer;
