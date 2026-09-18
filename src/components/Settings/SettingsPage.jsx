import { useState, useEffect } from 'react';
import {
  FiArrowLeft,
  FiZap,
  FiPlayCircle,
  FiLayout,
  FiSliders,
  FiCloud,
  FiDownload,
  FiInfo,
  FiSettings,
  FiRotateCcw,
  FiDroplet,
  FiType,
  FiCheck,
  FiCode,
  FiEye,
  FiMaximize2,
  FiUploadCloud,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiDatabase,
  FiFolder,
  FiHardDrive,
  FiExternalLink,
  FiFileText,
} from 'react-icons/fi';
import YoutubeThumbnail from '../YouTube/YoutubeThumbnail.jsx';
import { useSettings } from '../../hooks/useSettings.js';
import {
  downloadBackupToPc,
  exportNotesToPcFolder,
  syncToLocalDisk,
  openLocalNotesFolder,
  isFileSystemAccessSupported,
} from '../../utils/fileSystemAccess.js';
import { useAppSelector, useAppDispatch, selectSettingsTab } from '../../store/hooks.js';
import { setSettingsTab } from '../../store/slices/uiSlice.js';
import { setSettings } from '../../store/slices/settingsSlice.js';
import SupabaseApiLogger from './SupabaseApiLogger.jsx';
import { supabase, isSupabaseConfigured } from '../../utils/supabase.js';
import {
  pushSettingsToSupabase,
  pullSettingsFromSupabase,
  subscribeSettingsSyncStatus,
  getSettingsSyncStatus,
} from '../../services/syncService.js';
import {
  DEFAULT_EDITOR_COLORS,
  EDITOR_THEME_PRESETS,
  DEFAULT_PREVIEW_COLORS,
  PREVIEW_THEME_PRESETS,
  PREVIEW_WIDTH_PRESETS,
  PREVIEW_PADDING_PRESETS,
} from '../../data/settings.js';

const DEFAULT_DEMO_VIDEO_ID = 't0uavShP1jY';
const DEFAULT_DEMO_TITLE = 'Subliminals 101 - how to listen THE CORRECT WAY (Demo Video)';

const ACCENT_COLORS = [
  { id: 'blue', label: 'Electric Blue', hex: '#2563eb', hover: '#3b82f6' },
  { id: 'indigo', label: 'Royal Indigo', hex: '#6366f1', hover: '#818cf8' },
  { id: 'purple', label: 'Cyber Violet', hex: '#8b5cf6', hover: '#a78bfa' },
  { id: 'teal', label: 'Emerald Mint', hex: '#10b981', hover: '#34d399' },
  { id: 'amber', label: 'Sunset Amber', hex: '#f59e0b', hover: '#fbbf24' },
  { id: 'rose', label: 'Crimson Rose', hex: '#f43f5e', hover: '#fb7185' },
  { id: 'cyan', label: 'Neon Cyan', hex: '#06b6d4', hover: '#22d3ee' },
  { id: 'slate', label: 'Titanium Slate', hex: '#64748b', hover: '#94a3b8' },
];

const BACKGROUND_TONES = [
  {
    id: 'obsidian',
    label: 'Obsidian Deep',
    hex: '#09090b',
    desc: 'Neutral deep black canvas with subtle zinc depth',
  },
  {
    id: 'oled',
    label: 'Pure OLED Black',
    hex: '#000000',
    desc: 'Absolute #000000 black for maximum contrast on OLED displays',
  },
  {
    id: 'slate',
    label: 'Midnight Slate',
    hex: '#0b1120',
    desc: 'Deep navy-tinted dark canvas for reduced eye fatigue',
  },
  {
    id: 'charcoal',
    label: 'Warm Charcoal',
    hex: '#121214',
    desc: 'Subtle warm undertone providing a cozy editorial feel',
  },
];

const THEME_PRESETS = [
  {
    id: 'cyber-blue',
    label: 'Cyber Blue',
    desc: 'Electric Blue on Obsidian',
    settings: {
      accentColor: '#2563eb',
      accentHover: '#3b82f6',
      backgroundTone: 'obsidian',
      surfaceContrast: 'contrast',
      borderIntensity: 'standard',
      uiFontSize: '14px',
      editorFontSize: '15px',
      previewFontSize: '16px',
      editorLineHeight: '1.7',
      editorFontFamily: 'mono',
    },
  },
  {
    id: 'pure-oled',
    label: 'Pure OLED',
    desc: 'Neon Cyan on True Black',
    settings: {
      accentColor: '#06b6d4',
      accentHover: '#22d3ee',
      backgroundTone: 'oled',
      surfaceContrast: 'contrast',
      borderIntensity: 'high',
      uiFontSize: '14px',
      editorFontSize: '15px',
      previewFontSize: '16px',
      editorLineHeight: '1.7',
      editorFontFamily: 'sans',
    },
  },
  {
    id: 'tokyo-night',
    label: 'Tokyo Midnight',
    desc: 'Royal Indigo on Midnight Slate',
    settings: {
      accentColor: '#6366f1',
      accentHover: '#818cf8',
      backgroundTone: 'slate',
      surfaceContrast: 'contrast',
      borderIntensity: 'standard',
      uiFontSize: '14px',
      editorFontSize: '15px',
      previewFontSize: '16px',
      editorLineHeight: '1.7',
      editorFontFamily: 'mono',
    },
  },
  {
    id: 'warm-editorial',
    label: 'Warm Editorial',
    desc: 'Sunset Amber on Charcoal',
    settings: {
      accentColor: '#f59e0b',
      accentHover: '#fbbf24',
      backgroundTone: 'charcoal',
      surfaceContrast: 'contrast',
      borderIntensity: 'subtle',
      uiFontSize: '14px',
      editorFontSize: '17px',
      previewFontSize: '17px',
      editorLineHeight: '1.9',
      editorFontFamily: 'serif',
    },
  },
];

const SETTINGS_CATEGORIES = [
  {
    id: 'theme',
    label: 'Colors & Typography',
    desc: 'Theme accents, dark tones & fonts',
    icon: FiDroplet,
  },
  {
    id: 'editorTheme',
    label: 'Syntax & Preview Colors',
    desc: 'Custom colors, preview width & margins',
    icon: FiCode,
  },
  {
    id: 'appearance',
    label: 'Layout & Dimensions',
    desc: 'Preview width, margins & thumbnail size',
    icon: FiLayout,
  },
  {
    id: 'playback',
    label: 'Playback & Actions',
    desc: 'Player embed & autoplay',
    icon: FiPlayCircle,
  },
  {
    id: 'overlays',
    label: 'Overlays & Badges',
    desc: 'Banner, badges & animations',
    icon: FiSliders,
  },
  {
    id: 'storage',
    label: 'Cloud & PC Storage',
    desc: 'Supabase sync, PC export & backups',
    icon: FiHardDrive,
  },
];

/**
 * Interactive color row supporting:
 * - Color swatch preview with native color picker
 * - Hex / RGBA text input with validation
 * - 1-click curated quick suggestions
 * - Individual token reset button
 */
function EditorColorRow({
  label,
  value,
  defaultValue,
  desc,
  suggestions = [],
  onChange,
}) {
  const [localInput, setLocalInput] = useState(value || '');
  const [prevValue, setPrevValue] = useState(value);

  if (prevValue !== value) {
    setPrevValue(value);
    setLocalInput(value || '');
  }

  const handleInputChange = (val) => {
    setLocalInput(val);
    if (
      /^#[0-9A-Fa-f]{6}$/.test(val) ||
      /^#[0-9A-Fa-f]{3}$/.test(val) ||
      val.startsWith('rgba(') ||
      val.startsWith('rgb(')
    ) {
      onChange(val);
    }
  };

  const pickerColor =
    value && value.startsWith('#') && value.length === 7 ? value : '#60a5fa';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-all">
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 shadow-xs"
            style={{ backgroundColor: value }}
          />
          <span className="text-xs font-semibold text-zinc-200">{label}</span>
          {defaultValue && value !== defaultValue && (
            <button
              onClick={() => onChange(defaultValue)}
              title="Reset this token to default"
              className="text-[10px] text-zinc-500 hover:text-amber-400 font-mono underline ml-1 cursor-pointer"
            >
              reset
            </button>
          )}
        </div>
        {desc && <p className="text-[11px] text-zinc-400 mt-0.5">{desc}</p>}
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {suggestions.length > 0 && (
          <div className="flex items-center gap-1 mr-1">
            {suggestions.map((sHex) => (
              <button
                key={sHex}
                onClick={() => onChange(sHex)}
                title={`Apply ${sHex}`}
                className="w-4 h-4 rounded-full border border-zinc-700 hover:scale-125 transition-transform cursor-pointer"
                style={{ backgroundColor: sHex }}
              />
            ))}
          </div>
        )}

        <label
          title="Pick color visually"
          className="w-8 h-8 rounded-lg border border-zinc-700 cursor-pointer overflow-hidden relative shrink-0 shadow-xs flex items-center justify-center hover:border-zinc-500 transition-colors"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={pickerColor}
            onChange={(e) => onChange(e.target.value)}
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
          />
        </label>

        <input
          type="text"
          value={localInput}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={() => setLocalInput(value || '')}
          placeholder="#ffffff"
          className="w-28 bg-zinc-950 text-xs px-2.5 py-1.5 rounded-lg border border-zinc-800 font-mono text-zinc-200 focus:outline-none focus:border-zinc-500"
        />
      </div>
    </div>
  );
}

/**
 * Interactive settings section for custom Markdown Preview width and left/right padding
 */
function PreviewWidthSettingsSection({ themeSettings, updateThemeSettings }) {
  const currentWidth = themeSettings?.previewMaxWidth || '896px';
  const currentPadding = themeSettings?.previewPaddingX || '48px';

  const isFullWidth = currentWidth === '100%';
  const parsedWidth = isFullWidth
    ? 1800
    : parseInt(currentWidth.replace('px', ''), 10) || 896;
  const parsedPadding = parseInt(currentPadding.replace('px', ''), 10) || 48;

  return (
    <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <FiMaximize2 className="w-4 h-4 text-emerald-400" />
            <span>Markdown Preview Width &amp; Margins (Left &amp; Right)</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Customize the reading canvas maximum width and left/right breathing margins
          </p>
        </div>
        <button
          onClick={() =>
            updateThemeSettings({
              previewMaxWidth: '896px',
              previewPaddingX: '48px',
            })
          }
          title="Reset to default width (896px) and padding (48px)"
          className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs rounded-lg transition-colors border border-zinc-700/60 cursor-pointer self-start sm:self-auto"
        >
          <FiRotateCcw className="w-3 h-3" />
          <span>Reset Width &amp; Margins</span>
        </button>
      </div>

      {/* 1. Preview Reading Column Max Width */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-200">
              Reading Column Maximum Width
            </span>
            <p className="text-[11px] text-zinc-400">
              Controls the maximum horizontal width constraint for Markdown text
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700">
            {currentWidth}
          </span>
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {PREVIEW_WIDTH_PRESETS.map((p) => {
            const isSelected = currentWidth === p.width;
            return (
              <button
                key={p.id}
                onClick={() => updateThemeSettings({ previewMaxWidth: p.width })}
                className={`py-2 px-1.5 rounded-xl border text-center text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm ring-1 ring-emerald-500/30 font-semibold'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <span className="block">{p.label}</span>
                <span className="block text-[10px] text-zinc-500 mt-0.5 font-mono">
                  {p.width}
                </span>
              </button>
            );
          })}
        </div>

        {/* Interactive Width Range Slider + Manual Input */}
        <div className="flex items-center gap-3 bg-zinc-950/60 border border-zinc-800/80 p-3 rounded-xl flex-wrap sm:flex-nowrap">
          <span className="text-[11px] text-zinc-400 font-mono shrink-0">500px</span>
          <input
            type="range"
            min={500}
            max={1800}
            step={20}
            value={isFullWidth ? 1800 : parsedWidth}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val >= 1800) {
                updateThemeSettings({ previewMaxWidth: '100%' });
              } else {
                updateThemeSettings({ previewMaxWidth: `${val}px` });
              }
            }}
            className="flex-1 accent-emerald-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none min-w-30"
          />
          <span className="text-[11px] text-zinc-400 font-mono shrink-0">100% (Full)</span>

          <div className="flex items-center gap-1.5 shrink-0 sm:ml-2">
            <input
              type="number"
              min={400}
              max={2500}
              value={isFullWidth ? 1800 : parsedWidth}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val > 0) {
                  updateThemeSettings({ previewMaxWidth: `${val}px` });
                }
              }}
              className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-mono text-zinc-100 text-right focus:outline-none focus:border-emerald-500"
            />
            <span className="text-xs text-zinc-400 font-mono">px</span>
          </div>
        </div>
      </div>

      {/* 2. Left & Right Space (Horizontal Padding) */}
      <div className="flex flex-col gap-3 pt-3 border-t border-zinc-800/80">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-200">
              Left &amp; Right Space (Horizontal Margins / Padding)
            </span>
            <p className="text-[11px] text-zinc-400">
              Controls the whitespace margins on the left and right sides of the document
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-blue-400 border border-zinc-700">
            {currentPadding}
          </span>
        </div>

        {/* Quick Padding Presets */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {PREVIEW_PADDING_PRESETS.map((p) => {
            const isSelected = currentPadding === p.padding;
            return (
              <button
                key={p.id}
                onClick={() => updateThemeSettings({ previewPaddingX: p.padding })}
                className={`py-2 px-1.5 rounded-xl border text-center text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm ring-1 ring-blue-500/30 font-semibold'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <span className="block">{p.label}</span>
                <span className="block text-[10px] text-zinc-500 mt-0.5 font-mono">
                  {p.padding}
                </span>
              </button>
            );
          })}
        </div>

        {/* Interactive Padding Slider */}
        <div className="flex items-center gap-3 bg-zinc-950/60 border border-zinc-800/80 p-3 rounded-xl flex-wrap sm:flex-nowrap">
          <span className="text-[11px] text-zinc-400 font-mono shrink-0">8px</span>
          <input
            type="range"
            min={8}
            max={160}
            step={4}
            value={parsedPadding}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateThemeSettings({ previewPaddingX: `${val}px` });
            }}
            className="flex-1 accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none min-w-30"
          />
          <span className="text-[11px] text-zinc-400 font-mono shrink-0">160px</span>

          <div className="flex items-center gap-1.5 shrink-0 sm:ml-2">
            <input
              type="number"
              min={0}
              max={300}
              value={parsedPadding}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 0) {
                  updateThemeSettings({ previewPaddingX: `${val}px` });
                }
              }}
              className="w-16 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-mono text-zinc-100 text-right focus:outline-none focus:border-blue-500"
            />
            <span className="text-xs text-zinc-400 font-mono">px</span>
          </div>
        </div>
      </div>

      {/* 3. Live Interactive Margin Visualizer */}
      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Live Layout Ratio Visualizer
          </span>
          <span className="text-[10px] font-mono text-zinc-400">
            Max Width: {currentWidth} • Left/Right Space: {currentPadding}
          </span>
        </div>
        <div className="w-full bg-zinc-900/90 rounded-lg p-2.5 flex items-center justify-center border border-zinc-800 h-20 overflow-hidden relative">
          <div
            className="h-full bg-zinc-800/90 border border-emerald-500/50 rounded flex flex-col justify-center transition-all duration-150 relative overflow-hidden"
            style={{
              width: isFullWidth ? '100%' : `${Math.max(25, Math.min(100, (parsedWidth / 1800) * 100))}%`,
              paddingLeft: `${Math.min(36, (parsedPadding / 160) * 36)}px`,
              paddingRight: `${Math.min(36, (parsedPadding / 160) * 36)}px`,
            }}
          >
            <div className="h-full w-full border border-dashed border-zinc-600 rounded flex items-center justify-center bg-zinc-900/80">
              <span className="text-[10px] font-mono text-zinc-300 truncate px-2">
                Markdown Text Area
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Full-width Settings Page with a dedicated left Settings Sidebar panel.
 */
export default function SettingsPage({
  onClose,
  activeVideoId = null,
  activeVideoTitle = null,
  collections = [],
  files = {},
}) {
  const dispatch = useAppDispatch();
  const {
    thumbnailSettings,
    updateThumbnailSettings,
    themeSettings,
    updateThemeSettings,
    editorColors,
    updateEditorColors,
    previewColors,
    updatePreviewColors,
    resetToDefaults,
  } = useSettings();
  const activeTab = useAppSelector(selectSettingsTab);
  const [colorTarget, setColorTarget] = useState('editor'); // 'editor' | 'preview'
  const [editorPreviewMode, setEditorPreviewMode] = useState('code');
  const [customTestUrl, setCustomTestUrl] = useState('');
  const [testVideoId, setTestVideoId] = useState(activeVideoId || DEFAULT_DEMO_VIDEO_ID);
  const [testVideoTitle, setTestVideoTitle] = useState(activeVideoTitle || DEFAULT_DEMO_TITLE);
  const [customHexInput, setCustomHexInput] = useState('');
  const activeAccent = themeSettings?.accentColor || '#2563eb';
  const displayedHex = customHexInput !== '' ? customHexInput : activeAccent;

  // Cloud Settings Sync state
  const [settingsSync, setSettingsSync] = useState(getSettingsSyncStatus());
  const [isPushingSettings, setIsPushingSettings] = useState(false);
  const [isPullingSettings, setIsPullingSettings] = useState(false);
  const [isVerifyingTable, setIsVerifyingTable] = useState(false);
  const [settingsSyncFeedback, setSettingsSyncFeedback] = useState(null);

  useEffect(() => {
    const unsub = subscribeSettingsSyncStatus((status) => {
      setSettingsSync(status);
    });
    return () => unsub();
  }, []);

  async function handlePushSettingsNow() {
    setIsPushingSettings(true);
    setSettingsSyncFeedback(null);
    try {
      const res = await pushSettingsToSupabase({
        theme: themeSettings,
        thumbnail: thumbnailSettings,
      });
      if (res.success) {
        setSettingsSyncFeedback({
          type: 'success',
          text: '✓ Custom settings successfully saved to Supabase cloud!',
        });
      } else if (res.tableMissing) {
        setSettingsSyncFeedback({
          type: 'warning',
          text: 'Table "settings" not found in Supabase schema cache. Run the SQL schema script below in your Supabase SQL Editor.',
        });
      } else {
        setSettingsSyncFeedback({
          type: 'error',
          text: `Failed to save settings: ${res.error}`,
        });
      }
    } catch (err) {
      setSettingsSyncFeedback({
        type: 'error',
        text: `Error: ${err.message}`,
      });
    } finally {
      setIsPushingSettings(false);
    }
  }

  async function handlePullSettingsNow() {
    setIsPullingSettings(true);
    setSettingsSyncFeedback(null);
    try {
      const remote = await pullSettingsFromSupabase();
      if (remote && (remote.theme || remote.thumbnail)) {
        dispatch(setSettings({ theme: remote.theme, thumbnail: remote.thumbnail }));
        setSettingsSyncFeedback({
          type: 'success',
          text: '✓ Custom settings successfully retrieved from Supabase and applied!',
        });
      } else {
        setSettingsSyncFeedback({
          type: 'info',
          text: 'No saved settings row found in Supabase table or table is not created yet.',
        });
      }
    } catch (err) {
      setSettingsSyncFeedback({
        type: 'error',
        text: `Failed to fetch settings: ${err.message}`,
      });
    } finally {
      setIsPullingSettings(false);
    }
  }

  async function handleVerifySettingsTable() {
    if (!isSupabaseConfigured() || !supabase) {
      setSettingsSyncFeedback({
        type: 'warning',
        text: 'Supabase credentials are not configured in .env',
      });
      return;
    }
    setIsVerifyingTable(true);
    setSettingsSyncFeedback(null);
    try {
      const { data, error } = await supabase.from('settings').select('id, updated_at').limit(1);
      if (error) {
        setSettingsSyncFeedback({
          type: 'warning',
          text: `Table check: ${error.message} (Code: ${error.code}). Copy and run the SQL schema script below.`,
        });
      } else {
        setSettingsSyncFeedback({
          type: 'success',
          text: `✓ Table "public.settings" exists and is ready in Supabase! Found ${data ? data.length : 0} record(s).`,
        });
      }
    } catch (err) {
      setSettingsSyncFeedback({
        type: 'error',
        text: `Verification error: ${err.message}`,
      });
    } finally {
      setIsVerifyingTable(false);
    }
  }

  const handleCustomHexChange = (value) => {
    setCustomHexInput(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      updateThemeSettings({
        accentColor: value,
        accentHover: value,
      });
    }
  };

  // Allow ESC key to return to editor
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Apply quick presets
  const applyPreset = (presetName) => {
    switch (presetName) {
      case 'cinema':
        updateThumbnailSettings({
          size: 'full',
          aspectRatio: '16/9',
          quality: 'maxresdefault',
          playbackMode: 'embed',
          showBadge: true,
          showPlayButton: true,
          showTitleBanner: true,
          borderRadius: 'rounded-2xl',
          shadowEffect: 'shadow-2xl',
          hoverZoom: true,
        });
        break;
      case 'minimal':
        updateThumbnailSettings({
          size: 'compact',
          aspectRatio: '16/9',
          quality: 'hqdefault',
          playbackMode: 'tab',
          showBadge: false,
          showPlayButton: false,
          showTitleBanner: false,
          borderRadius: 'rounded-lg',
          shadowEffect: 'shadow-none',
          hoverZoom: false,
        });
        break;
      case 'player':
        updateThumbnailSettings({
          size: 'medium',
          aspectRatio: '16/9',
          playbackMode: 'always-embed',
          enableAutoplay: false,
          borderRadius: 'rounded-xl',
          shadowEffect: 'shadow-lg',
        });
        break;
      case 'standard':
      default:
        resetToDefaults();
        break;
    }
  };

  function handleSetCustomVideo() {
    if (!customTestUrl.trim()) return;
    const match = customTestUrl.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (match && match[1]) {
      setTestVideoId(match[1]);
      setTestVideoTitle('Custom Test Video');
      setCustomTestUrl('');
    }
  }

  function handleDownloadBackup() {
    try {
      const res = downloadBackupToPc({
        collections,
        files,
        settings: {
          theme: themeSettings,
          thumbnail: thumbnailSettings,
        },
      });
      setExportFeedback({
        type: 'success',
        text: `✓ Saved offline backup "${res.fileName}" to your PC Downloads folder!`,
      });
    } catch (err) {
      setExportFeedback({
        type: 'error',
        text: `Download failed: ${err.message}`,
      });
    }
  }

  async function handleExportToPcFolder() {
    setIsExportingFolder(true);
    setExportFeedback(null);
    try {
      const result = await exportNotesToPcFolder(collections, files, {
        theme: themeSettings,
        thumbnail: thumbnailSettings,
      });
      if (result.success) {
        setExportFeedback({
          type: 'success',
          text: `✓ Export complete! Wrote ${result.filesExported} note(s) across ${result.foldersCreated} folder(s) directly into "${result.folderName}" on your PC.`,
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setExportFeedback({
          type: 'error',
          text: `Folder export failed: ${err.message}`,
        });
      }
    } finally {
      setIsExportingFolder(false);
    }
  }

  async function handleSyncLocalDisk() {
    setIsSyncingLocalDisk(true);
    setExportFeedback(null);
    try {
      const result = await syncToLocalDisk(collections, files, {
        theme: themeSettings,
        thumbnail: thumbnailSettings,
      });
      if (result.success) {
        setExportFeedback({
          type: 'success',
          text: `✓ Synced ${result.filesWritten ?? result.fileCount ?? 0} note(s) to project ./notes/ and settings to ./data/ on local PC disk!`,
        });
      } else {
        setExportFeedback({
          type: 'error',
          text: result.error || 'Failed to sync to local disk.',
        });
      }
    } catch (err) {
      setExportFeedback({
        type: 'error',
        text: `Local sync error: ${err.message}`,
      });
    } finally {
      setIsSyncingLocalDisk(false);
    }
  }

  async function handleOpenExplorer() {
    try {
      const res = await openLocalNotesFolder();
      if (res.success) {
        setExportFeedback({
          type: 'info',
          text: '✓ Opened notes folder in Windows File Explorer.',
        });
      } else {
        setExportFeedback({
          type: 'warning',
          text: res.error || 'Could not open folder automatically.',
        });
      }
    } catch (err) {
      setExportFeedback({
        type: 'error',
        text: `Explorer error: ${err.message}`,
      });
    }
  }

  return (
    <div
      className="flex h-full w-full bg-zinc-950 text-zinc-100 overflow-hidden select-text"
      style={{ backgroundColor: 'var(--app-bg-base)' }}
    >
      {/* ── Left Dedicated Settings Sidebar Panel ─────────────────────── */}
      <aside
        className="w-64 lg:w-72 shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full select-none z-20"
        style={{
          backgroundColor: 'var(--app-bg-sidebar)',
          borderColor: 'var(--app-border-color)',
        }}
      >
        {/* Sidebar Header: Back Button & Branding */}
        <div
          className="p-4 border-b border-zinc-800 flex flex-col gap-3"
          style={{ borderColor: 'var(--app-border-color)' }}
        >
          <button
            onClick={onClose}
            title="Return to notes (Esc)"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700/80 transition-colors cursor-pointer w-full shadow-xs"
          >
            <span className="flex items-center gap-2">
              <FiArrowLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Back to Notes</span>
            </span>
            <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-zinc-400 font-mono">
              Esc
            </kbd>
          </button>

          <div className="flex items-center gap-2.5 pt-0.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FiSettings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                Settings
              </h2>
              <p className="text-[10px] text-zinc-400">Preferences & Appearance</p>
            </div>
          </div>
        </div>

        {/* Category Navigation List */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 px-2 pt-1 pb-0.5">
            Categories
          </span>
          {SETTINGS_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => dispatch(setSettingsTab(cat.id))}
                className={`flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: `${themeSettings?.accentColor || '#2563eb'}20`,
                        borderColor: `${themeSettings?.accentColor || '#2563eb'}60`,
                        borderWidth: '1px',
                      }
                    : {}
                }
              >
                <div
                  className="p-1.5 rounded-lg shrink-0 mt-0.5 transition-colors"
                  style={
                    isActive
                      ? {
                          backgroundColor: themeSettings?.accentColor || '#2563eb',
                          color: '#ffffff',
                        }
                      : {
                          backgroundColor: '#27272a',
                          color: '#a1a1aa',
                        }
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-xs font-medium ${
                      isActive ? 'text-white font-semibold' : 'text-zinc-300'
                    }`}
                  >
                    {cat.label}
                  </span>
                  <span className="text-[10px] text-zinc-500 leading-snug truncate">
                    {cat.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Right Content Area: Expansive Full-Width Settings ──────────── */}
      <div
        className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950 min-w-0"
        style={{ backgroundColor: 'var(--app-bg-base)' }}
      >
        {/* Content Area Top Header */}
        <header
          className="flex items-center justify-between px-6 py-3.5 bg-zinc-900/80 border-b border-zinc-800 shrink-0 z-10 backdrop-blur-md"
          style={{
            backgroundColor: 'color-mix(in oklab, var(--app-bg-surface) 85%, transparent)',
            borderColor: 'var(--app-border-color)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {activeTab === 'theme' && (
                <FiDroplet className="w-4 h-4" style={{ color: themeSettings?.accentColor || '#2563eb' }} />
              )}
              {activeTab === 'editorTheme' && (
                <FiCode className="w-4 h-4" style={{ color: editorColors?.link || '#60a5fa' }} />
              )}
              {activeTab === 'appearance' && <FiLayout className="w-4 h-4 text-blue-400" />}
              {activeTab === 'playback' && <FiPlayCircle className="w-4 h-4 text-blue-400" />}
              {activeTab === 'overlays' && <FiSliders className="w-4 h-4 text-blue-400" />}
              {activeTab === 'storage' && <FiCloud className="w-4 h-4 text-blue-400" />}
              <h1 className="text-sm font-bold text-zinc-100 tracking-tight">
                {activeTab === 'theme' && 'Colors & Typography'}
                {activeTab === 'editorTheme' && 'Code Editor & Syntax Highlighting'}
                {activeTab === 'appearance' && 'Layout & Dimensions'}
                {activeTab === 'playback' && 'Playback & Interactions'}
                {activeTab === 'overlays' && 'Overlays & Badges'}
                {activeTab === 'storage' && 'Supabase Cloud Database'}
              </h1>
            </div>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <p className="text-xs text-zinc-400 hidden sm:block">
              {activeTab === 'theme' &&
                'Customize accent color, dark canvas tone, contrast borders, and font scale'}
              {activeTab === 'editorTheme' &&
                'Fine-tune markdown canvas background, link colors, syntax tokens, and load presets'}
              {activeTab === 'appearance' &&
                'Fine-tune container size, aspect ratio, border radius, and shadow effects'}
              {activeTab === 'playback' &&
                'Configure in-app video embeds, YouTube external links, and autoplay preferences'}
              {activeTab === 'overlays' &&
                'Customize video title banners, YouTube badges, and cursor hover micro-animations'}
              {activeTab === 'storage' &&
                'Cloud-first synchronization with Supabase PostgreSQL database and JSON backups'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={resetToDefaults}
              title="Reset all settings to default"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 hover:text-red-400 text-zinc-300 rounded-lg text-xs font-medium border border-zinc-700/80 transition-colors cursor-pointer"
            >
              <FiRotateCcw className="w-3.5 h-3.5 text-zinc-400" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer"
              style={{ backgroundColor: themeSettings?.accentColor || '#2563eb' }}
            >
              Done
            </button>
          </div>
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-6">
            {/* ── Main Two-Column Full-Width Layout ────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              
              {/* ── Config Panels Column (Full width for storage, 7-8 cols for others) ─── */}
              <div
                className={
                  activeTab === 'storage'
                    ? 'col-span-12 max-w-6xl flex flex-col gap-6'
                    : 'xl:col-span-7 2xl:col-span-8 flex flex-col gap-6'
                }
              >
                {/* TAB 0: Colors & Typography */}
                {activeTab === 'theme' && (
                  <div className="flex flex-col gap-6">
                    {/* 1. Theme Accent Color */}
                    <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                          <FiDroplet className="w-4 h-4" style={{ color: themeSettings?.accentColor }} />
                          <span>UI Accent Color</span>
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Select your primary accent color for active buttons, highlights, badges, and focus indicators
                        </p>
                      </div>

                      {/* Preset Swatches */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                        {ACCENT_COLORS.map((color) => {
                          const isSelected =
                            (themeSettings?.accentColor || '').toLowerCase() === color.hex.toLowerCase();
                          return (
                            <button
                              key={color.id}
                              onClick={() => {
                                setCustomHexInput('');
                                updateThemeSettings({ accentColor: color.hex, accentHover: color.hover });
                              }}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'border-zinc-500 bg-zinc-800/70 shadow-sm ring-1 ring-white/10'
                                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/40'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className="w-4 h-4 rounded-full shrink-0 shadow-xs border border-white/20"
                                  style={{ backgroundColor: color.hex }}
                                />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-medium text-zinc-200 truncate">
                                    {color.label}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 font-mono">{color.hex}</span>
                                </div>
                              </div>
                              {isSelected && (
                                <FiCheck className="w-3.5 h-3.5 shrink-0" style={{ color: color.hex }} />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Color Hex & Picker */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
                        <div>
                          <span className="text-xs font-medium text-zinc-300">Custom Accent Color</span>
                          <p className="text-[11px] text-zinc-500">Pick any custom hue or input a hex color code</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label
                            title="Open color picker"
                            className="w-8 h-8 rounded-lg border border-zinc-700 cursor-pointer overflow-hidden relative shrink-0 shadow-xs flex items-center justify-center"
                            style={{ backgroundColor: themeSettings?.accentColor || '#2563eb' }}
                          >
                            <input
                              type="color"
                              value={themeSettings?.accentColor || '#2563eb'}
                              onChange={(e) => {
                                setCustomHexInput('');
                                updateThemeSettings({
                                  accentColor: e.target.value,
                                  accentHover: e.target.value,
                                });
                              }}
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            />
                          </label>
                          <input
                            type="text"
                            value={displayedHex}
                            onChange={(e) => handleCustomHexChange(e.target.value)}
                            placeholder="#2563eb"
                            maxLength={7}
                            className="w-28 bg-zinc-950 text-xs px-3 py-1.5 rounded-lg border border-zinc-800 font-mono text-zinc-200 focus:outline-none focus:border-zinc-600"
                          />
                        </div>
                      </div>
                    </section>

                    {/* 2. Canvas Background Tone */}
                    <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-100">Canvas Background Tone</h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Choose the dark base tone for sidebars, backgrounds, and notes workspace
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {BACKGROUND_TONES.map((tone) => {
                          const isSelected = themeSettings?.backgroundTone === tone.id;
                          return (
                            <button
                              key={tone.id}
                              onClick={() => updateThemeSettings({ backgroundTone: tone.id })}
                              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                                isSelected
                                  ? 'bg-zinc-800/60 shadow-sm'
                                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/30'
                              }`}
                              style={
                                isSelected
                                  ? {
                                      borderColor: themeSettings?.accentColor || '#2563eb',
                                      boxShadow: `0 0 12px -3px ${themeSettings?.accentColor || '#2563eb'}30`,
                                    }
                                  : {}
                              }
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <span
                                    className="w-4 h-4 rounded-md border border-zinc-700 shadow-inner"
                                    style={{ backgroundColor: tone.hex }}
                                  />
                                  <span className="text-xs font-bold text-zinc-200">{tone.label}</span>
                                </div>
                                {isSelected && (
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: themeSettings?.accentColor || '#2563eb' }}
                                  />
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-400 leading-relaxed">{tone.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    {/* 3. Surface Contrast & Border Intensity */}
                    <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-5 divide-y divide-zinc-800/80">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-100">Contrast & Boundaries</h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Fine-tune elevation hierarchy between editor cards, sidebars, and divider borders
                        </p>
                      </div>

                      {/* Surface Contrast */}
                      <div className="flex flex-col gap-2.5 pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-zinc-200">Surface Contrast</span>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">
                            {themeSettings?.surfaceContrast}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            {
                              id: 'contrast',
                              label: 'Elevated Cards',
                              desc: 'Distinct contrast between sidebar, editor & canvas',
                            },
                            {
                              id: 'seamless',
                              label: 'Flat Unified',
                              desc: 'Monochrome background without elevation differences',
                            },
                          ].map((sc) => {
                            const isSelected = themeSettings?.surfaceContrast === sc.id;
                            return (
                              <button
                                key={sc.id}
                                onClick={() => updateThemeSettings({ surfaceContrast: sc.id })}
                                style={
                                  isSelected
                                    ? {
                                        borderColor: themeSettings?.accentColor || '#2563eb',
                                        boxShadow: `0 0 12px -3px ${themeSettings?.accentColor || '#2563eb'}40`,
                                      }
                                    : {}
                                }
                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-zinc-800/80 text-zinc-100 shadow-xs ring-1 ring-white/10'
                                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-zinc-200 block">
                                    {sc.label}
                                  </span>
                                  {isSelected && (
                                    <span
                                      className="w-2 h-2 rounded-full shadow-xs"
                                      style={{ backgroundColor: themeSettings?.accentColor || '#2563eb' }}
                                    />
                                  )}
                                </div>
                                <span className="text-[10px] text-zinc-500 mt-0.5 block">{sc.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Border Intensity */}
                      <div className="flex flex-col gap-2.5 pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-zinc-200">Border Intensity</span>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">
                            {themeSettings?.borderIntensity}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'subtle', label: 'Subtle', desc: '8% boundary' },
                            { id: 'standard', label: 'Standard', desc: 'Balanced zinc' },
                            { id: 'high', label: 'High Contrast', desc: '22% crisp' },
                          ].map((bi) => {
                            const isSelected = themeSettings?.borderIntensity === bi.id;
                            return (
                              <button
                                key={bi.id}
                                onClick={() => updateThemeSettings({ borderIntensity: bi.id })}
                                style={
                                  isSelected
                                    ? {
                                        borderColor: themeSettings?.accentColor || '#2563eb',
                                        boxShadow: `0 0 12px -3px ${themeSettings?.accentColor || '#2563eb'}40`,
                                      }
                                    : {}
                                }
                                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-zinc-800/80 text-zinc-100 shadow-xs ring-1 ring-white/10'
                                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="text-xs font-semibold text-zinc-200 block">
                                    {bi.label}
                                  </span>
                                  {isSelected && (
                                    <span
                                      className="w-1.5 h-1.5 rounded-full shadow-xs"
                                      style={{ backgroundColor: themeSettings?.accentColor || '#2563eb' }}
                                    />
                                  )}
                                </div>
                                <span className="text-[10px] text-zinc-500 mt-0.5 block">{bi.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </section>

                    {/* 4. Typography & Font Sizing */}
                    <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-5 divide-y divide-zinc-800/80">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                          <FiType className="w-4 h-4 text-blue-400" />
                          <span>Typography & Font Sizing</span>
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Adjust font scale across general UI, Markdown editor, rendered preview, and font families
                        </p>
                      </div>

                      {/* UI Font Size */}
                      <div className="flex flex-col gap-3 pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold text-zinc-200">Global UI Font Size</span>
                            <p className="text-[11px] text-zinc-400">
                              Controls sidebars, settings, search, and navigation
                            </p>
                          </div>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                            {themeSettings?.uiFontSize}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {['12px', '13px', '14px', '15px', '16px'].map((sz) => (
                            <button
                              key={sz}
                              onClick={() => updateThemeSettings({ uiFontSize: sz })}
                              className={`py-2 px-1 rounded-xl border text-center text-xs font-medium transition-all cursor-pointer ${
                                themeSettings?.uiFontSize === sz
                                  ? 'bg-zinc-800 border-zinc-500 text-white shadow-xs'
                                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                              }`}
                            >
                              {sz}
                              <span className="block text-[9px] text-zinc-500 mt-0.5">
                                {sz === '12px' && 'Compact'}
                                {sz === '13px' && 'Dense'}
                                {sz === '14px' && 'Standard'}
                                {sz === '15px' && 'Medium'}
                                {sz === '16px' && 'Large'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Editor Font Size */}
                      <div className="flex flex-col gap-3 pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold text-zinc-200">Note Editor Font Size</span>
                            <p className="text-[11px] text-zinc-400">
                              Controls the CodeMirror Markdown editor text
                            </p>
                          </div>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                            {themeSettings?.editorFontSize}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {['13px', '15px', '17px', '19px', '21px'].map((sz) => (
                            <button
                              key={sz}
                              onClick={() => updateThemeSettings({ editorFontSize: sz })}
                              className={`py-2 px-1 rounded-xl border text-center text-xs font-medium transition-all cursor-pointer ${
                                themeSettings?.editorFontSize === sz
                                  ? 'bg-zinc-800 border-zinc-500 text-white shadow-xs'
                                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                              }`}
                            >
                              {sz}
                              <span className="block text-[9px] text-zinc-500 mt-0.5">
                                {sz === '13px' && 'Small'}
                                {sz === '15px' && 'Standard'}
                                {sz === '17px' && 'Medium'}
                                {sz === '19px' && 'Large'}
                                {sz === '21px' && 'Huge'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Markdown Preview Font Size */}
                      <div className="flex flex-col gap-3 pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold text-zinc-200">
                              Rendered Note Preview Size
                            </span>
                            <p className="text-[11px] text-zinc-400">
                              Controls the rendered Markdown reading typography
                            </p>
                          </div>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                            {themeSettings?.previewFontSize}
                          </span>
                        </div>
                        <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                          {['14px', '15px', '16px', '17px', '18px', '20px'].map((sz) => (
                            <button
                              key={sz}
                              onClick={() => updateThemeSettings({ previewFontSize: sz })}
                              className={`py-2 px-1 rounded-xl border text-center text-xs font-medium transition-all cursor-pointer ${
                                themeSettings?.previewFontSize === sz
                                  ? 'bg-zinc-800 border-zinc-500 text-white shadow-xs'
                                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                              }`}
                            >
                              {sz}
                              <span className="block text-[9px] text-zinc-500 mt-0.5">
                                {sz === '16px' ? 'Default' : ''}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Editor Line Height & Font Family */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                        {/* Line Height */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-zinc-200">Editor Line Height</span>
                            <span className="text-[11px] font-mono text-zinc-400">
                              {themeSettings?.editorLineHeight}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {['1.5', '1.7', '1.9', '2.1'].map((lh) => (
                              <button
                                key={lh}
                                onClick={() => updateThemeSettings({ editorLineHeight: lh })}
                                className={`py-2 text-center text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                                  themeSettings?.editorLineHeight === lh
                                    ? 'bg-zinc-800 border-zinc-500 text-white shadow-xs'
                                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                }`}
                              >
                                {lh}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Font Family */}
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-semibold text-zinc-200">Editor Typography</span>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: 'mono', label: 'Monospace' },
                              { id: 'sans', label: 'Modern Sans' },
                              { id: 'serif', label: 'Editorial' },
                            ].map((f) => (
                              <button
                                key={f.id}
                                onClick={() => updateThemeSettings({ editorFontFamily: f.id })}
                                className={`py-2 text-center text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                                  themeSettings?.editorFontFamily === f.id
                                    ? 'bg-zinc-800 border-zinc-500 text-white shadow-xs'
                                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                }`}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {/* TAB: Code Editor & Markdown Preview Colors */}
                {activeTab === 'editorTheme' && (
                  <div className="flex flex-col gap-6">
                    {/* Sub-tab switcher: Code Editor vs Markdown Preview */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800/80">
                        <button
                          onClick={() => setColorTarget('editor')}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            colorTarget === 'editor'
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                          }`}
                        >
                          <FiCode className="w-3.5 h-3.5" />
                          <span>Code Editor Colors</span>
                        </button>
                        <button
                          onClick={() => setColorTarget('preview')}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            colorTarget === 'preview'
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                          }`}
                        >
                          <FiEye className="w-3.5 h-3.5" />
                          <span>Markdown Preview Colors</span>
                        </button>
                      </div>

                      {colorTarget === 'preview' ? (
                        <button
                          onClick={() => {
                            updatePreviewColors({
                              background: editorColors.background,
                              text: editorColors.text,
                              link: editorColors.link,
                              heading: editorColors.heading,
                              bold: editorColors.bold,
                              italic: editorColors.italic,
                              code: editorColors.code,
                              codeBg: 'rgba(39, 39, 42, 0.6)',
                              blockquoteBorder: editorColors.link,
                              blockquoteText: editorColors.comment || '#a1a1aa',
                              tableHeaderBg: editorColors.gutterBg || '#27272a',
                              tableBorder: editorColors.gutterBorder || '#3f3f46',
                              hrBorder: editorColors.gutterBorder || '#3f3f46',
                            });
                          }}
                          title="Sync preview color scheme from your current code editor colors"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-[11px] font-medium border border-zinc-700/80 transition-colors cursor-pointer self-start sm:self-auto"
                        >
                          <FiZap className="w-3 h-3 text-amber-400" />
                          <span>Sync from Editor</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            updateEditorColors({
                              background: previewColors.background,
                              text: previewColors.text,
                              link: previewColors.link,
                              heading: previewColors.heading,
                              bold: previewColors.bold,
                              italic: previewColors.italic,
                              code: previewColors.code,
                            });
                          }}
                          title="Sync code editor main colors from your current preview colors"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-[11px] font-medium border border-zinc-700/80 transition-colors cursor-pointer self-start sm:self-auto"
                        >
                          <FiZap className="w-3 h-3 text-amber-400" />
                          <span>Sync from Preview</span>
                        </button>
                      )}
                    </div>

                    {colorTarget === 'editor' ? (
                      <>
                        {/* 1. Markdown & Canvas Surface Background */}
                        <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-4">
                          <div>
                            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                              <FiLayout className="w-4 h-4 text-blue-400" />
                              <span>Code Editor Surface & Cursor</span>
                            </h3>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              Configure the background surface tone, active line highlight, text selection, and cursor caret
                            </p>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            <EditorColorRow
                              label="Editor Canvas Background"
                              value={editorColors.background}
                              defaultValue={DEFAULT_EDITOR_COLORS.background}
                              desc="Base surface background color for the CodeMirror editor"
                              suggestions={['#09090b', '#000000', '#1a1b26', '#282a36', '#282c34', '#2d2a2e', '#0d0d17', '#121214']}
                              onChange={(val) => updateEditorColors({ background: val })}
                            />
                            <EditorColorRow
                              label="Active Line Highlight"
                              value={editorColors.activeLineBg}
                              defaultValue={DEFAULT_EDITOR_COLORS.activeLineBg}
                              desc="Subtle background highlight across the line where your cursor is positioned"
                              suggestions={['rgba(39, 39, 42, 0.4)', 'rgba(24, 24, 27, 0.7)', 'rgba(41, 46, 66, 0.6)', 'rgba(68, 71, 90, 0.5)', 'rgba(44, 49, 58, 0.7)']}
                              onChange={(val) => updateEditorColors({ activeLineBg: val })}
                            />
                            <EditorColorRow
                              label="Text Selection Highlight"
                              value={editorColors.selectionBg}
                              defaultValue={DEFAULT_EDITOR_COLORS.selectionBg}
                              desc="Tinted background applied when selecting or highlighting text spans"
                              suggestions={['rgba(37, 99, 235, 0.28)', 'rgba(51, 70, 116, 0.5)', 'rgba(68, 71, 90, 0.8)', 'rgba(62, 68, 81, 0.6)', 'rgba(255, 0, 85, 0.3)']}
                              onChange={(val) => updateEditorColors({ selectionBg: val })}
                            />
                            <EditorColorRow
                              label="Cursor Caret Color"
                              value={editorColors.cursor}
                              defaultValue={DEFAULT_EDITOR_COLORS.cursor}
                              desc="Color of the vertical blinking cursor indicator in the editor"
                              suggestions={['#60a5fa', '#38bdf8', '#c0caf5', '#f8f8f0', '#528bff', '#fcfcfa', '#ffe600']}
                              onChange={(val) => updateEditorColors({ cursor: val })}
                            />
                          </div>
                        </section>

                        {/* 2. Text & Typography Hierarchy */}
                        <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-4">
                          <div>
                            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                              <FiType className="w-4 h-4 text-emerald-400" />
                              <span>Editor Text & Markdown Tokens</span>
                            </h3>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              Fine-tune normal reading text, links, headings, bold emphasis, and italic styling
                            </p>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            <EditorColorRow
                              label="Normal Prose Text"
                              value={editorColors.text}
                              defaultValue={DEFAULT_EDITOR_COLORS.text}
                              desc="Standard paragraph text, notes body, bullet list items, and table cells"
                              suggestions={['#ffffff', '#f8f8f2', '#e4e4e7', '#cbd5e1', '#abb2bf', '#c0caf5', '#fcfcfa']}
                              onChange={(val) => updateEditorColors({ text: val })}
                            />
                            <EditorColorRow
                              label="Links & Timestamps"
                              value={editorColors.link}
                              defaultValue={DEFAULT_EDITOR_COLORS.link}
                              desc="Markdown links, YouTube video timestamps, and clickable URLs (vibrant blue by default)"
                              suggestions={['#60a5fa', '#38bdf8', '#2563eb', '#61afef', '#7aa2f7', '#8be9fd', '#78dce8', '#00e8c6']}
                              onChange={(val) => updateEditorColors({ link: val })}
                            />
                            <EditorColorRow
                              label="Headings & Section Titles"
                              value={editorColors.heading}
                              defaultValue={DEFAULT_EDITOR_COLORS.heading}
                              desc="Markdown headings (# H1, ## H2, ### H3) and document title markers"
                              suggestions={['#93c5fd', '#60a5fa', '#7dcfff', '#bd93f9', '#ffd866', '#e06c75', '#ff0055']}
                              onChange={(val) => updateEditorColors({ heading: val })}
                            />
                            <EditorColorRow
                              label="Bold Emphasis (**bold**)"
                              value={editorColors.bold}
                              defaultValue={DEFAULT_EDITOR_COLORS.bold}
                              desc="Text enclosed in double asterisks or double underscores"
                              suggestions={['#ffffff', '#facc15', '#38bdf8', '#4ade80', '#f43f5e']}
                              onChange={(val) => updateEditorColors({ bold: val })}
                            />
                            <EditorColorRow
                              label="Italic Text (*italic*)"
                              value={editorColors.italic}
                              defaultValue={DEFAULT_EDITOR_COLORS.italic}
                              desc="Emphasis text wrapped in single asterisks or underscores"
                              suggestions={['#e4e4e7', '#cbd5e1', '#a1a1aa', '#94a3b8', '#a9b1d6', '#e5e5e3']}
                              onChange={(val) => updateEditorColors({ italic: val })}
                            />
                          </div>
                        </section>

                        {/* 3. Programming & Syntax Tokens */}
                        <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-4">
                          <div>
                            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                              <FiCode className="w-4 h-4 text-purple-400" />
                              <span>Programming & Syntax Tokens</span>
                            </h3>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              Colors for code blocks, keywords, string literals, numbers, and comments
                            </p>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            <EditorColorRow
                              label="Inline Code (`code`)"
                              value={editorColors.code}
                              defaultValue={DEFAULT_EDITOR_COLORS.code}
                              desc="Code snippets wrapped in backticks, commands, and monospace blocks"
                              suggestions={['#34d399', '#4ade80', '#98c379', '#73daca', '#50fa7b', '#a9dc76', '#00e8c6']}
                              onChange={(val) => updateEditorColors({ code: val })}
                            />
                            <EditorColorRow
                              label="Language Keywords"
                              value={editorColors.keyword}
                              defaultValue={DEFAULT_EDITOR_COLORS.keyword}
                              desc="Programming keywords like const, function, return, import, export, if"
                              suggestions={['#c084fc', '#bb9af7', '#ff79c6', '#ff6188', '#c678dd', '#a855f7', '#ff0055']}
                              onChange={(val) => updateEditorColors({ keyword: val })}
                            />
                            <EditorColorRow
                              label="Strings & Text Literals"
                              value={editorColors.string}
                              defaultValue={DEFAULT_EDITOR_COLORS.string}
                              desc="Text literals enclosed in single or double quotes"
                              suggestions={['#a3e635', '#9ece6a', '#f1fa8c', '#a9dc76', '#22c55e', '#ffe600']}
                              onChange={(val) => updateEditorColors({ string: val })}
                            />
                            <EditorColorRow
                              label="Numbers & Booleans"
                              value={editorColors.number}
                              defaultValue={DEFAULT_EDITOR_COLORS.number}
                              desc="Numeric values, boolean flags (true, false), and atomic constants"
                              suggestions={['#38bdf8', '#ff9e64', '#bd93f9', '#ab9df2', '#06b6d4', '#00e8c6']}
                              onChange={(val) => updateEditorColors({ number: val })}
                            />
                            <EditorColorRow
                              label="Comments & Annotations"
                              value={editorColors.comment}
                              defaultValue={DEFAULT_EDITOR_COLORS.comment}
                              desc="Code comments, markdown metadata annotations, and notes"
                              suggestions={['#71717a', '#565f89', '#6272a4', '#727072', '#52525b', '#5c6370', '#494d64']}
                              onChange={(val) => updateEditorColors({ comment: val })}
                            />
                          </div>
                        </section>

                        {/* 4. Gutter & Line Numbers */}
                        <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-4">
                          <div>
                            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                              <FiSliders className="w-4 h-4 text-amber-400" />
                              <span>Gutter & Line Numbers</span>
                            </h3>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              Visual presentation of the left-hand line numbering margin and border divider
                            </p>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            <EditorColorRow
                              label="Gutter Background"
                              value={editorColors.gutterBg}
                              defaultValue={DEFAULT_EDITOR_COLORS.gutterBg}
                              desc="Background fill behind the line numbers column"
                              suggestions={['#09090b', '#000000', '#1a1b26', '#282a36', '#282c34', '#2d2a2e', '#0d0d17']}
                              onChange={(val) => updateEditorColors({ gutterBg: val })}
                            />
                            <EditorColorRow
                              label="Line Numbers Digits"
                              value={editorColors.gutterText}
                              defaultValue={DEFAULT_EDITOR_COLORS.gutterText}
                              desc="Color of line number digits in the gutter"
                              suggestions={['#52525b', '#414868', '#6272a4', '#727072', '#4b5263', '#3f3f46', '#494d64']}
                              onChange={(val) => updateEditorColors({ gutterText: val })}
                            />
                            <EditorColorRow
                              label="Gutter Border Divider"
                              value={editorColors.gutterBorder}
                              defaultValue={DEFAULT_EDITOR_COLORS.gutterBorder}
                              desc="Vertical dividing line between line numbers and editor text"
                              suggestions={['#27272a', '#18181b', '#24283b', '#191a21', '#1e2227', '#1e1c1e', '#1b1b2f']}
                              onChange={(val) => updateEditorColors({ gutterBorder: val })}
                            />
                          </div>
                        </section>

                        {/* Reset All Syntax Colors Button */}
                        <div className="flex justify-end pt-2 pb-6">
                          <button
                            onClick={() => updateEditorColors(DEFAULT_EDITOR_COLORS)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 rounded-xl text-xs font-semibold border border-zinc-800 transition-colors cursor-pointer"
                          >
                            <FiRotateCcw className="w-3.5 h-3.5" />
                            <span>Reset All Syntax Colors to Defaults</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* 0. Markdown Preview Width & Left/Right Margins */}
                        <PreviewWidthSettingsSection
                          themeSettings={themeSettings}
                          updateThemeSettings={updateThemeSettings}
                        />

                        {/* PREVIEW COLORS SECTIONS */}
                        {/* 1. Canvas & Section Rules */}
                        <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-4">
                          <div>
                            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                              <FiLayout className="w-4 h-4 text-emerald-400" />
                              <span>Preview Canvas & Horizontal Rules</span>
                            </h3>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              Set background color for the rendered note reader and horizontal dividing rules
                            </p>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            <EditorColorRow
                              label="Preview Canvas Background"
                              value={previewColors.background}
                              defaultValue={DEFAULT_PREVIEW_COLORS.background}
                              desc="Background color behind the rendered Markdown note reading view"
                              suggestions={['#09090b', '#000000', '#18181b', '#1a1b26', '#282c34', '#282a36', '#141416', '#0d0d17']}
                              onChange={(val) => updatePreviewColors({ background: val })}
                            />
                            <EditorColorRow
                              label="Horizontal Rule / Divider"
                              value={previewColors.hrBorder}
                              defaultValue={DEFAULT_PREVIEW_COLORS.hrBorder}
                              desc="Line color for horizontal divider rules (---) separating sections"
                              suggestions={['#3f3f46', '#27272a', '#18181b', '#52525b', '#3b4252', '#44475a']}
                              onChange={(val) => updatePreviewColors({ hrBorder: val })}
                            />
                          </div>
                        </section>

                        {/* 2. Reading Text & Typography */}
                        <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-4">
                          <div>
                            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                              <FiType className="w-4 h-4 text-blue-400" />
                              <span>Reading Text & Typography</span>
                            </h3>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              Custom colors for body text, section headings, clickable links, bold emphasis, and italic text
                            </p>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            <EditorColorRow
                              label="Body Reading Text"
                              value={previewColors.text}
                              defaultValue={DEFAULT_PREVIEW_COLORS.text}
                              desc="Main prose and paragraph body text in the rendered view"
                              suggestions={['#ffffff', '#f4f4f5', '#e4e4e7', '#d4d4d8', '#cbd5e1', '#abb2bf', '#c0caf5', '#f8f8f2']}
                              onChange={(val) => updatePreviewColors({ text: val })}
                            />
                            <EditorColorRow
                              label="Links & Video Timestamps"
                              value={previewColors.link}
                              defaultValue={DEFAULT_PREVIEW_COLORS.link}
                              desc="Clickable URLs, chapter links, and interactive YouTube timestamps"
                              suggestions={['#60a5fa', '#38bdf8', '#2563eb', '#61afef', '#7aa2f7', '#8be9fd', '#00e8c6', '#34d399']}
                              onChange={(val) => updatePreviewColors({ link: val })}
                            />
                            <EditorColorRow
                              label="Headings (H1 - H6)"
                              value={previewColors.heading}
                              defaultValue={DEFAULT_PREVIEW_COLORS.heading}
                              desc="Titles, major headers (# H1, ## H2, ### H3) and chapter labels"
                              suggestions={['#93c5fd', '#60a5fa', '#38bdf8', '#7dcfff', '#bd93f9', '#ffd866', '#e06c75', '#f43f5e']}
                              onChange={(val) => updatePreviewColors({ heading: val })}
                            />
                            <EditorColorRow
                              label="Bold Emphasis (**bold**)"
                              value={previewColors.bold}
                              defaultValue={DEFAULT_PREVIEW_COLORS.bold}
                              desc="Strong bold text for key highlights and important notes"
                              suggestions={['#ffffff', '#facc15', '#fbbf24', '#38bdf8', '#4ade80', '#f43f5e']}
                              onChange={(val) => updatePreviewColors({ bold: val })}
                            />
                            <EditorColorRow
                              label="Italic Text (*italic*)"
                              value={previewColors.italic}
                              defaultValue={DEFAULT_PREVIEW_COLORS.italic}
                              desc="Italicized emphasis phrases, captions, and side comments"
                              suggestions={['#e4e4e7', '#d4d4d8', '#a1a1aa', '#94a3b8', '#a9b1d6', '#e2e2dc']}
                              onChange={(val) => updatePreviewColors({ italic: val })}
                            />
                          </div>
                        </section>

                        {/* 3. Code, Quotes & Tables */}
                        <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-4">
                          <div>
                            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                              <FiCode className="w-4 h-4 text-purple-400" />
                              <span>Code, Quotes & Data Tables</span>
                            </h3>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              Appearance for inline code snippets, blockquotes, and Markdown table cells
                            </p>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            <EditorColorRow
                              label="Inline Code Text"
                              value={previewColors.code}
                              defaultValue={DEFAULT_PREVIEW_COLORS.code}
                              desc="Text color for `code` phrases and monospace tags"
                              suggestions={['#34d399', '#4ade80', '#98c379', '#73daca', '#50fa7b', '#a9dc76', '#00e8c6', '#38bdf8']}
                              onChange={(val) => updatePreviewColors({ code: val })}
                            />
                            <EditorColorRow
                              label="Inline Code Background"
                              value={previewColors.codeBg}
                              defaultValue={DEFAULT_PREVIEW_COLORS.codeBg}
                              desc="Background fill behind inline code tags"
                              suggestions={['rgba(39, 39, 42, 0.6)', 'rgba(0, 0, 0, 0.4)', 'rgba(255, 255, 255, 0.08)', 'rgba(30, 34, 42, 0.7)', 'rgba(68, 71, 90, 0.4)']}
                              onChange={(val) => updatePreviewColors({ codeBg: val })}
                            />
                            <EditorColorRow
                              label="Blockquote Left Border"
                              value={previewColors.blockquoteBorder}
                              defaultValue={DEFAULT_PREVIEW_COLORS.blockquoteBorder}
                              desc="Vertical accent stripe on the left side of quoted blocks (> quote)"
                              suggestions={['#3b82f6', '#2563eb', '#60a5fa', '#61afef', '#7aa2f7', '#bd93f9', '#10b981', '#f59e0b']}
                              onChange={(val) => updatePreviewColors({ blockquoteBorder: val })}
                            />
                            <EditorColorRow
                              label="Blockquote Text"
                              value={previewColors.blockquoteText}
                              defaultValue={DEFAULT_PREVIEW_COLORS.blockquoteText}
                              desc="Text color inside blockquotes"
                              suggestions={['#a1a1aa', '#94a3b8', '#d4d4d8', '#abb2bf', '#a9b1d6', '#e2e2dc', '#d1d5db']}
                              onChange={(val) => updatePreviewColors({ blockquoteText: val })}
                            />
                            <EditorColorRow
                              label="Table Header Background"
                              value={previewColors.tableHeaderBg}
                              defaultValue={DEFAULT_PREVIEW_COLORS.tableHeaderBg}
                              desc="Background fill behind table column headers (<thead>)"
                              suggestions={['#27272a', '#18181b', '#1f2430', '#282a36', '#21252b', '#141417']}
                              onChange={(val) => updatePreviewColors({ tableHeaderBg: val })}
                            />
                            <EditorColorRow
                              label="Table Grid Borders"
                              value={previewColors.tableBorder}
                              defaultValue={DEFAULT_PREVIEW_COLORS.tableBorder}
                              desc="Gridline border colors between table cells and rows"
                              suggestions={['#3f3f46', '#27272a', '#18181b', '#3b4252', '#44475a', '#52525b']}
                              onChange={(val) => updatePreviewColors({ tableBorder: val })}
                            />
                          </div>
                        </section>

                        {/* Reset All Preview Colors Button */}
                        <div className="flex justify-end pt-2 pb-6">
                          <button
                            onClick={() => updatePreviewColors(DEFAULT_PREVIEW_COLORS)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 rounded-xl text-xs font-semibold border border-zinc-800 transition-colors cursor-pointer"
                          >
                            <FiRotateCcw className="w-3.5 h-3.5" />
                            <span>Reset All Preview Colors to Defaults</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* TAB 1: Layout & Dimensions */}
                {activeTab === 'appearance' && (
                <div className="flex flex-col gap-6">
                  {/* Markdown Preview Width & Left/Right Margins */}
                  <PreviewWidthSettingsSection
                    themeSettings={themeSettings}
                    updateThemeSettings={updateThemeSettings}
                  />

                  {/* Container Size */}
                  <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">Thumbnail Container Width</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Controls the horizontal footprint of the video card inside your Markdown notes
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      {[
                        { id: 'compact', label: 'Compact', desc: 'max-w-md (~448px)', sub: 'Space-saving' },
                        { id: 'medium', label: 'Standard', desc: 'max-w-2xl (~672px)', sub: 'Balanced reading' },
                        { id: 'full', label: 'Full Width', desc: '100% width', sub: 'Spans note area' },
                      ].map((s) => (
                        <button
                          key={s.id}
                          onClick={() => updateThumbnailSettings({ size: s.id })}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            thumbnailSettings.size === s.id
                              ? 'border-blue-500 bg-blue-500/10 shadow-sm'
                              : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-200">{s.label}</span>
                            {thumbnailSettings.size === s.id && (
                              <span className="w-2 h-2 rounded-full bg-blue-400" />
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 font-mono mt-1">{s.desc}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{s.sub}</p>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Aspect Ratio */}
                  <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">Aspect Ratio</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Defines the geometric proportions of video thumbnail previews and embedded players
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      {[
                        { id: '16/9', label: '16:9 Widescreen', desc: 'Standard YouTube format' },
                        { id: '4/3', label: '4:3 Classic', desc: 'Compact vertical height' },
                        { id: '21/9', label: '21:9 Ultrawide', desc: 'Cinematic header banner' },
                      ].map((a) => (
                        <button
                          key={a.id}
                          onClick={() => updateThumbnailSettings({ aspectRatio: a.id })}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            thumbnailSettings.aspectRatio === a.id
                              ? 'border-blue-500 bg-blue-500/10 shadow-sm'
                              : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-200">{a.label}</span>
                            {thumbnailSettings.aspectRatio === a.id && (
                              <span className="w-2 h-2 rounded-full bg-blue-400" />
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-1">{a.desc}</p>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Image Resolution Quality */}
                  <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">Thumbnail Resolution Quality</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Specifies the image resolution requested from YouTube servers
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      {[
                        { id: 'maxresdefault', label: 'Full HD 1080p', key: 'maxresdefault' },
                        { id: 'hqdefault', label: 'High Quality', key: 'hqdefault' },
                        { id: 'mqdefault', label: 'Medium Quality', key: 'mqdefault' },
                        { id: 'default', label: 'Standard', key: 'default' },
                      ].map((q) => (
                        <button
                          key={q.id}
                          onClick={() => updateThumbnailSettings({ quality: q.id })}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            thumbnailSettings.quality === q.id
                              ? 'border-blue-500 bg-blue-500/10 shadow-sm'
                              : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/40'
                          }`}
                        >
                          <p className="text-xs font-bold text-zinc-200">{q.label}</p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-1">{q.key}</p>
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-zinc-500 italic mt-1 flex items-center gap-1.5">
                      <FiInfo className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Automatic fallback: If YouTube does not provide Full HD for an older video, the player automatically falls back to High Quality.</span>
                    </p>
                  </section>

                  {/* Styling: Border Radius & Shadows */}
                  <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">Corner Radius & Shadows</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Fine-tune corner roundness and elevation drop shadows
                      </p>
                    </div>

                    {/* Corner Radius */}
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-medium text-zinc-300">Border Radius</span>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'rounded-none', label: 'Sharp' },
                          { id: 'rounded-lg', label: 'Subtle' },
                          { id: 'rounded-xl', label: 'Modern (XL)' },
                          { id: 'rounded-2xl', label: 'Pill (2XL)' },
                        ].map((r) => (
                          <button
                            key={r.id}
                            onClick={() => updateThumbnailSettings({ borderRadius: r.id })}
                            className={`py-2 px-3 rounded-lg border text-center transition-colors cursor-pointer ${
                              thumbnailSettings.borderRadius === r.id
                                ? 'border-blue-500 bg-blue-500/10 text-white font-medium'
                                : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            <span className="text-xs">{r.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Shadow Effect */}
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-medium text-zinc-300">Drop Shadow Elevation</span>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'shadow-none', label: 'Flat' },
                          { id: 'shadow-md', label: 'Medium' },
                          { id: 'shadow-lg', label: 'Elevated' },
                          { id: 'shadow-2xl', label: 'Deep Glow' },
                        ].map((s) => (
                          <button
                            key={s.id}
                            onClick={() => updateThumbnailSettings({ shadowEffect: s.id })}
                            className={`py-2 px-3 rounded-lg border text-center transition-colors cursor-pointer ${
                              thumbnailSettings.shadowEffect === s.id
                                ? 'border-blue-500 bg-blue-500/10 text-white font-medium'
                                : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            <span className="text-xs">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {/* TAB 2: Playback & Actions */}
              {activeTab === 'playback' && (
                <div className="flex flex-col gap-6">
                  {/* Playback Mode */}
                  <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">Click & Playback Interaction</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Choose what happens when you click on a video thumbnail card
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-1">
                      {[
                        {
                          id: 'embed',
                          title: 'In-App Embedded Player (Recommended)',
                          badge: 'Recommended',
                          desc: 'Clicking the thumbnail transforms it into an interactive YouTube player right inside the note. You can watch, pause, and take notes without switching tabs.',
                        },
                        {
                          id: 'always-embed',
                          title: 'Always Embedded Player',
                          badge: 'Immediate Video',
                          desc: 'Immediately renders the live YouTube player inside the note without requiring an initial click on a static thumbnail preview.',
                        },
                        {
                          id: 'tab',
                          title: 'Open in YouTube Tab',
                          badge: 'External Browser Tab',
                          desc: 'Clicking the thumbnail opens YouTube.com in a new browser tab, keeping notes lightweight.',
                        },
                      ].map((mode) => (
                        <label
                          key={mode.id}
                          onClick={() => updateThumbnailSettings({ playbackMode: mode.id })}
                          className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                            thumbnailSettings.playbackMode === mode.id
                              ? 'border-blue-500 bg-blue-500/10 shadow-sm'
                              : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800/30'
                          }`}
                        >
                          <input
                            type="radio"
                            name="playbackMode"
                            checked={thumbnailSettings.playbackMode === mode.id}
                            onChange={() => updateThumbnailSettings({ playbackMode: mode.id })}
                            className="mt-1 accent-blue-500 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-zinc-200">{mode.title}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400">
                                {mode.badge}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{mode.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </section>

                  {/* Playback Toggles */}
                  <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-4 divide-y divide-zinc-800/80">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">Behavioral Options</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Toggles for autoplay and note preview integration
                      </p>
                    </div>

                    {/* Autoplay */}
                    {thumbnailSettings.playbackMode !== 'tab' && (
                      <div className="flex items-center justify-between pt-4">
                        <div>
                          <p className="text-xs font-semibold text-zinc-200">Auto-start video playback on click</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Immediately starts playing the video when entering embed mode
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={thumbnailSettings.enableAutoplay}
                          onChange={(e) => updateThumbnailSettings({ enableAutoplay: e.target.checked })}
                          className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                        />
                      </div>
                    )}

                    {/* Note Preview Banner */}
                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">Display video banner at top of note preview</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Shows the attached video card at the top of the note when in Preview mode
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={thumbnailSettings.showInPreview}
                        onChange={(e) => updateThumbnailSettings({ showInPreview: e.target.checked })}
                        className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                      />
                    </div>
                  </section>
                </div>
              )}

              {/* TAB 3: Overlays & Badges */}
              {activeTab === 'overlays' && (
                <div className="flex flex-col gap-6">
                  <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-4 divide-y divide-zinc-800/80">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">Visual Overlays & Badges</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Control decorative cards, badges, and interactive elements on thumbnails
                      </p>
                    </div>

                    {/* YouTube Red Corner Badge */}
                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">YouTube Corner Badge</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Displays the red YouTube icon badge in the top-right corner
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={thumbnailSettings.showBadge}
                        onChange={(e) => updateThumbnailSettings({ showBadge: e.target.checked })}
                        className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                      />
                    </div>

                    {/* Circular Play Button */}
                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">Center Play Button Overlay</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Shows a centered translucent play button that expands on hover
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={thumbnailSettings.showPlayButton}
                        onChange={(e) => updateThumbnailSettings({ showPlayButton: e.target.checked })}
                        className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                      />
                    </div>

                    {/* Title Banner */}
                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">Video Title Banner Overlay</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Renders a gradient banner with the video title at the bottom of the thumbnail
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={thumbnailSettings.showTitleBanner}
                        onChange={(e) => updateThumbnailSettings({ showTitleBanner: e.target.checked })}
                        className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                      />
                    </div>

                    {/* Hover Zoom Effect */}
                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">Hover Zoom Animation</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Gently zooms the thumbnail image on cursor hover (micro-animation)
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={thumbnailSettings.hoverZoom}
                        onChange={(e) => updateThumbnailSettings({ hoverZoom: e.target.checked })}
                        className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                      />
                    </div>
                  </section>
                </div>
              )}

              {/* TAB 4: Storage & System */}
              {activeTab === 'storage' && (
                <div className="flex flex-col gap-6">
                  {/* Section 1: Supabase Cloud Database Info */}
                  <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                          <FiCloud className="w-4 h-4 text-blue-400" />
                          <span>Supabase Cloud Database</span>
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Collections, notes, and custom user settings are synchronized to your PostgreSQL cloud instance
                        </p>
                      </div>
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Cloud Native
                      </span>
                    </div>

                    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
                      <span className="text-xs font-medium text-zinc-400">Database Host (Supabase URL):</span>
                      <p className="font-mono text-xs text-zinc-200 bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800 select-all">
                        {import.meta.env.VITE_SUPABASE_URL || 'Not configured in .env'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={handleDownloadBackup}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium border border-zinc-700 transition-colors cursor-pointer"
                      >
                        <FiDownload className="w-3.5 h-3.5" />
                        <span>Download JSON Backup</span>
                      </button>
                    </div>
                  </section>

                  {/* Section 2: Export Data to PC (Local Disk & Files) */}
                  <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                          <FiHardDrive className="w-4 h-4 text-emerald-400" />
                          <span>Export Data to PC (Local Disk & Files)</span>
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Export all notes and collections as real markdown files, download offline JSON backups, or sync directly to local disk
                        </p>
                      </div>
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
                        <FiFolder className="w-3.5 h-3.5" />
                        PC Export Ready
                      </span>
                    </div>

                    {/* Export Feedback Banner */}
                    {exportFeedback && (
                      <div
                        className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                          exportFeedback.type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : exportFeedback.type === 'info'
                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                            : exportFeedback.type === 'warning'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : 'bg-red-500/10 border-red-500/30 text-red-300'
                        }`}
                      >
                        {exportFeedback.type === 'success' ? (
                          <FiCheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                        ) : exportFeedback.type === 'info' ? (
                          <FiInfo className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                        ) : (
                          <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                        )}
                        <div className="flex-1 font-sans">{exportFeedback.text}</div>
                        <button
                          onClick={() => setExportFeedback(null)}
                          className="text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* 3 Interactive Export Options Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {/* Option 1: Native PC Directory Picker (Markdown Files) */}
                      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <FiFolder className="w-4 h-4" />
                            </span>
                            <span className="text-xs font-semibold text-zinc-100">Pick PC Folder</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            Select any folder on your computer (e.g. Documents). Creates folders and individual <code className="text-emerald-400 font-mono">.md</code> files with frontmatter & settings.
                          </p>
                        </div>
                        <button
                          onClick={handleExportToPcFolder}
                          disabled={isExportingFolder || !isFileSystemAccessSupported()}
                          title={
                            isFileSystemAccessSupported()
                              ? 'Export directly to any PC directory'
                              : 'File System Access API not supported in this browser; use JSON download instead'
                          }
                          className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                          <FiFolder className={`w-3.5 h-3.5 ${isExportingFolder ? 'animate-bounce' : ''}`} />
                          <span>{isExportingFolder ? 'Writing Files…' : 'Export to PC Folder'}</span>
                        </button>
                      </div>

                      {/* Option 2: Full JSON Backup Download */}
                      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-blue-500/40 transition-all flex flex-col justify-between gap-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
                              <FiDownload className="w-4 h-4" />
                            </span>
                            <span className="text-xs font-semibold text-zinc-100">JSON Backup</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            Universal offline backup containing all notes, folders, and complete custom settings (theme colors, preview widths, layout).
                          </p>
                        </div>
                        <button
                          onClick={handleDownloadBackup}
                          title="Download complete JSON backup to your PC Downloads folder"
                          className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          <FiDownload className="w-3.5 h-3.5" />
                          <span>Download Backup</span>
                        </button>
                      </div>

                      {/* Option 3: Local Project Disk Sync & Explorer */}
                      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-purple-500/40 transition-all flex flex-col justify-between gap-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
                              <FiHardDrive className="w-4 h-4" />
                            </span>
                            <span className="text-xs font-semibold text-zinc-100">Project Disk Sync</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            Syncs notes to <code className="text-purple-300 font-mono text-[10px]">./notes/</code> and settings to <code className="text-purple-300 font-mono text-[10px]">./data/</code> on your PC disk. Open with 1-click in Explorer.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSyncLocalDisk}
                            disabled={isSyncingLocalDisk}
                            title="Sync notes to ./notes/ on local PC drive"
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <FiRefreshCw className={`w-3 h-3 ${isSyncingLocalDisk ? 'animate-spin' : ''}`} />
                            <span>{isSyncingLocalDisk ? 'Syncing…' : 'Sync Disk'}</span>
                          </button>
                          <button
                            onClick={handleOpenExplorer}
                            title="Reveal ./notes/ directory in Windows File Explorer"
                            className="flex items-center justify-center gap-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                          >
                            <FiExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Explorer</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Summary Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80 text-xs text-zinc-400">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <FiFileText className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Notes in Memory: <strong className="text-zinc-200 font-mono">{Object.keys(files || {}).length}</strong></span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FiFolder className="w-3.5 h-3.5 text-blue-400" />
                          <span>Folders: <strong className="text-zinc-200 font-mono">{(collections || []).length}</strong></span>
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500">
                        Exports include all custom syntax colors, preview dimensions & thumbnails
                      </span>
                    </div>
                  </section>

                  {/* Section 2: Custom Settings Cloud Persistence & SQL Migration */}
                  <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                          <FiDatabase className="w-4 h-4 text-purple-400" />
                          <span>Custom Settings Cloud Persistence</span>
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Theme accents, dark tones, 17 editor syntax colors, markdown preview styling, and thumbnails
                        </p>
                      </div>

                      {/* Real-time Settings Sync Status Badge */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {settingsSync.status === 'synced' && (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Synced to Cloud</span>
                            {settingsSync.lastSynced && (
                              <span className="text-[10px] text-zinc-400 font-mono ml-1">
                                {settingsSync.lastSynced}
                              </span>
                            )}
                          </span>
                        )}
                        {settingsSync.status === 'syncing' && (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Syncing…</span>
                          </span>
                        )}
                        {settingsSync.status === 'table_missing' && (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <FiAlertCircle className="w-3.5 h-3.5" />
                            <span>Table Missing (Run SQL)</span>
                          </span>
                        )}
                        {settingsSync.status === 'error' && (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            <FiAlertCircle className="w-3.5 h-3.5" />
                            <span>Sync Error</span>
                          </span>
                        )}
                        {settingsSync.status === 'idle' && (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                            <span>Idle (Ready to save)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Feedback Banner */}
                    {settingsSyncFeedback && (
                      <div
                        className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                          settingsSyncFeedback.type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : settingsSyncFeedback.type === 'warning'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : settingsSyncFeedback.type === 'info'
                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                            : 'bg-red-500/10 border-red-500/30 text-red-300'
                        }`}
                      >
                        {settingsSyncFeedback.type === 'success' ? (
                          <FiCheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        ) : (
                          <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 font-sans">{settingsSyncFeedback.text}</div>
                        <button
                          onClick={() => setSettingsSyncFeedback(null)}
                          className="text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Action Buttons Bar */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        onClick={handlePushSettingsNow}
                        disabled={isPushingSettings || !isSupabaseConfigured()}
                        title="Upload all current custom colors and layout settings to Supabase"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: themeSettings?.accentColor || '#2563eb' }}
                      >
                        <FiUploadCloud className={`w-4 h-4 ${isPushingSettings ? 'animate-bounce' : ''}`} />
                        <span>{isPushingSettings ? 'Saving to Supabase…' : 'Push Custom Settings to Cloud'}</span>
                      </button>

                      <button
                        onClick={handlePullSettingsNow}
                        disabled={isPullingSettings || !isSupabaseConfigured()}
                        title="Fetch settings stored in Supabase and apply to this browser"
                        className="flex items-center gap-2 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium border border-zinc-700/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiRefreshCw className={`w-3.5 h-3.5 ${isPullingSettings ? 'animate-spin' : ''}`} />
                        <span>{isPullingSettings ? 'Pulling…' : 'Pull Settings from Cloud'}</span>
                      </button>

                      <button
                        onClick={handleVerifySettingsTable}
                        disabled={isVerifyingTable || !isSupabaseConfigured()}
                        title="Check if public.settings table exists and is accessible"
                        className="flex items-center gap-2 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium border border-zinc-700/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiCheckCircle className={`w-3.5 h-3.5 ${isVerifyingTable ? 'animate-spin text-purple-400' : 'text-zinc-400'}`} />
                        <span>{isVerifyingTable ? 'Checking…' : 'Verify Table Status'}</span>
                      </button>
                    </div>


                    {/* Live Payload Summary */}
                    <div className="bg-zinc-950/50 border border-zinc-800/70 rounded-xl p-4 flex flex-col gap-3">
                      <span className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                        <FiSliders className="w-3.5 h-3.5 text-blue-400" />
                        <span>Active Synced Settings Payload</span>
                      </span>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800/70 flex flex-col gap-1">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Theme Accent</span>
                          <div className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: themeSettings?.accentColor || '#2563eb' }} />
                            <span className="font-mono text-zinc-200 text-xs">{themeSettings?.accentColor || '#2563eb'}</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800/70 flex flex-col gap-1">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Editor Tokens</span>
                          <span className="text-xs font-semibold text-zinc-200">
                            {Object.keys(editorColors || {}).length} Custom Colors
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800/70 flex flex-col gap-1">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Preview Width</span>
                          <span className="text-xs font-semibold text-zinc-200 font-mono">
                            {themeSettings?.previewMaxWidth || '896px'} (pad: {themeSettings?.previewPaddingX || '48px'})
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800/70 flex flex-col gap-1">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Thumbnail Mode</span>
                          <span className="text-xs font-semibold text-zinc-200 capitalize">
                            {thumbnailSettings?.playbackMode || 'embed'} ({thumbnailSettings?.aspectRatio || '16/9'})
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Supabase API Telemetry & Call Logs */}
                  <SupabaseApiLogger
                    collections={collections}
                    files={files}
                    themeSettings={themeSettings}
                    thumbnailSettings={thumbnailSettings}
                  />
                </div>
              )}

            </div>

            {/* ── Right Column: Presets & Live Interactive Preview (5 of 12 cols) ── */}
            {activeTab === 'theme' ? (
              <div className="xl:col-span-5 2xl:col-span-4 sticky top-4 flex flex-col gap-4">
                {/* Quick Theme Presets Card */}
                <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 flex flex-col gap-3 shadow-xl backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                      <FiZap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Curated Theme Presets</span>
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">1-click apply</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {THEME_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => updateThemeSettings(p.settings)}
                        className="px-3 py-2 text-left bg-zinc-800/60 hover:bg-zinc-700/80 text-zinc-300 hover:text-white rounded-xl border border-zinc-700/60 hover:border-zinc-500 transition-all cursor-pointer flex flex-col gap-0.5 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                            {p.label}
                          </span>
                          <span
                            className="w-2.5 h-2.5 rounded-full shadow-xs"
                            style={{ backgroundColor: p.settings.accentColor }}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 leading-tight truncate">
                          {p.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Theme & Typography Showcase Card */}
                <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-5 flex flex-col gap-4 shadow-xl backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full animate-pulse"
                        style={{ backgroundColor: themeSettings?.accentColor || '#2563eb' }}
                      />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                        Live Theme Showcase
                      </h2>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">Real-time</span>
                  </div>

                  {/* Active Specs Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/80 text-zinc-300 flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: themeSettings?.accentColor || '#2563eb' }}
                      />
                      {themeSettings?.accentColor}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/80 text-zinc-300">
                      Tone: {themeSettings?.backgroundTone}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/80 text-zinc-300">
                      UI: {themeSettings?.uiFontSize}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/80 text-zinc-300">
                      Editor: {themeSettings?.editorFontSize}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/80 text-zinc-300">
                      Font: {themeSettings?.editorFontFamily}
                    </span>
                  </div>

                  {/* Interactive UI Element Testbed */}
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-wrap items-center gap-2.5">
                    <button
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs cursor-pointer transition-transform active:scale-95"
                      style={{ backgroundColor: themeSettings?.accentColor || '#2563eb' }}
                    >
                      Primary Button
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors"
                      style={{
                        borderColor: `${themeSettings?.accentColor || '#2563eb'}80`,
                        color: themeSettings?.accentColor || '#2563eb',
                        backgroundColor: `${themeSettings?.accentColor || '#2563eb'}18`,
                      }}
                    >
                      Secondary
                    </button>
                    <span
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium border"
                      style={{
                        backgroundColor: `${themeSettings?.accentColor || '#2563eb'}20`,
                        borderColor: `${themeSettings?.accentColor || '#2563eb'}40`,
                        color: themeSettings?.accentColor || '#2563eb',
                      }}
                    >
                      Active Badge
                    </span>
                  </div>

                  {/* Live Typography Preview Box */}
                  <div
                    className="rounded-xl border p-4 flex flex-col gap-3 transition-colors"
                    style={{
                      backgroundColor: 'var(--app-bg-surface, #18181b)',
                      borderColor: 'var(--app-border-color, rgba(63, 63, 70, 0.7))',
                    }}
                  >
                    <h4
                      className="text-base font-bold tracking-tight"
                      style={{ color: themeSettings?.accentColor || '#2563eb' }}
                    >
                      Live Note Typography Preview
                    </h4>
                    <p
                      className="text-zinc-300 leading-relaxed transition-all"
                      style={{
                        fontSize: themeSettings?.previewFontSize || '16px',
                        lineHeight: themeSettings?.editorLineHeight || '1.7',
                      }}
                    >
                      Experience your custom font size and reading comfort. The editor and note previews dynamically scale according to your visual preference.
                    </p>

                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <code className="px-2 py-0.5 rounded bg-zinc-800/90 text-emerald-400 font-mono text-[11px] border border-zinc-700/60">
                        const theme = useSettings();
                      </code>
                      <a
                        href="#preview"
                        onClick={(e) => e.preventDefault()}
                        className="hover:underline font-medium"
                        style={{ color: themeSettings?.accentColor || '#2563eb' }}
                      >
                        Interactive link →
                      </a>
                    </div>

                    <blockquote
                      className="border-l-3 pl-3 text-xs italic text-zinc-400 mt-1"
                      style={{ borderColor: themeSettings?.accentColor || '#2563eb' }}
                    >
                      "A personal knowledge system should adapt seamlessly to your visual rhythm."
                    </blockquote>
                  </div>

                  {/* Color Palette Hierarchy Breakdown */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                      <span
                        className="w-4 h-4 rounded border border-zinc-700"
                        style={{ backgroundColor: 'var(--app-bg-base)' }}
                      />
                      <span className="text-[10px] text-zinc-400 font-mono">Base</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                      <span
                        className="w-4 h-4 rounded border border-zinc-700"
                        style={{ backgroundColor: 'var(--app-bg-surface)' }}
                      />
                      <span className="text-[10px] text-zinc-400 font-mono">Surface</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                      <span
                        className="w-4 h-4 rounded border border-zinc-700"
                        style={{ backgroundColor: 'var(--app-bg-sidebar)' }}
                      />
                      <span className="text-[10px] text-zinc-400 font-mono">Sidebar</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                      <span
                        className="w-4 h-4 rounded border border-zinc-700"
                        style={{ backgroundColor: themeSettings?.accentColor || '#2563eb' }}
                      />
                      <span className="text-[10px] text-zinc-400 font-mono">Accent</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'editorTheme' ? (
              <div className="xl:col-span-5 2xl:col-span-4 sticky top-4 flex flex-col gap-4">
                {colorTarget === 'editor' ? (
                  <>
                    {/* Curated Editor Theme Presets Card */}
                    <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 flex flex-col gap-3 shadow-xl backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                          <FiZap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Curated Editor Presets</span>
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono">1-click apply</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {EDITOR_THEME_PRESETS.map((p) => {
                          const isSelected =
                            editorColors.background === p.colors.background &&
                            editorColors.link === p.colors.link &&
                            editorColors.keyword === p.colors.keyword;
                          return (
                            <button
                              key={p.id}
                              onClick={() => updateEditorColors(p.colors)}
                              className={`p-3 text-left rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 group ${
                                isSelected
                                  ? 'bg-zinc-800/90 border-blue-500 shadow-md ring-1 ring-blue-500/30'
                                  : 'bg-zinc-800/50 hover:bg-zinc-700/70 border-zinc-700/60 hover:border-zinc-500 text-zinc-300 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-zinc-100 group-hover:text-white truncate">
                                  {p.label}
                                </span>
                                <div className="flex items-center gap-1 shrink-0 ml-1.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-white/20"
                                    style={{ backgroundColor: p.colors.background }}
                                    title="Background"
                                  />
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-white/20"
                                    style={{ backgroundColor: p.colors.link }}
                                    title="Link"
                                  />
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-white/20"
                                    style={{ backgroundColor: p.colors.keyword }}
                                    title="Keyword"
                                  />
                                </div>
                              </div>
                              <span className="text-[10px] text-zinc-400 group-hover:text-zinc-300 leading-tight">
                                {p.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Interactive Live Code Editor Showcase Card */}
                    <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 flex flex-col gap-3 shadow-xl backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full animate-pulse"
                            style={{ backgroundColor: editorColors?.link || '#60a5fa' }}
                          />
                          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                            Live Editor Showcase
                          </h2>
                        </div>

                        {/* Switcher: Code View vs Rendered Markdown */}
                        <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-[10px] font-medium">
                          <button
                            onClick={() => setEditorPreviewMode('code')}
                            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                              editorPreviewMode === 'code'
                                ? 'bg-zinc-800 text-white shadow-xs font-semibold'
                                : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <FiCode className="w-3 h-3" />
                            <span>Code View</span>
                          </button>
                          <button
                            onClick={() => setEditorPreviewMode('preview')}
                            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                              editorPreviewMode === 'preview'
                                ? 'bg-zinc-800 text-white shadow-xs font-semibold'
                                : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <FiEye className="w-3 h-3" />
                            <span>Rendered</span>
                          </button>
                        </div>
                      </div>

                      {/* The Live Interactive Container */}
                      <div
                        className="rounded-xl border overflow-hidden font-mono text-xs transition-colors duration-200 shadow-inner"
                        style={{
                          backgroundColor: editorColors.background,
                          borderColor: editorColors.gutterBorder || '#27272a',
                          minHeight: '260px',
                        }}
                      >
                        {editorPreviewMode === 'code' ? (
                          <div className="flex h-full">
                            {/* Gutter Line Numbers */}
                            <div
                              className="select-none py-3 px-2 text-right flex flex-col gap-1.5 shrink-0"
                              style={{
                                backgroundColor: editorColors.gutterBg || editorColors.background,
                                color: editorColors.gutterText || '#52525b',
                                borderRight: `1px solid ${editorColors.gutterBorder || '#27272a'}`,
                                minWidth: '34px',
                              }}
                            >
                              <div>1</div>
                              <div>2</div>
                              <div style={{ color: editorColors.link, fontWeight: 'bold' }}>3</div>
                              <div>4</div>
                              <div>5</div>
                              <div>6</div>
                              <div>7</div>
                            </div>

                            {/* Code Lines */}
                            <div className="flex-1 py-3 px-3.5 flex flex-col gap-1.5 overflow-x-auto">
                              <div className="whitespace-nowrap" style={{ color: editorColors.heading, fontWeight: '700' }}>
                                # YouTube Summary &amp; Analysis Notes
                              </div>
                              <div className="whitespace-nowrap" style={{ color: editorColors.bold, fontWeight: 'bold' }}>
                                **Key Takeaways &amp; Video Chapters:**
                              </div>
                              <div
                                className="whitespace-nowrap px-1 rounded -mx-1"
                                style={{
                                  backgroundColor: editorColors.activeLineBg || 'rgba(39, 39, 42, 0.4)',
                                }}
                              >
                                <span style={{ color: editorColors.text }}>• [03:45 Introduction](</span>
                                <span
                                  style={{
                                    color: editorColors.link,
                                    textDecoration: 'underline',
                                    fontWeight: '600',
                                  }}
                                >
                                  https://youtu.be/demo?t=225
                                </span>
                                <span style={{ color: editorColors.text }}>)</span>
                              </div>
                              <div className="whitespace-nowrap flex items-center">
                                <span style={{ color: editorColors.keyword }}>const</span>
                                <span style={{ color: editorColors.text }}> playbackSpeed = </span>
                                <span style={{ color: editorColors.number }}>1.75</span>
                                <span style={{ color: editorColors.text }}>; </span>
                                <span style={{ color: editorColors.comment, fontStyle: 'italic' }}>
                                  // Optimal pace
                                </span>
                                <span
                                  className="inline-block w-0.5 h-3.5 ml-0.5 animate-pulse"
                                  style={{ backgroundColor: editorColors.cursor }}
                                />
                              </div>
                              <div className="whitespace-nowrap">
                                <span style={{ color: editorColors.keyword }}>const</span>
                                <span style={{ color: editorColors.text }}> title = </span>
                                <span style={{ color: editorColors.string }}>"Mastering Focus &amp; Energy"</span>
                                <span style={{ color: editorColors.text }}>;</span>
                              </div>
                              <div className="whitespace-nowrap">
                                <span style={{ color: editorColors.text }}>Run with </span>
                                <span
                                  className="px-1 py-0.5 rounded text-[11px]"
                                  style={{
                                    color: editorColors.code,
                                    backgroundColor: 'rgba(255,255,255,0.06)',
                                  }}
                                >
                                  `npm run dev`
                                </span>
                                <span style={{ color: editorColors.text }}> for live preview.</span>
                              </div>
                              <div
                                className="whitespace-nowrap"
                                style={{ color: editorColors.italic, fontStyle: 'italic' }}
                              >
                                _Auto-saved to Supabase Cloud Database_
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Rendered Markdown View */
                          <div
                            className="p-4 flex flex-col gap-3 font-sans"
                            style={{ color: editorColors.text }}
                          >
                            <h1
                              className="text-lg font-bold border-b pb-1"
                              style={{
                                color: editorColors.heading,
                                borderColor: editorColors.gutterBorder || '#27272a',
                              }}
                            >
                              YouTube Summary &amp; Analysis Notes
                            </h1>
                            <p className="text-xs leading-relaxed" style={{ color: editorColors.text }}>
                              <strong style={{ color: editorColors.bold }}>Key Takeaways: </strong>
                              Quickly capture insights, video timestamps, and code snippets.
                            </p>
                            <p className="text-xs">
                              Watch chapter:{' '}
                              <a
                                href="#preview"
                                onClick={(e) => e.preventDefault()}
                                className="underline font-semibold"
                                style={{ color: editorColors.link }}
                              >
                                03:45 Introduction to Deep Work
                              </a>
                            </p>
                            <div
                              className="p-2.5 rounded-lg border text-xs font-mono"
                              style={{
                                backgroundColor: 'rgba(0,0,0,0.25)',
                                borderColor: editorColors.gutterBorder || '#27272a',
                                color: editorColors.code,
                              }}
                            >
                              const speed = 1.75; // Recommended playback speed
                            </div>
                            <p className="text-[11px] italic" style={{ color: editorColors.italic }}>
                              *Note: Timestamps automatically seek the embedded player.*
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Token Color Swatches Breakdown */}
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-800/80">
                        {[
                          { label: 'Background', color: editorColors.background },
                          { label: 'Text', color: editorColors.text },
                          { label: 'Link', color: editorColors.link },
                          { label: 'Heading', color: editorColors.heading },
                          { label: 'Keyword', color: editorColors.keyword },
                          { label: 'Code', color: editorColors.code },
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 p-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60"
                          >
                            <span
                              className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                              style={{ backgroundColor: item.color }}
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] text-zinc-400 truncate">{item.label}</span>
                              <span className="text-[9px] text-zinc-500 font-mono truncate">{item.color}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Curated Markdown Preview Theme Presets Card */}
                    <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 flex flex-col gap-3 shadow-xl backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                          <FiZap className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Curated Preview Presets</span>
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono">1-click apply</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {PREVIEW_THEME_PRESETS.map((p) => {
                          const isSelected =
                            previewColors.background === p.colors.background &&
                            previewColors.link === p.colors.link &&
                            previewColors.heading === p.colors.heading;
                          return (
                            <button
                              key={p.id}
                              onClick={() => updatePreviewColors(p.colors)}
                              className={`p-3 text-left rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 group ${
                                isSelected
                                  ? 'bg-zinc-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                                  : 'bg-zinc-800/50 hover:bg-zinc-700/70 border-zinc-700/60 hover:border-zinc-500 text-zinc-300 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-zinc-100 group-hover:text-white truncate">
                                  {p.label}
                                </span>
                                <div className="flex items-center gap-1 shrink-0 ml-1.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-white/20"
                                    style={{ backgroundColor: p.colors.background }}
                                    title="Background"
                                  />
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-white/20"
                                    style={{ backgroundColor: p.colors.link }}
                                    title="Link"
                                  />
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-white/20"
                                    style={{ backgroundColor: p.colors.code }}
                                    title="Code"
                                  />
                                </div>
                              </div>
                              <span className="text-[10px] text-zinc-400 group-hover:text-zinc-300 leading-tight">
                                {p.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Interactive Live Markdown Preview Showcase Card */}
                    <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 flex flex-col gap-3 shadow-xl backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full animate-pulse"
                            style={{ backgroundColor: previewColors?.link || '#60a5fa' }}
                          />
                          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                            Live Preview Showcase
                          </h2>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-emerald-400 border border-zinc-700 font-mono">
                            {themeSettings?.previewMaxWidth || '896px'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                            ±{themeSettings?.previewPaddingX || '48px'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            Rendered View
                          </span>
                        </div>
                      </div>

                      {/* Rendered Preview Showcase Container */}
                      <div
                        className="rounded-xl border p-4 flex flex-col gap-3 font-sans transition-all duration-200 shadow-inner overflow-hidden"
                        style={{
                          backgroundColor: previewColors.background,
                          borderColor: previewColors.tableBorder || '#3f3f46',
                          minHeight: '260px',
                          paddingLeft: `max(16px, min(36px, ${(parseInt(themeSettings?.previewPaddingX || '48', 10) || 48) * 0.5}px))`,
                          paddingRight: `max(16px, min(36px, ${(parseInt(themeSettings?.previewPaddingX || '48', 10) || 48) * 0.5}px))`,
                        }}
                      >
                        {/* Heading */}
                        <h1
                          className="text-base font-bold border-b pb-1.5"
                          style={{
                            color: previewColors.heading,
                            borderColor: previewColors.hrBorder || '#3f3f46',
                          }}
                        >
                          Deep Learning &amp; AI Systems Notes
                        </h1>

                        {/* Paragraph with bold, link, italic */}
                        <p className="text-xs leading-relaxed" style={{ color: previewColors.text }}>
                          <strong style={{ color: previewColors.bold }}>Summary Overview: </strong>
                          Watch the key insights at{' '}
                          <a
                            href="#preview"
                            onClick={(e) => e.preventDefault()}
                            className="underline font-semibold"
                            style={{ color: previewColors.link }}
                          >
                            04:15 Architecture Overview
                          </a>{' '}
                          to understand neural optimization.
                        </p>

                        {/* Blockquote */}
                        <blockquote
                          className="border-l-3 pl-3 text-xs italic my-0.5"
                          style={{
                            borderColor: previewColors.blockquoteBorder,
                            color: previewColors.blockquoteText,
                          }}
                        >
                          "The goal is not just faster models, but clearer cognitive reasoning."
                        </blockquote>

                        {/* Code snippet */}
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          <span style={{ color: previewColors.text }}>Inline token:</span>
                          <code
                            className="px-2 py-0.5 rounded text-[11px] font-mono border"
                            style={{
                              color: previewColors.code,
                              backgroundColor: previewColors.codeBg,
                              borderColor: previewColors.tableBorder,
                            }}
                          >
                            const model = new Transformer();
                          </code>
                        </div>

                        {/* Mini Data Table */}
                        <div className="overflow-x-auto mt-1">
                          <table
                            className="w-full text-[11px] text-left border-collapse border"
                            style={{ borderColor: previewColors.tableBorder }}
                          >
                            <thead>
                              <tr style={{ backgroundColor: previewColors.tableHeaderBg }}>
                                <th className="px-2.5 py-1 font-semibold border" style={{ borderColor: previewColors.tableBorder, color: previewColors.heading }}>Metric</th>
                                <th className="px-2.5 py-1 font-semibold border" style={{ borderColor: previewColors.tableBorder, color: previewColors.heading }}>Latency</th>
                                <th className="px-2.5 py-1 font-semibold border" style={{ borderColor: previewColors.tableBorder, color: previewColors.heading }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="px-2.5 py-1 border" style={{ borderColor: previewColors.tableBorder, color: previewColors.text }}>Inference Time</td>
                                <td className="px-2.5 py-1 border font-mono" style={{ borderColor: previewColors.tableBorder, color: previewColors.code }}>12.4ms</td>
                                <td className="px-2.5 py-1 border" style={{ borderColor: previewColors.tableBorder, color: previewColors.link }}>Optimal</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* HR divider */}
                        <hr
                          className="my-1 border-t"
                          style={{ borderColor: previewColors.hrBorder }}
                        />

                        <p className="text-[10px] italic" style={{ color: previewColors.italic }}>
                          *Rendered exactly as configured in your custom preview theme.*
                        </p>
                      </div>

                      {/* Token Color Swatches Breakdown */}
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-800/80">
                        {[
                          { label: 'Background', color: previewColors.background },
                          { label: 'Text', color: previewColors.text },
                          { label: 'Link', color: previewColors.link },
                          { label: 'Heading', color: previewColors.heading },
                          { label: 'Code', color: previewColors.code },
                          { label: 'Quote Border', color: previewColors.blockquoteBorder },
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 p-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60"
                          >
                            <span
                              className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                              style={{ backgroundColor: item.color }}
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] text-zinc-400 truncate">{item.label}</span>
                              <span className="text-[9px] text-zinc-500 font-mono truncate">{item.color}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : activeTab !== 'storage' ? (
              <div className="xl:col-span-5 2xl:col-span-4 sticky top-4 flex flex-col gap-4">
                {/* Quick Presets Card */}
                <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 flex flex-col gap-3 shadow-xl backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                      <FiZap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Quick Presets</span>
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">1-click apply</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'standard', label: 'Standard', desc: 'Balanced default' },
                      { id: 'cinema', label: 'Cinema Wide', desc: '21:9 cinematic' },
                      { id: 'minimal', label: 'Minimal', desc: 'Clean borderless' },
                      { id: 'player', label: 'Always Player', desc: 'Direct embed' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => applyPreset(p.id)}
                        className="px-3 py-2 text-left bg-zinc-800/60 hover:bg-zinc-700/80 text-zinc-300 hover:text-white rounded-xl border border-zinc-700/60 hover:border-blue-500/50 transition-all cursor-pointer flex flex-col gap-0.5 group"
                      >
                        <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">{p.label}</span>
                        <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 leading-tight">{p.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Interactive Preview Card */}
                <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-5 flex flex-col gap-4 shadow-xl backdrop-blur-sm">
                  
                  {/* Preview Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                        Live Interactive Preview
                      </h2>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">Real-time</span>
                  </div>

                  {/* Configuration Specs Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/80 text-zinc-300">
                      Ratio: {thumbnailSettings.aspectRatio}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/80 text-zinc-300">
                      Quality: {thumbnailSettings.quality}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/80 text-zinc-300">
                      Mode: {thumbnailSettings.playbackMode}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/80 text-zinc-300">
                      Size: {thumbnailSettings.size}
                    </span>
                  </div>

                  {/* The Actual Live YoutubeThumbnail Component */}
                  <div className="bg-zinc-950/80 rounded-xl border border-zinc-800/80 p-3 min-h-60 flex items-center justify-center">
                    <YoutubeThumbnail
                      videoId={testVideoId}
                      title={testVideoTitle}
                      settingsOverride={thumbnailSettings}
                    />
                  </div>

                  {/* Mode description notice */}
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-[11px] text-zinc-400 leading-relaxed flex items-start gap-2">
                    <FiInfo className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      {thumbnailSettings.playbackMode === 'embed' && (
                        <p><strong className="text-zinc-200">Click to Play:</strong> Click the thumbnail above to test the in-app player. It will stream the video right here!</p>
                      )}
                      {thumbnailSettings.playbackMode === 'always-embed' && (
                        <p><strong className="text-zinc-200">Always Embedded:</strong> The YouTube video player loads directly in your notes without a thumbnail click.</p>
                      )}
                      {thumbnailSettings.playbackMode === 'tab' && (
                        <p><strong className="text-zinc-200">External Tab:</strong> Clicking the thumbnail navigates to YouTube.com in a new browser tab.</p>
                      )}
                    </div>
                  </div>

                  {/* Test with custom URL */}
                  <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2">
                    <span className="text-xs font-medium text-zinc-300">Test with another YouTube URL:</span>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={customTestUrl}
                        onChange={(e) => setCustomTestUrl(e.target.value)}
                        placeholder="Paste YouTube link to preview…"
                        className="flex-1 bg-zinc-950 text-xs px-3 py-1.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-blue-500 text-zinc-200"
                        onKeyDown={(e) => e.key === 'Enter' && handleSetCustomVideo()}
                      />
                      <button
                        onClick={handleSetCustomVideo}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 rounded-lg transition-colors border border-zinc-700 cursor-pointer"
                      >
                        Load
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ) : null}

          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
