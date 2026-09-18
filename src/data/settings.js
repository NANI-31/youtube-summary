/**
 * Application & Thumbnail Settings Layer
 * Persists user configuration to localStorage and syncs with PC disk.
 */

const SETTINGS_KEY = 'youtube-summary-settings-v1';

export const DEFAULT_EDITOR_COLORS = {
  background: '#09090b',
  text: '#ffffff',
  link: '#60a5fa',
  heading: '#93c5fd',
  bold: '#ffffff',
  italic: '#e4e4e7',
  code: '#34d399',
  keyword: '#c084fc',
  string: '#a3e635',
  number: '#38bdf8',
  comment: '#71717a',
  activeLineBg: 'rgba(39, 39, 42, 0.4)',
  selectionBg: 'rgba(37, 99, 235, 0.28)',
  cursor: '#60a5fa',
  gutterBg: '#09090b',
  gutterText: '#52525b',
  gutterBorder: '#27272a',
};

export const EDITOR_THEME_PRESETS = [
  {
    id: 'vscode-dark',
    label: 'VS Code Dark Modern',
    desc: 'Classic Visual Studio Code palette with bright white text and blue links',
    colors: {
      background: '#09090b',
      text: '#ffffff',
      link: '#60a5fa',
      heading: '#93c5fd',
      bold: '#ffffff',
      italic: '#e4e4e7',
      code: '#34d399',
      keyword: '#c084fc',
      string: '#a3e635',
      number: '#38bdf8',
      comment: '#71717a',
      activeLineBg: 'rgba(39, 39, 42, 0.4)',
      selectionBg: 'rgba(37, 99, 235, 0.28)',
      cursor: '#60a5fa',
      gutterBg: '#09090b',
      gutterText: '#52525b',
      gutterBorder: '#27272a',
    },
  },
  {
    id: 'one-dark-pro',
    label: 'One Dark Pro',
    desc: 'Atom-inspired dark theme with soothing pastels and balanced tones',
    colors: {
      background: '#282c34',
      text: '#abb2bf',
      link: '#61afef',
      heading: '#e06c75',
      bold: '#ffffff',
      italic: '#c8ccd4',
      code: '#98c379',
      keyword: '#c678dd',
      string: '#98c379',
      number: '#d19a66',
      comment: '#5c6370',
      activeLineBg: 'rgba(44, 49, 58, 0.7)',
      selectionBg: 'rgba(62, 68, 81, 0.6)',
      cursor: '#528bff',
      gutterBg: '#282c34',
      gutterText: '#4b5263',
      gutterBorder: '#1e2227',
    },
  },
  {
    id: 'tokyo-night',
    label: 'Tokyo Night',
    desc: 'Clean neon aesthetic inspired by Tokyo nightlife and dark blue alleys',
    colors: {
      background: '#1a1b26',
      text: '#c0caf5',
      link: '#7aa2f7',
      heading: '#7dcfff',
      bold: '#ffffff',
      italic: '#a9b1d6',
      code: '#73daca',
      keyword: '#bb9af7',
      string: '#9ece6a',
      number: '#ff9e64',
      comment: '#565f89',
      activeLineBg: 'rgba(41, 46, 66, 0.6)',
      selectionBg: 'rgba(51, 70, 116, 0.5)',
      cursor: '#c0caf5',
      gutterBg: '#1a1b26',
      gutterText: '#414868',
      gutterBorder: '#24283b',
    },
  },
  {
    id: 'dracula',
    label: 'Dracula Vampire',
    desc: 'Famous high-contrast dark theme with gothic purple, pink, and cyan',
    colors: {
      background: '#282a36',
      text: '#f8f8f2',
      link: '#8be9fd',
      heading: '#bd93f9',
      bold: '#ffffff',
      italic: '#e2e2dc',
      code: '#50fa7b',
      keyword: '#ff79c6',
      string: '#f1fa8c',
      number: '#bd93f9',
      comment: '#6272a4',
      activeLineBg: 'rgba(68, 71, 90, 0.5)',
      selectionBg: 'rgba(68, 71, 90, 0.8)',
      cursor: '#f8f8f0',
      gutterBg: '#282a36',
      gutterText: '#6272a4',
      gutterBorder: '#191a21',
    },
  },
  {
    id: 'monokai-pro',
    label: 'Monokai Pro',
    desc: 'Warm charcoal background with beautifully calibrated spectrum spectrums',
    colors: {
      background: '#2d2a2e',
      text: '#fcfcfa',
      link: '#78dce8',
      heading: '#ffd866',
      bold: '#ffffff',
      italic: '#e5e5e3',
      code: '#a9dc76',
      keyword: '#ff6188',
      string: '#a9dc76',
      number: '#ab9df2',
      comment: '#727072',
      activeLineBg: 'rgba(66, 63, 67, 0.5)',
      selectionBg: 'rgba(91, 88, 92, 0.7)',
      cursor: '#fcfcfa',
      gutterBg: '#2d2a2e',
      gutterText: '#727072',
      gutterBorder: '#1e1c1e',
    },
  },
  {
    id: 'oled-pure-black',
    label: 'Pure OLED Midnight',
    desc: 'Absolute pitch black (#000000) with vivid electric cyan and pure white',
    colors: {
      background: '#000000',
      text: '#ffffff',
      link: '#38bdf8',
      heading: '#60a5fa',
      bold: '#ffffff',
      italic: '#cbd5e1',
      code: '#4ade80',
      keyword: '#a855f7',
      string: '#22c55e',
      number: '#06b6d4',
      comment: '#52525b',
      activeLineBg: 'rgba(24, 24, 27, 0.7)',
      selectionBg: 'rgba(37, 99, 235, 0.35)',
      cursor: '#38bdf8',
      gutterBg: '#000000',
      gutterText: '#3f3f46',
      gutterBorder: '#18181b',
    },
  },
  {
    id: 'cyberpunk-neon',
    label: 'Cyberpunk Neon',
    desc: 'Electric neon yellow, magenta, and cyan on high-tech deep abyss',
    colors: {
      background: '#0d0d17',
      text: '#f1f1f6',
      link: '#00e8c6',
      heading: '#ff0055',
      bold: '#ffffff',
      italic: '#d1d1e0',
      code: '#00e8c6',
      keyword: '#ff0055',
      string: '#ffe600',
      number: '#00e8c6',
      comment: '#494d64',
      activeLineBg: 'rgba(25, 25, 42, 0.8)',
      selectionBg: 'rgba(255, 0, 85, 0.3)',
      cursor: '#ffe600',
      gutterBg: '#0d0d17',
      gutterText: '#494d64',
      gutterBorder: '#1b1b2f',
    },
  },
];

export const DEFAULT_PREVIEW_COLORS = {
  background: '#09090b',
  text: '#ffffff',
  link: '#60a5fa',
  heading: '#93c5fd',
  bold: '#ffffff',
  italic: '#e4e4e7',
  code: '#34d399',
  codeBg: 'rgba(39, 39, 42, 0.6)',
  blockquoteBorder: '#3b82f6',
  blockquoteText: '#a1a1aa',
  tableHeaderBg: '#27272a',
  tableBorder: '#3f3f46',
  hrBorder: '#3f3f46',
};

export const PREVIEW_THEME_PRESETS = [
  {
    id: 'preview-dark-modern',
    label: 'Dark Modern',
    desc: 'Deep obsidian canvas with crisp white reading text and blue links',
    colors: {
      background: '#09090b',
      text: '#ffffff',
      link: '#60a5fa',
      heading: '#93c5fd',
      bold: '#ffffff',
      italic: '#e4e4e7',
      code: '#34d399',
      codeBg: 'rgba(39, 39, 42, 0.6)',
      blockquoteBorder: '#3b82f6',
      blockquoteText: '#a1a1aa',
      tableHeaderBg: '#27272a',
      tableBorder: '#3f3f46',
      hrBorder: '#3f3f46',
    },
  },
  {
    id: 'preview-one-dark',
    label: 'One Dark Paper',
    desc: 'Calm charcoal background with soft pastel headings and amber highlights',
    colors: {
      background: '#282c34',
      text: '#abb2bf',
      link: '#61afef',
      heading: '#e06c75',
      bold: '#ffffff',
      italic: '#c8ccd4',
      code: '#98c379',
      codeBg: '#21252b',
      blockquoteBorder: '#c678dd',
      blockquoteText: '#abb2bf',
      tableHeaderBg: '#21252b',
      tableBorder: '#3e4451',
      hrBorder: '#3e4451',
    },
  },
  {
    id: 'preview-tokyo-night',
    label: 'Tokyo Night Reading',
    desc: 'Indigo night background with cyan titles and soft purple accents',
    colors: {
      background: '#1a1b26',
      text: '#c0caf5',
      link: '#7aa2f7',
      heading: '#7dcfff',
      bold: '#ffffff',
      italic: '#a9b1d6',
      code: '#73daca',
      codeBg: '#16161e',
      blockquoteBorder: '#bb9af7',
      blockquoteText: '#9aa5ce',
      tableHeaderBg: '#16161e',
      tableBorder: '#24283b',
      hrBorder: '#24283b',
    },
  },
  {
    id: 'preview-dracula',
    label: 'Dracula Velvet',
    desc: 'High contrast gothic dark with purple headers, emerald code, and cyan links',
    colors: {
      background: '#282a36',
      text: '#f8f8f2',
      link: '#8be9fd',
      heading: '#bd93f9',
      bold: '#ffffff',
      italic: '#e2e2dc',
      code: '#50fa7b',
      codeBg: '#21222c',
      blockquoteBorder: '#ff79c6',
      blockquoteText: '#f1fa8c',
      tableHeaderBg: '#21222c',
      tableBorder: '#44475a',
      hrBorder: '#44475a',
    },
  },
  {
    id: 'preview-oled',
    label: 'Pure OLED Contrast',
    desc: 'Pitch #000000 black canvas for maximum readability on OLED displays',
    colors: {
      background: '#000000',
      text: '#ffffff',
      link: '#38bdf8',
      heading: '#60a5fa',
      bold: '#ffffff',
      italic: '#cbd5e1',
      code: '#4ade80',
      codeBg: '#18181b',
      blockquoteBorder: '#38bdf8',
      blockquoteText: '#a1a1aa',
      tableHeaderBg: '#18181b',
      tableBorder: '#27272a',
      hrBorder: '#27272a',
    },
  },
  {
    id: 'preview-warm-editorial',
    label: 'Warm Editorial Book',
    desc: 'Warm charcoal background with amber headings for cozy long-form reading',
    colors: {
      background: '#1c1917',
      text: '#f5f5f4',
      link: '#fbbf24',
      heading: '#fde68a',
      bold: '#ffffff',
      italic: '#d6d3d1',
      code: '#86efac',
      codeBg: '#292524',
      blockquoteBorder: '#f59e0b',
      blockquoteText: '#d6d3d1',
      tableHeaderBg: '#292524',
      tableBorder: '#44403c',
      hrBorder: '#44403c',
    },
  },
  {
    id: 'preview-cyberpunk',
    label: 'Cyberpunk Neon',
    desc: 'Futuristic abyss with fluorescent pink headers, yellow code, and cyan links',
    colors: {
      background: '#0d0d17',
      text: '#f1f1f6',
      link: '#00e8c6',
      heading: '#ff0055',
      bold: '#ffffff',
      italic: '#d1d1e0',
      code: '#ffe600',
      codeBg: '#1b1b2f',
      blockquoteBorder: '#00e8c6',
      blockquoteText: '#d1d1e0',
      tableHeaderBg: '#1b1b2f',
      tableBorder: '#2d2d4d',
      hrBorder: '#2d2d4d',
    },
  },
];

export const PREVIEW_WIDTH_PRESETS = [
  { id: '680px', label: 'Narrow', desc: '680px (Book format)', width: '680px' },
  { id: '768px', label: 'Compact', desc: '768px (Reading column)', width: '768px' },
  { id: '896px', label: 'Standard', desc: '896px (Default)', width: '896px' },
  { id: '1024px', label: 'Medium Wide', desc: '1024px', width: '1024px' },
  { id: '1152px', label: 'Wide', desc: '1152px (Extended)', width: '1152px' },
  { id: '1400px', label: 'Extra Wide', desc: '1400px (Cinematic)', width: '1400px' },
  { id: '100%', label: 'Full Width', desc: '100% edge-to-edge', width: '100%' },
];

export const PREVIEW_PADDING_PRESETS = [
  { id: '16px', label: 'Compact', desc: '16px (1rem)', padding: '16px' },
  { id: '32px', label: 'Normal', desc: '32px (2rem)', padding: '32px' },
  { id: '48px', label: 'Comfortable', desc: '48px (3rem - Default)', padding: '48px' },
  { id: '64px', label: 'Spacious', desc: '64px (4rem)', padding: '64px' },
  { id: '96px', label: 'Luxurious', desc: '96px (6rem)', padding: '96px' },
  { id: '128px', label: 'Editorial', desc: '128px (8rem)', padding: '128px' },
];

export const DEFAULT_THEME_SETTINGS = {
  accentColor: '#2563eb', // Electric Blue default
  accentHover: '#3b82f6',
  backgroundTone: 'obsidian', // 'obsidian' | 'oled' | 'slate' | 'charcoal'
  surfaceContrast: 'contrast', // 'contrast' | 'seamless'
  borderIntensity: 'standard', // 'subtle' | 'standard' | 'high'
  uiFontSize: '14px', // '12px' | '13px' | '14px' | '15px' | '16px'
  editorFontSize: '15px', // '13px' | '15px' | '17px' | '19px' | '21px'
  previewFontSize: '16px', // '14px' | '15px' | '16px' | '17px' | '18px' | '20px'
  editorLineHeight: '1.7', // '1.5' | '1.7' | '1.9' | '2.1'
  editorFontFamily: 'mono', // 'mono' | 'sans' | 'serif'
  previewMaxWidth: '896px', // '680px' | '768px' | '896px' | '1024px' | '1152px' | '1400px' | '100%' | custom
  previewPaddingX: '48px', // '16px' | '32px' | '48px' | '64px' | '96px' | '128px' | custom
  editorColors: DEFAULT_EDITOR_COLORS,
  previewColors: DEFAULT_PREVIEW_COLORS,
};

export const DEFAULT_SETTINGS = {
  theme: DEFAULT_THEME_SETTINGS,
  thumbnail: {
    quality: 'hqdefault', // 'maxresdefault' | 'hqdefault' | 'mqdefault' | 'default'
    size: 'medium', // 'compact' | 'medium' | 'full'
    aspectRatio: '16/9', // '16/9' | '4/3' | '21/9'
    playbackMode: 'embed', // 'embed' (click to play in-app) | 'tab' (open YouTube) | 'always-embed'
    showBadge: true,
    showPlayButton: true,
    showTitleBanner: true,
    borderRadius: 'rounded-xl', // 'rounded-none' | 'rounded-lg' | 'rounded-xl' | 'rounded-2xl'
    hoverZoom: true,
    enableAutoplay: true,
    showInPreview: true,
    shadowEffect: 'shadow-lg', // 'shadow-none' | 'shadow-md' | 'shadow-lg' | 'shadow-2xl'
  },
};

/**
 * Apply CSS custom properties dynamically to document.documentElement
 */
export function applyThemeToDocument(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const t = { ...DEFAULT_THEME_SETTINGS, ...(theme || {}) };

  // 1. Accent color
  const accent = t.accentColor || '#2563eb';
  root.style.setProperty('--app-accent-color', accent);
  root.style.setProperty('--app-accent-hover', t.accentHover || accent);

  const cleanHex = accent.replace('#', '');
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    root.style.setProperty('--app-accent-rgb', `${r}, ${g}, ${b}`);
  }

  // 2. Background tone & surface contrast
  let bgBase = '#09090b';
  let bgSurface = '#18181b';
  let bgSidebar = '#111114';

  if (t.backgroundTone === 'oled') {
    bgBase = '#000000';
    bgSurface = t.surfaceContrast === 'contrast' ? '#0d0d10' : '#000000';
    bgSidebar = t.surfaceContrast === 'contrast' ? '#070709' : '#000000';
  } else if (t.backgroundTone === 'slate') {
    bgBase = '#0b1120';
    bgSurface = t.surfaceContrast === 'contrast' ? '#151e34' : '#0b1120';
    bgSidebar = t.surfaceContrast === 'contrast' ? '#0e1628' : '#0b1120';
  } else if (t.backgroundTone === 'charcoal') {
    bgBase = '#121214';
    bgSurface = t.surfaceContrast === 'contrast' ? '#1c1c20' : '#121214';
    bgSidebar = t.surfaceContrast === 'contrast' ? '#161619' : '#121214';
  } else {
    // obsidian (default)
    bgBase = '#09090b';
    bgSurface = t.surfaceContrast === 'contrast' ? '#18181b' : '#09090b';
    bgSidebar = t.surfaceContrast === 'contrast' ? '#111114' : '#09090b';
  }

  // 3. Border intensity based on tone
  let borderCol = '#27272a';
  let borderColSecondary = '#3f3f46';

  if (t.backgroundTone === 'oled') {
    if (t.borderIntensity === 'subtle') {
      borderCol = '#141417';
      borderColSecondary = '#1c1c20';
    } else if (t.borderIntensity === 'high') {
      borderCol = '#3f3f4a';
      borderColSecondary = '#525260';
    } else {
      borderCol = '#222228';
      borderColSecondary = '#2e2e34';
    }
  } else if (t.backgroundTone === 'slate') {
    if (t.borderIntensity === 'subtle') {
      borderCol = '#152238';
      borderColSecondary = '#1e293b';
    } else if (t.borderIntensity === 'high') {
      borderCol = '#334155';
      borderColSecondary = '#475569';
    } else {
      borderCol = '#1e293b';
      borderColSecondary = '#334155';
    }
  } else if (t.backgroundTone === 'charcoal') {
    if (t.borderIntensity === 'subtle') {
      borderCol = '#1c1c22';
      borderColSecondary = '#232328';
    } else if (t.borderIntensity === 'high') {
      borderCol = '#3f3f46';
      borderColSecondary = '#52525b';
    } else {
      borderCol = '#26262a';
      borderColSecondary = '#36363c';
    }
  } else {
    // obsidian
    if (t.borderIntensity === 'subtle') {
      borderCol = '#17171a';
      borderColSecondary = '#222226';
    } else if (t.borderIntensity === 'high') {
      borderCol = '#3f3f46';
      borderColSecondary = '#52525b';
    } else {
      borderCol = '#27272a';
      borderColSecondary = '#3f3f46';
    }
  }

  // Apply application semantic variables
  root.style.setProperty('--app-bg-base', bgBase);
  root.style.setProperty('--app-bg-surface', bgSurface);
  root.style.setProperty('--app-bg-sidebar', bgSidebar);
  root.style.setProperty('--app-border-color', borderCol);
  root.style.setProperty('--app-border-color-secondary', borderColSecondary);

  // CRITICAL: Dynamically override Tailwind v4 zinc theme color variables
  // This causes all existing bg-zinc-950, bg-zinc-900, border-zinc-800, border-zinc-700
  // classes in every component across the entire app to react instantly!
  root.style.setProperty('--color-zinc-950', bgBase);
  root.style.setProperty('--color-zinc-900', bgSurface);
  root.style.setProperty('--color-zinc-800', borderCol);
  root.style.setProperty('--color-zinc-700', borderColSecondary);

  // 4. Font sizes & metrics
  root.style.setProperty('--app-font-ui-size', t.uiFontSize || '14px');
  root.style.setProperty('--app-font-editor-size', t.editorFontSize || '15px');
  root.style.setProperty('--app-font-preview-size', t.previewFontSize || '16px');
  root.style.setProperty('--app-editor-line-height', t.editorLineHeight || '1.7');

  let fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
  if (t.editorFontFamily === 'sans') {
    fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  } else if (t.editorFontFamily === 'serif') {
    fontFamily = 'Georgia, Cambria, "Times New Roman", Times, serif';
  }
  root.style.setProperty('--app-font-family-editor', fontFamily);

  // 5. Custom Editor & Markdown Syntax Colors
  const ec = { ...DEFAULT_EDITOR_COLORS, ...(t.editorColors || {}) };
  root.style.setProperty('--app-editor-bg', ec.background);
  root.style.setProperty('--app-editor-text', ec.text);
  root.style.setProperty('--app-editor-link', ec.link);
  root.style.setProperty('--app-editor-heading', ec.heading);
  root.style.setProperty('--app-editor-bold', ec.bold);
  root.style.setProperty('--app-editor-italic', ec.italic);
  root.style.setProperty('--app-editor-code', ec.code);
  root.style.setProperty('--app-editor-keyword', ec.keyword);
  root.style.setProperty('--app-editor-string', ec.string);
  root.style.setProperty('--app-editor-number', ec.number);
  root.style.setProperty('--app-editor-comment', ec.comment);
  root.style.setProperty('--app-editor-cursor', ec.cursor);
  root.style.setProperty('--app-editor-gutter-bg', ec.gutterBg);
  root.style.setProperty('--app-editor-gutter-text', ec.gutterText);
  root.style.setProperty('--app-editor-gutter-border', ec.gutterBorder);
  root.style.setProperty('--app-editor-active-line-bg', ec.activeLineBg || 'rgba(39, 39, 42, 0.4)');
  root.style.setProperty('--app-editor-selection-bg', ec.selectionBg || 'rgba(37, 99, 235, 0.28)');

  // 6. Custom Markdown Preview Colors
  const pc = { ...DEFAULT_PREVIEW_COLORS, ...(t.previewColors || {}) };
  root.style.setProperty('--app-preview-bg', pc.background);
  root.style.setProperty('--app-preview-text', pc.text);
  root.style.setProperty('--app-preview-link', pc.link);
  root.style.setProperty('--app-preview-heading', pc.heading);
  root.style.setProperty('--app-preview-bold', pc.bold);
  root.style.setProperty('--app-preview-italic', pc.italic);
  root.style.setProperty('--app-preview-code', pc.code);
  root.style.setProperty('--app-preview-code-bg', pc.codeBg);
  root.style.setProperty('--app-preview-blockquote-border', pc.blockquoteBorder);
  root.style.setProperty('--app-preview-blockquote-text', pc.blockquoteText);
  root.style.setProperty('--app-preview-table-header-bg', pc.tableHeaderBg);
  root.style.setProperty('--app-preview-table-border', pc.tableBorder);
  root.style.setProperty('--app-preview-hr-border', pc.hrBorder);

  // 7. Custom Markdown Preview Dimensions & Margins
  root.style.setProperty('--app-preview-max-width', t.previewMaxWidth || '896px');
  root.style.setProperty('--app-preview-padding-x', t.previewPaddingX || '48px');
}

/**
 * Load settings synchronously from localStorage.
 */
export function loadSettingsSync() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    const settings = {
      ...DEFAULT_SETTINGS,
      ...parsed,
      theme: {
        ...DEFAULT_THEME_SETTINGS,
        ...(parsed.theme || {}),
        editorColors: {
          ...DEFAULT_EDITOR_COLORS,
          ...((parsed.theme && parsed.theme.editorColors) || {}),
        },
        previewColors: {
          ...DEFAULT_PREVIEW_COLORS,
          ...((parsed.theme && parsed.theme.previewColors) || {}),
        },
      },
      thumbnail: {
        ...DEFAULT_SETTINGS.thumbnail,
        ...(parsed.thumbnail || {}),
      },
    };
    applyThemeToDocument(settings.theme);
    return settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Load settings (synchronous local cache with defaults).
 */
export async function loadSettingsFromPc() {
  return loadSettingsSync();
}

/**
 * Save settings to browser localStorage.
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('[settings] Failed to save settings to localStorage:', e);
  }
}
