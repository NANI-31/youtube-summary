import { useEffect, useRef } from 'react';
import { FiFileText, FiX } from 'react-icons/fi';
import { FaYoutube } from 'react-icons/fa6';
import { getYouTubeThumbnailUrl } from '../../utils/youtube.js';

/**
 * Search results overlay panel.
 * Closes on Escape or click outside.
 */
export default function SearchResults({ results, query, onSelect, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('mousedown', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  if (!query.trim()) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-full mt-2 right-0 w-120 max-w-[95vw] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
        <span className="text-xs text-zinc-400">
          {results.length === 0
            ? 'No results'
            : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
        </span>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 p-1 rounded transition-colors cursor-pointer">
          <FiX className="w-4 h-4" />
        </button>
      </div>

      {/* Results */}
      <div className="overflow-y-auto max-h-[60vh]">
        {results.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2 text-zinc-600">
            <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">No notes found for "{query}"</p>
          </div>
        ) : (
          results.map(({ file, breadcrumb }) => {
            const thumbUrl = file.youtubeVideoId
              ? getYouTubeThumbnailUrl(file.youtubeVideoId, 'mqdefault')
              : null;

            return (
              <button
                key={file.id}
                onClick={() => { onSelect(file.id); onClose?.(); }}
                className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/60 border-b border-zinc-800/50 last:border-0 transition-colors cursor-pointer"
              >
                {/* Thumbnail or icon */}
                <div className="shrink-0 w-20 h-12 rounded-lg overflow-hidden bg-zinc-800 flex items-center justify-center">
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <FiFileText className="text-xl text-zinc-500" />
                  )}
                </div>

                {/* Text info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">{file.name}</p>
                  {breadcrumb && (
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{breadcrumb}</p>
                  )}
                  {file.youtubeTitle && (
                    <p className="flex items-center gap-1.5 text-xs text-red-400 truncate mt-0.5">
                      <FaYoutube className="text-red-500 text-xs shrink-0" />
                      <span className="truncate">{file.youtubeTitle}</span>
                    </p>
                  )}
                  {!file.youtubeTitle && file.youtubeUrl && (
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{file.youtubeUrl}</p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
