import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { searchFiles } from '../utils/search.js';

export const useAppDispatch = useDispatch;
export const useAppSelector = useSelector;

// Memoized Selectors
export const selectCollections = (state) => state.notes.collections;
export const selectFiles = (state) => state.notes.files;
export const selectSelectedFileId = (state) => state.notes.selectedFileId;
export const selectSelectedCollectionId = (state) => state.notes.selectedCollectionId;
export const selectStorageStatus = (state) => state.notes.storageStatus;
export const selectSyncStatus = (state) => state.notes.syncStatus;
export const selectNotesLoaded = (state) => state.notes.isLoaded;

export const selectSelectedFile = createSelector(
  [selectFiles, selectSelectedFileId],
  (files, selectedFileId) => (selectedFileId ? files[selectedFileId] || null : null)
);

export const selectThumbnailSettings = (state) => state.settings.thumbnail;
export const selectThemeSettings = (state) => state.settings.theme;
export const selectSettingsLoaded = (state) => state.settings.isLoaded;

export const selectCurrentView = (state) => state.ui.currentView;
export const selectSettingsTab = (state) => state.ui.settingsTab;
export const selectDesktopSidebarOpen = (state) => state.ui.desktopSidebarOpen;
export const selectMobileSidebarOpen = (state) => state.ui.mobileSidebarOpen;
export const selectShowStorageModal = (state) => state.ui.showStorageModal;
export const selectSearchQuery = (state) => state.ui.searchQuery;
export const selectSearchFocused = (state) => state.ui.searchFocused;

// Memoized search selector
export const selectSearchResults = createSelector(
  [selectSearchQuery, selectFiles, selectCollections],
  (query, files, collections) => searchFiles(query, files, collections)
);
