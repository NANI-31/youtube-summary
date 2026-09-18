import { useState, useRef } from 'react';
import {
  FiFileText,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiSidebar,
  FiArrowLeft,
  FiEdit3,
  FiEye,
} from 'react-icons/fi';
import { FaYoutube } from 'react-icons/fa6';
import MarkdownEditor from './MarkdownEditor.jsx';
import MarkdownRenderer from './MarkdownRenderer.jsx';
import YoutubeThumbnail from '../YouTube/YoutubeThumbnail.jsx';
import { isYouTubeUrl, extractYouTubeVideoId } from '../../utils/youtube.js';
import { useSettings } from '../../hooks/useSettings.js';
import {
  useAppDispatch,
  useAppSelector,
  selectDesktopSidebarOpen,
} from '../../store/hooks.js';
import {
  toggleDesktopSidebar,
  setMobileSidebarOpen,
} from '../../store/slices/uiSlice.js';

/**
 * Right-side panel showing the selected file with floating controls.
 * Switches between Edit and Preview modes.
 * Displays the markdown document full height from the top of the browser.
 */
export default function EditorPanel({ file, onUpdate, onBack }) {
  const dispatch = useAppDispatch();
  const { thumbnailSettings } = useSettings();
  const [mode, setMode] = useState('preview'); // 'edit' | 'preview'

  const [showYoutubeSection, setShowYoutubeSection] = useState(false);
  const [ytUrlDraft, setYtUrlDraft] = useState('');
  const [ytTitleDraft, setYtTitleDraft] = useState('');
  const ytUrlRef = useRef(null);

  function handleContentChange(content) {
    if (file) onUpdate(file.id, { content });
  }

  function openYoutubeSection() {
    if (file) {
      setYtUrlDraft(file.youtubeUrl || '');
      setYtTitleDraft(file.youtubeTitle || '');
      setShowYoutubeSection(true);
    }
  }

  function saveYoutube() {
    if (file) {
      const videoId = extractYouTubeVideoId(ytUrlDraft) || '';
      onUpdate(file.id, {
        youtubeUrl: ytUrlDraft.trim(),
        youtubeVideoId: videoId,
        youtubeTitle: ytTitleDraft.trim(),
      });
      setShowYoutubeSection(false);
    }
  }

  const hasYoutube = Boolean(file?.youtubeVideoId);

  const desktopSidebarOpen = useAppSelector(selectDesktopSidebarOpen);

  function handleToggleSidebar() {
    if (window.innerWidth < 768) {
      dispatch(setMobileSidebarOpen(true));
    } else {
      dispatch(toggleDesktopSidebar());
    }
  }

  return (
    <div
      className="relative flex flex-col h-full overflow-hidden bg-zinc-950"
      style={{ backgroundColor: 'var(--app-bg-base, #09090b)' }}
    >
      {!file ? (
        <div className="relative flex flex-col items-center justify-center flex-1 text-zinc-500 gap-4 p-8">
          {/* Toggle Sidebar button when collapsed */}
          <button
            onClick={handleToggleSidebar}
            title="Toggle Sidebar"
            className={`absolute top-3 left-3 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer z-10 ${
              desktopSidebarOpen ? 'md:hidden' : 'flex'
            }`}
          >
            <FiSidebar className="w-4 h-4" />
          </button>
          <FiFileText className="w-16 h-16 opacity-30" />
          <p className="text-center text-sm">Select a note from the sidebar or create a new one.</p>
        </div>
      ) : (
        <>
          {/* Top Floating Controls: 100% Identical in both Edit and Preview modes */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 sm:px-6 select-none">
            {/* Left: Sidebar toggle and Back button */}
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                onClick={handleToggleSidebar}
                title="Toggle Sidebar"
                className={`p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 shadow-md backdrop-blur-md transition-colors cursor-pointer ${
                  desktopSidebarOpen ? 'md:hidden' : 'flex'
                }`}
              >
                <FiSidebar className="w-4 h-4" />
              </button>

              {onBack && (
                <button
                  onClick={onBack}
                  title="Back to notes"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80 shadow-md backdrop-blur-md transition-all cursor-pointer text-xs font-medium group"
                >
                  <FiArrowLeft className="w-3.5 h-3.5 text-blue-400 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Back</span>
                </button>
              )}
            </div>

            {/* Right: YouTube button and Mode Toggle */}
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                onClick={openYoutubeSection}
                title="Manage YouTube video"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium shadow-md backdrop-blur-md transition-colors cursor-pointer shrink-0 border ${
                  hasYoutube
                    ? 'bg-red-950/70 border-red-800/80 text-red-300 hover:bg-red-900/80'
                    : 'bg-zinc-900/80 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <FaYoutube className="w-3.5 h-3.5 text-red-500" />
                <span className="hidden sm:inline">{hasYoutube ? 'YouTube' : 'Add YouTube'}</span>
              </button>

              {/* Mode toggle with icons */}
              <div className="flex bg-zinc-900/85 backdrop-blur-md rounded-lg p-0.5 gap-0.5 border border-zinc-800/80 shadow-md">
                <button
                  onClick={() => setMode('edit')}
                  title="Edit mode"
                  className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center justify-center ${
                    mode === 'edit'
                      ? 'text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                  style={mode === 'edit' ? { backgroundColor: 'var(--app-accent-color, #2563eb)' } : {}}
                >
                  <FiEdit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setMode('preview')}
                  title="Preview mode"
                  className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center justify-center ${
                    mode === 'preview'
                      ? 'text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                  style={mode === 'preview' ? { backgroundColor: 'var(--app-accent-color, #2563eb)' } : {}}
                >
                  <FiEye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* YouTube floating popover (when open) */}
          {showYoutubeSection && (
            <div className="absolute top-16 right-4 sm:right-6 z-30 w-80 sm:w-96 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-xl p-3.5 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wide flex items-center gap-1.5">
                  <FaYoutube className="text-red-500 text-sm" /> YouTube Video
                </span>
                <button
                  onClick={() => setShowYoutubeSection(false)}
                  className="text-zinc-400 hover:text-zinc-200 p-1 rounded transition-colors cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={ytUrlRef}
                  type="url"
                  value={ytUrlDraft}
                  onChange={(e) => setYtUrlDraft(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=…"
                  className="w-full bg-zinc-800 text-zinc-100 text-xs px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500 placeholder-zinc-500"
                />
                <input
                  type="text"
                  value={ytTitleDraft}
                  onChange={(e) => setYtTitleDraft(e.target.value)}
                  placeholder="Video title (manual)"
                  className="w-full bg-zinc-800 text-zinc-100 text-xs px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500 placeholder-zinc-500"
                />
                {ytUrlDraft && !isYouTubeUrl(ytUrlDraft) && (
                  <p className="flex items-center gap-1.5 text-red-400 text-xs">
                    <FiAlertCircle className="w-3.5 h-3.5 shrink-0" /> Not a recognised YouTube URL
                  </p>
                )}
                {ytUrlDraft && isYouTubeUrl(ytUrlDraft) && (
                  <p className="flex items-center gap-1.5 text-emerald-400 text-xs">
                    <FiCheck className="w-3.5 h-3.5 shrink-0" /> Valid YouTube URL
                  </p>
                )}
                <div className="flex gap-2 mt-1 justify-end">
                  {file.youtubeUrl && (
                    <button
                      onClick={() => {
                        onUpdate(file.id, { youtubeUrl: '', youtubeVideoId: '', youtubeTitle: '' });
                        setShowYoutubeSection(false);
                      }}
                      className="px-3 py-1 text-red-400 hover:text-red-300 text-xs font-medium transition-colors cursor-pointer mr-auto"
                    >
                      Remove
                    </button>
                  )}
                  <button
                    onClick={() => setShowYoutubeSection(false)}
                    className="px-3 py-1 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveYoutube}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main content area */}
          <div
            className={`flex-1 min-h-0 flex flex-col ${mode === 'edit' ? 'overflow-hidden' : 'overflow-auto'}`}
            style={{
              backgroundColor: mode === 'preview'
                ? 'var(--app-preview-bg, var(--app-bg-base, #09090b))'
                : 'var(--app-bg-base, #09090b)',
            }}
          >
            {mode === 'edit' ? (
              <div className="flex-1 min-h-0 pt-16 sm:pt-14 flex flex-col">
                <MarkdownEditor value={file.content} onChange={handleContentChange} />
              </div>
            ) : (
                <div
                  className="w-full mx-auto pt-20 sm:pt-24 pb-20 transition-[max-width,padding] duration-150 ease-out"
                  style={{
                    maxWidth: 'var(--app-preview-max-width, 896px)',
                    paddingLeft: 'var(--app-preview-padding-x, 48px)',
                    paddingRight: 'var(--app-preview-padding-x, 48px)',
                  }}
                >
                  {/* YouTube thumbnail at top of preview */}
                  {hasYoutube && thumbnailSettings.showInPreview && (
                    <div className="mb-6">
                      {file.youtubeTitle && (
                        <h2 className="text-base font-semibold text-zinc-200 mb-2">{file.youtubeTitle}</h2>
                      )}
                      <YoutubeThumbnail
                        videoId={file.youtubeVideoId}
                        title={file.youtubeTitle}
                      />
                    </div>
                  )}
                  <MarkdownRenderer content={file.content} />
                </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
