# YouTube Summary — Project Analysis & Architecture Summary

## 1. Project Scorecard & Metrics

| Dimension | Rating | Key Notes |
| :--- | :---: | :--- |
| **Code Cleanliness & Lints** | 🟢 **A+** | 0 Oxlint errors / warnings across 27 source files. Modern React 19 hooks and clean separation of concerns. |
| **Persistence & Reliability** | 🟢 **A** | Dual-layer persistence: instant UI response via `localStorage`, permanent disk storage in `./notes/` (real `.md` files + YAML frontmatter) & `./data/storage.json`. |
| **Multimedia Integration** | 🟢 **A** | High-quality YouTube thumbnail cards with fallback cascade, embedded in-app playback with autoplay control, and comprehensive settings customization. |
| **Bundle Efficiency** | 🟡 **B** | Production build completes cleanly, but generates a monolithic 611 kB chunk due to non-split markdown and syntax highlighting libraries. |
| **Disk I/O Scaling** | 🟡 **B** | Whole-tree disk sync on debounced save is excellent for < 100 notes, but will benefit from granular single-file write endpoints as the notebook scales. |

---

## 2. Directory Structure

```
d:/Data/GitHub/youtube summary/
├── analysis/                     # Technical architecture, audits, and roadmap documentation
│   ├── architecture_overview.md  # Deep dive into system design, persistence, and schemas
│   ├── code_quality_and_issues.md# Linter results, bundle audit, security & performance findings
│   ├── component_analysis.md     # Component hierarchy, props, and design review
│   ├── project_summary.md        # Executive summary and scorecard
│   └── recommendations_roadmap.md# Completed milestones and future roadmap
├── data/                         # App database backups (storage.json, settings.json)
├── notes/                        # Actual user Markdown notes written directly to PC disk
├── src/                          # Application source code
│   ├── components/               # React UI components (Editor, Search, Settings, Sidebar, Storage, YouTube)
│   ├── data/                     # Client-side storage and settings connectors
│   ├── hooks/                    # useAppState, useSearch, useSettings
│   └── utils/                    # YouTube URL parsing, search ranking, File System Access API
├── vite-plugin-pc-storage.js     # Node.js backend middleware for disk synchronization
└── vite.config.js                # Vite, Tailwind CSS v4, and PC storage plugin configuration
```

---

## 3. Core Capabilities

1. **Local PC File System Synchronization**:
   - Real `.md` files are created on the PC in the `./notes/` folder structure, matching the user's collections.
   - Includes standard YAML frontmatter for note metadata (`id`, `name`, `youtubeUrl`, `youtubeVideoId`, `youtubeTitle`, `createdAt`, `updatedAt`).
2. **Instant Search (`Ctrl+K`)**:
   - Multi-field weighted scoring across titles, URLs, video IDs, and markdown text with breadcrumb navigation.
3. **In-App Video Playback & Customization**:
   - Flexible switch between external YouTube watch tabs and embedded in-app video players.
   - Live settings preview with customizable aspect ratios, resolutions, and quick presets (Cinema, Minimal, Player, Standard).
4. **Offline Resilience & Data Portability**:
   - Instant startup from localStorage cache if offline.
   - Web File System Access API folder sync and one-click JSON backup downloads.
