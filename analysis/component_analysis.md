# Component Architecture & Technical Audit

A comprehensive inspection and technical evaluation of each component in the `src/` directory.

---

## 1. Component Hierarchy & Directory Map

```
src/
├── App.jsx                         # Root orchestrator: layouts, topbar, search, modals, state binding
├── components/
│   ├── common/
│   │   ├── ContextMenu.jsx         # Absolute floating menu with outside-click & ESC dismiss
│   │   └── Modal.jsx               # Accessible dialog container with backdrop blur & key handling
│   ├── Editor/
│   │   ├── CodeBlock.jsx           # Syntax-highlighted code with language badge & copy button
│   │   ├── EditorPanel.jsx         # Note header, Edit/Preview toggle, YouTube metadata manager
│   │   ├── MarkdownEditor.jsx      # Textarea editor with token insertion toolbar & ref focus
│   │   └── MarkdownRenderer.jsx    # ReactMarkdown pipeline + GFM + syntax highlight + auto-embeds
│   ├── Search/
│   │   ├── SearchBar.jsx           # Topbar search field with Ctrl+K shortcut and clear button
│   │   └── SearchResults.jsx       # Popover dropdown displaying weighted search matches & thumbnails
│   ├── Settings/
│   │   ├── SettingsPage.jsx        # Full-width settings dashboard with live preview, presets, and preferences
│   │   └── SettingsModal.jsx       # Full-viewport overlay wrapper for backward compatibility
│   ├── Sidebar/
│   │   ├── CollectionItem.jsx      # Recursive folder node with infinite depth, hover & context actions
│   │   ├── CollectionTree.jsx      # Folder directory tree with scroll container and footer buttons
│   │   ├── FileItem.jsx            # Individual note row with rename, move-to modal, delete actions
│   │   └── Sidebar.jsx             # Responsive drawer container with mobile backdrop
│   ├── Storage/
│   │   └── StorageModal.jsx        # PC disk status, folder explorer trigger, File System API sync
│   └── YouTube/
│       └── YoutubeThumbnail.jsx    # Dynamic thumbnail / in-app embedded video player with fallbacks
```

---

## 2. Detailed Component Audits

### 2.1. `App.jsx`
- **Role**: Main application container. Subscribes to `useAppState` and `useSearch`, wires selected file state, and renders global modals.
- **Key Responsibilities**:
  - Top header with mobile drawer toggle, logo, PC storage status pill, settings button, and global search bar.
  - Subtree-aware deselection logic when deleting collections.
  - Controls modal visibility: `StorageModal`, `SettingsModal`.
- **Observations**:
  - Clean layout hierarchy utilizing Tailwind CSS flexbox and full-viewport constraints (`h-screen overflow-hidden`).
  - Search blur uses a 150ms timeout to allow clicking search results before the popover closes. A ref-based outside click handler is safer and avoids potential race conditions.

---

### 2.2. `components/Editor/EditorPanel.jsx`
- **Role**: Primary editing workspace. Displays active note title, edit/preview switcher, YouTube metadata editor, and rename/delete dialogs.
- **Key Capabilities**:
  - Toggle between Markdown editing (`MarkdownEditor`) and live HTML preview (`MarkdownRenderer`).
  - Slide-down YouTube manager for attaching URLs and video titles.
  - Direct launch of `SettingsModal` for custom video card styling.
- **Observations**:
  - Clean separation between reading mode and writing mode.
  - Could benefit from a 3-way split mode (`Edit | Split | Preview`) for side-by-side editing on widescreen monitors.

---

### 2.3. `components/Editor/MarkdownEditor.jsx`
- **Role**: Markdown authoring textarea equipped with a formatting shortcut toolbar.
- **Key Capabilities**:
  - Toolbar items for Bold (`**`), Italic (`_`), Headings (`#`, `##`, `###`), Inline Code, Fenced Code Blocks, Blockquotes, Unordered/Ordered Lists, and Checklists (`- [ ]`).
  - Selection preservation: retains cursor position and text selection when wrapping tokens.
  - Uses `useRef` for native textarea DOM control.
- **Observations**:
  - Clean keyboard UX; could be further enhanced by supporting keyboard shortcuts like `Ctrl+B` (bold) or `Tab` indentation handling.

---

### 2.4. `components/Editor/MarkdownRenderer.jsx`
- **Role**: AST transformation of Markdown text into styled HTML elements.
- **Plugins**: `remark-gfm` (tables, strikethrough, checklists) and `rehype-highlight` (code syntax highlighting).
- **Custom Components**:
  - Intercepts markdown links (`<a>` tags): if pointing to YouTube, renders a rich `YoutubeThumbnail` preview card.
  - Replaces `<pre><code>` blocks with `CodeBlock.jsx`.
  - Wraps `<table>` elements in horizontal scroll containers for mobile responsiveness.
- **Observations**:
  - Styling leverages `@tailwindcss/typography` with fine-tuned dark theme overrides in `src/index.css`.

---

### 2.5. `components/Editor/CodeBlock.jsx`
- **Role**: Container for fenced code snippets with one-click clipboard copy.
- **Key Capabilities**:
  - Extracts language class (e.g. `language-typescript` -> `typescript`) and renders language badge.
  - Copies raw code to system clipboard via `navigator.clipboard.writeText`.
  - Displays transient "Copied!" feedback with automatic 2-second timeout reset.
- **Observations**:
  - Works reliably in secure contexts (`localhost` and HTTPS). Includes fallback catch for clipboard permission blocks.

---

### 2.6. `components/Sidebar/CollectionTree.jsx` & `CollectionItem.jsx`
- **Role**: Recursive file explorer.
- **Key Capabilities**:
  - Arbitrary folder depth: `CollectionItem` recursively renders itself for nested children.
  - Per-folder context menus (New Folder, New Note, Rename, Delete).
  - Footer buttons: "New Folder", "Open in File Explorer" (executes OS explorer for `./notes/`), and "Settings".
- **Observations**:
  - Infinite recursion handles arbitrary nested hierarchies gracefully.
  - Uses memoized folder paths and indentation padding based on `depth * 12px`.

---

### 2.7. `components/Sidebar/FileItem.jsx`
- **Role**: Represents individual `.md` file items in the sidebar.
- **Key Capabilities**:
  - Highlights selected active note.
  - Context menu and hover action menu for Opening, Renaming, Moving to another collection, and Deletion.
  - Flat folder selector for the "Move to..." action.

---

### 2.8. `components/Search/SearchBar.jsx` & `SearchResults.jsx`
- **Role**: Instant global search system.
- **Key Capabilities**:
  - Global `Ctrl+K` (or `Cmd+K`) keyboard shortcut listener.
  - Multi-field weighted scoring (File Name > YouTube Title > URL / Video ID > Content).
  - Displays video thumbnails and collection breadcrumb paths in results.
  - Closes on Escape or click outside.

---

### 2.9. `components/YouTube/YoutubeThumbnail.jsx`
- **Role**: Interactive YouTube multimedia component.
- **Key Capabilities**:
  - Dual playback modes: Click to launch inline embedded `<iframe>` with autoplay, or open YouTube watch page in new tab.
  - Fallback image resolution cascade: `maxresdefault` -> `hqdefault` -> `mqdefault` -> placeholder card.
  - Configurable aspect ratios (`16:9`, `4:3`, `21:9`), border radii, drop shadows, and hover zoom effects.
  - Close button to return from video playback to thumbnail mode.

---

### 2.10. `components/Settings/SettingsPage.jsx` & `SettingsModal.jsx`
- **Role**: Full-width application settings and configuration dashboard.
- **Key Capabilities**:
  - Full-width two-column layout with category navigation, quick presets bar, and sticky live interactive preview.
  - Interactive Live Preview panel updating in real-time with resolution badges, aspect ratio tags, and in-place player testing.
  - Quick Presets: "Standard", "Cinema Wide" (full width, 16:9, maxres, shadow-2xl), "Minimal Clean" (compact, no badges/titles, no zoom), and "Always Player" (always embed).
  - Categorized tabs: Layout & Dimensions, Playback & Player, Overlays & Badges, and PC Storage & System.
  - Desktop sidebar toggle (`⊞ Full Width` / `⊟ Show Sidebar`) to expand settings across 100% of the display.
  - Changes broadcast globally and persist to both `localStorage` and `./data/settings.json`.
  - `SettingsModal.jsx` acts as a backward-compatible full-screen wrapper.

---

### 2.11. `components/Storage/StorageModal.jsx`
- **Role**: Inspection and management dialog for the PC disk storage engine.
- **Key Capabilities**:
  - Displays PC directory path (`./notes`), note count, collection count, and live sync status.
  - "Open in File Explorer" button that launches the OS file manager directly to the notes directory.
  - Web File System Access API integration (`showDirectoryPicker`) for syncing to any external drive or folder.
  - Download backup as `youtube-summary-backup-[date].json`.
