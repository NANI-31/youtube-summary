import { useCallback, useEffect } from 'react';
import {
  useAppDispatch,
  useAppSelector,
  selectThumbnailSettings,
  selectThemeSettings,
} from '../store/hooks.js';
import {
  updateThumbnailSettings as updateAction,
  updateThemeSettings as updateThemeAction,
  updateEditorColors as updateEditorColorsAction,
  updatePreviewColors as updatePreviewColorsAction,
  resetToDefaults as resetAction,
  fetchSettingsFromPc,
} from '../store/slices/settingsSlice.js';
import { DEFAULT_EDITOR_COLORS, DEFAULT_PREVIEW_COLORS } from '../data/settings.js';

/**
 * Custom hook to subscribe to and update application settings via Redux Toolkit.
 */
export function useSettings() {
  const dispatch = useAppDispatch();
  const isLoaded = useAppSelector((state) => state.settings.isLoaded);
  const thumbnailSettings = useAppSelector(selectThumbnailSettings);
  const themeSettings = useAppSelector(selectThemeSettings);
  const editorColors = themeSettings?.editorColors || DEFAULT_EDITOR_COLORS;
  const previewColors = themeSettings?.previewColors || DEFAULT_PREVIEW_COLORS;

  useEffect(() => {
    if (!isLoaded) {
      dispatch(fetchSettingsFromPc());
    }
  }, [dispatch, isLoaded]);

  const updateThumbnailSettings = useCallback(
    (updates) => {
      dispatch(updateAction(updates));
    },
    [dispatch]
  );

  const updateThemeSettings = useCallback(
    (updates) => {
      dispatch(updateThemeAction(updates));
    },
    [dispatch]
  );

  const updateEditorColors = useCallback(
    (updates) => {
      dispatch(updateEditorColorsAction(updates));
    },
    [dispatch]
  );

  const updatePreviewColors = useCallback(
    (updates) => {
      dispatch(updatePreviewColorsAction(updates));
    },
    [dispatch]
  );

  const resetToDefaults = useCallback(() => {
    dispatch(resetAction());
  }, [dispatch]);

  return {
    settings: { thumbnail: thumbnailSettings, theme: themeSettings },
    thumbnailSettings,
    themeSettings,
    editorColors,
    previewColors,
    updateThumbnailSettings,
    updateThemeSettings,
    updateEditorColors,
    updatePreviewColors,
    resetToDefaults,
  };
}
