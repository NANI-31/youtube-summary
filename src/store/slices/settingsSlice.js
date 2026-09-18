import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  DEFAULT_SETTINGS,
  DEFAULT_THEME_SETTINGS,
  DEFAULT_EDITOR_COLORS,
  DEFAULT_PREVIEW_COLORS,
  loadSettingsSync,
  loadSettingsFromPc,
  saveSettings,
  applyThemeToDocument,
} from '../../data/settings.js';

const initialSettings = loadSettingsSync();

const initialState = {
  thumbnail: initialSettings.thumbnail || DEFAULT_SETTINGS.thumbnail,
  theme: initialSettings.theme || DEFAULT_THEME_SETTINGS,
  isLoaded: false,
};

export const fetchSettingsFromPc = createAsyncThunk(
  'settings/fetchFromPc',
  async () => {
    return await loadSettingsFromPc();
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateThumbnailSettings(state, action) {
      state.thumbnail = {
        ...state.thumbnail,
        ...action.payload,
      };
      saveSettings({
        thumbnail: state.thumbnail,
        theme: state.theme,
      });
    },
    updateThemeSettings(state, action) {
      state.theme = {
        ...state.theme,
        ...action.payload,
        editorColors: {
          ...DEFAULT_EDITOR_COLORS,
          ...(state.theme?.editorColors || {}),
          ...(action.payload?.editorColors || {}),
        },
        previewColors: {
          ...DEFAULT_PREVIEW_COLORS,
          ...(state.theme?.previewColors || {}),
          ...(action.payload?.previewColors || {}),
        },
      };
      applyThemeToDocument(state.theme);
      saveSettings({
        thumbnail: state.thumbnail,
        theme: state.theme,
      });
    },
    updateEditorColors(state, action) {
      state.theme = {
        ...state.theme,
        editorColors: {
          ...DEFAULT_EDITOR_COLORS,
          ...(state.theme?.editorColors || {}),
          ...action.payload,
        },
      };
      applyThemeToDocument(state.theme);
      saveSettings({
        thumbnail: state.thumbnail,
        theme: state.theme,
      });
    },
    updatePreviewColors(state, action) {
      state.theme = {
        ...state.theme,
        previewColors: {
          ...DEFAULT_PREVIEW_COLORS,
          ...(state.theme?.previewColors || {}),
          ...action.payload,
        },
      };
      applyThemeToDocument(state.theme);
      saveSettings({
        thumbnail: state.thumbnail,
        theme: state.theme,
      });
    },
    resetToDefaults(state) {
      state.thumbnail = { ...DEFAULT_SETTINGS.thumbnail };
      state.theme = {
        ...DEFAULT_THEME_SETTINGS,
        editorColors: { ...DEFAULT_EDITOR_COLORS },
        previewColors: { ...DEFAULT_PREVIEW_COLORS },
      };
      applyThemeToDocument(state.theme);
      saveSettings({
        thumbnail: state.thumbnail,
        theme: state.theme,
      });
    },
    setSettings(state, action) {
      if (action.payload?.thumbnail) {
        state.thumbnail = {
          ...DEFAULT_SETTINGS.thumbnail,
          ...action.payload.thumbnail,
        };
      }
      if (action.payload?.theme) {
        state.theme = {
          ...DEFAULT_THEME_SETTINGS,
          ...action.payload.theme,
          editorColors: {
            ...DEFAULT_EDITOR_COLORS,
            ...(action.payload.theme?.editorColors || {}),
          },
          previewColors: {
            ...DEFAULT_PREVIEW_COLORS,
            ...(action.payload.theme?.previewColors || {}),
          },
        };
        applyThemeToDocument(state.theme);
      }
      state.isLoaded = true;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSettingsFromPc.fulfilled, (state, action) => {
      // Only apply from PC if cloud settings have not already hydrated the state
      if (!state.isLoaded) {
        if (action.payload?.thumbnail) {
          state.thumbnail = {
            ...DEFAULT_SETTINGS.thumbnail,
            ...action.payload.thumbnail,
          };
        }
        if (action.payload?.theme) {
          state.theme = {
            ...DEFAULT_THEME_SETTINGS,
            ...action.payload.theme,
            editorColors: {
              ...DEFAULT_EDITOR_COLORS,
              ...(action.payload.theme?.editorColors || {}),
            },
            previewColors: {
              ...DEFAULT_PREVIEW_COLORS,
              ...(action.payload.theme?.previewColors || {}),
            },
          };
          applyThemeToDocument(state.theme);
        }
        state.isLoaded = true;
      }
    });
  },
});

export const {
  updateThumbnailSettings,
  updateThemeSettings,
  updateEditorColors,
  updatePreviewColors,
  resetToDefaults,
  setSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
