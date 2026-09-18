# Code Quality, Security & Performance Audit

A comprehensive code quality, security, and performance review of the **YouTube Summary** application.

---

## 1. Static Linting & Code Hygiene (Oxlint Audit)

Running `npm run lint` (`oxlint`) across the codebase yields:
```
Found 0 warnings and 0 errors.
Finished in 963ms on 27 files with 104 rules using 8 threads.
```
**Status: PASSED**. All previous unused variables, dead state, and React 19 anti-patterns (`set-state-in-effect`) have been resolved.

---

## 2. Production Bundle Size & Chunk Analysis

Running `npm run build` (`vite build`) output:
```
dist/index.html                   0.46 kB │ gzip:   0.30 kB
dist/assets/index-BY2UDzCH.css   60.73 kB │ gzip:  10.38 kB
dist/assets/index-D6S7zswt.js   611.39 kB │ gzip: 184.90 kB

(!) Some chunks are larger than 500 kB after minification.
```

### Analysis & Bottlenecks:
1. **Monolithic Bundle**:
   The entire application (including `highlight.js`, `react-markdown`, `remark-gfm`, `rehype-highlight`, and heavy regex engines) is bundled into a single JavaScript file of **611.39 kB** (minified).
2. **Impact**:
   - Initial page load requires downloading and parsing ~611 kB of JS upfront, even before the user selects a note or renders code.
3. **Recommendation**:
   - Use `React.lazy()` / dynamic `import()` for `SettingsModal`, `StorageModal`, and `MarkdownRenderer`.
   - Configure `manualChunks` in `vite.config.js` to separate `highlight.js` and markdown processors from the primary React runtime chunk:
     ```javascript
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             markdown: ['react-markdown', 'remark-gfm', 'rehype-highlight'],
             highlight: ['highlight.js'],
             react: ['react', 'react-dom'],
           },
         },
       },
     }
     ```

---

## 3. Security & File System Hardening

### 3.1. OS Command Execution in `vite-plugin-pc-storage.js`
In [vite-plugin-pc-storage.js](file:///d:/Data/GitHub/youtube%20summary/vite-plugin-pc-storage.js#L237-L245):
```javascript
if (process.platform === 'win32') {
  exec(`explorer "${notesDir}"`);
} else if (process.platform === 'darwin') {
  exec(`open "${notesDir}"`);
} else {
  exec(`xdg-open "${notesDir}"`);
}
```
**Risk:**
Using `exec()` with string interpolation invokes the OS command shell (`cmd.exe` or `/bin/sh`). If a path ever contained unsanitized user input with quotes or shell metacharacters (`&`, `|`, `;`), it could trigger arbitrary command execution.
**Remediation:**
Use `child_process.execFile` or `child_process.spawn` with an arguments array, which avoids passing commands through a shell interpreter:
```javascript
import { spawn } from 'node:child_process';
if (process.platform === 'win32') {
  spawn('explorer.exe', [notesDir], { detached: true });
}
```

### 3.2. Path Traversal & File Name Sanitization
In [vite-plugin-pc-storage.js](file:///d:/Data/GitHub/youtube%20summary/vite-plugin-pc-storage.js#L9-L12):
```javascript
function sanitizeName(name) {
  if (!name) return 'Untitled';
  return name.replace(/[<>:"/\\|?*]/g, '_').trim();
}
```
**Analysis:**
The regex strips standard illegal Windows filename characters (`<`, `>`, `:`, `"`, `/`, `\`, `|`, `?`, `*`).
**Recommendations:**
- Strip leading or sequential periods (e.g. `..` or `...`) to prevent relative path traversal out of the `./notes/` sandbox.
- Restrict reserved Windows device filenames (e.g., `CON`, `PRN`, `AUX`, `NUL`, `COM1-9`, `LPT1-9`).

---

## 4. Architectural & Performance Findings

### 4.1. Whole-Tree Disk Synchronization (`syncNotesToDisk`)
On every note save, `syncNotesToDisk` recursively traverses all collections and re-writes every single `.md` file to disk, followed by `cleanOldEntries` which reads the entire `./notes/` directory tree.
- **Current State**: Fast and manageable for small notebooks (< 50 notes).
- **Scalability Limit**: When a notebook grows to hundreds of notes or contains large markdown documents, writing every file on every debounced change will cause disk I/O bottlenecks.
- **Fix**: Implement single-file write updates (`POST /api/storage/file`) for edits and renames, reserving whole-tree sync for structural reorganizations (folder deletion, multi-file moves).

### 4.2. Deep Cloning Anti-Pattern (`useAppState.js`)
In [useAppState.js](file:///d:/Data/GitHub/youtube%20summary/src/hooks/useAppState.js#L59):
```javascript
const cloneCollections = useCallback((cols) => JSON.parse(JSON.stringify(cols)), []);
```
`JSON.parse(JSON.stringify())` is used before every collection mutation (add, rename, delete, move).
- **Impact**: Synchronous blocking CPU work that scales linearly with tree size and discards object references, defeating React memoization.
- **Fix**: Use structural sharing via recursive map or an immutable update utility like `immer`.

### 4.3. Search Input Debouncing
In [useSearch.js](file:///d:/Data/GitHub/youtube%20summary/src/hooks/useSearch.js#L7-L9):
Search results are computed synchronously using `useMemo` on every single keystroke.
- **Recommendation**: Introduce a 150ms-200ms debounce on the search term before scoring all files and computing collection breadcrumbs.

### 4.4. Textarea Direct Blur Timing
In [App.jsx](file:///d:/Data/GitHub/youtube%20summary/src/App.jsx#L136):
```javascript
onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
```
Using an arbitrary timer to allow item clicks can race if network or UI threads are busy. An outside-click listener on the parent ref is standard practice.
