import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentView: 'editor', // 'editor' | 'settings'
  settingsTab: 'theme', // 'theme' | 'appearance' | 'playback' | 'overlays' | 'storage'
  desktopSidebarOpen: true,
  mobileSidebarOpen: false,
  showStorageModal: false,
  searchQuery: '',
  searchFocused: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCurrentView(state, action) {
      state.currentView = action.payload;
    },
    toggleDesktopSidebar(state) {
      state.desktopSidebarOpen = !state.desktopSidebarOpen;
    },
    setDesktopSidebarOpen(state, action) {
      state.desktopSidebarOpen = action.payload;
    },
    toggleMobileSidebar(state) {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    },
    setMobileSidebarOpen(state, action) {
      state.mobileSidebarOpen = action.payload;
    },
    setShowStorageModal(state, action) {
      state.showStorageModal = action.payload;
    },
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    setSearchFocused(state, action) {
      state.searchFocused = action.payload;
    },
    setSettingsTab(state, action) {
      state.settingsTab = action.payload;
    },
  },
});

export const {
  setCurrentView,
  setSettingsTab,
  toggleDesktopSidebar,
  setDesktopSidebarOpen,
  toggleMobileSidebar,
  setMobileSidebarOpen,
  setShowStorageModal,
  setSearchQuery,
  setSearchFocused,
} = uiSlice.actions;

export default uiSlice.reducer;
