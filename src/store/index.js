import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import notesReducer, {
  createCollection,
  renameCollection,
  deleteCollection,
  createFile,
  updateFile,
  renameFile,
  deleteFile,
  moveFile,
  findCollection,
  collectFileIds,
  collectCollectionIds,
} from './slices/notesSlice.js';
import settingsReducer, {
  updateThumbnailSettings,
  updateThemeSettings,
  updateEditorColors,
  updatePreviewColors,
  resetToDefaults,
} from './slices/settingsSlice.js';
import uiReducer from './slices/uiSlice.js';
import { saveSettings } from '../data/settings.js';
import { syncService } from '../services/syncService.js';

// Listener middleware for reactive disk, localStorage and Supabase persistence
const persistenceMiddleware = createListenerMiddleware();

// 1. Sync notes directly to Supabase Cloud on notes CRUD action
persistenceMiddleware.startListening({
  matcher: isAnyOf(
    createCollection,
    renameCollection,
    deleteCollection,
    createFile,
    updateFile,
    renameFile,
    deleteFile,
    moveFile
  ),
  effect: (action, listenerApi) => {
    const state = listenerApi.getState();
    
    // CRITICAL PROTECTION: Never sync to Supabase before initial load completes!
    // Prevents unhydrated/empty initial state from overwriting or corrupting cloud data on page reload.
    if (!state.notes.isLoaded) {
      return;
    }

    // Explicitly handle deletions with targeted queries
    if (action.type === deleteCollection.type) {
      const prevState = listenerApi.getOriginalState();
      const targetCol = findCollection(action.payload, prevState.notes.collections);
      const deletedFileIds = targetCol ? collectFileIds(targetCol) : [];
      const deletedColIds = targetCol ? collectCollectionIds(targetCol) : [action.payload];

      syncService.deleteCollectionFromSupabase(action.payload, deletedFileIds, deletedColIds);
      return;
    }
    if (action.type === deleteFile.type) {
      syncService.deleteNoteFromSupabase(action.payload);
      return;
    }

    // Cloud synchronization for creates, updates, renames, and moves
    syncService.queuePush({
      collections: state.notes.collections,
      files: state.notes.files,
    });
  },
});

// 2. Sync settings to disk, cache, and Supabase cloud on settings changes
persistenceMiddleware.startListening({
  matcher: isAnyOf(
    updateThumbnailSettings,
    updateThemeSettings,
    updateEditorColors,
    updatePreviewColors,
    resetToDefaults
  ),
  effect: (_action, listenerApi) => {
    const state = listenerApi.getState();
    const payload = {
      thumbnail: state.settings.thumbnail,
      theme: state.settings.theme,
    };
    // 1. Save to local disk and localStorage
    saveSettings(payload);

    // 2. Automatically sync custom settings to Supabase cloud
    syncService.queuePushSettings(payload);
  },
});

export const store = configureStore({
  reducer: {
    notes: notesReducer,
    settings: settingsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(persistenceMiddleware.middleware),
});

// Initialize background Supabase sync service (pull remote state on load & subscribe to sync status)
syncService.init(store);
