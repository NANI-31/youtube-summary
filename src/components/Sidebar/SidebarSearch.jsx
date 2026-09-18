import { useState, useRef, useEffect, useMemo } from 'react';
import {
  FiSearch,
  FiX,
  FiFileText,
  FiFolder,
  FiTag,
  FiClock,
} from 'react-icons/fi';
import { FaYoutube } from 'react-icons/fa6';
import {
  searchFiles,
  searchCollections,
  tokenize,
  splitTextByMatches,
  extractAllTags,
  findCollectionInTree,
} from '../../utils/search.js';

/**
 * Component to safely highlight matched tokens without dangerouslySetInnerHTML
 */
function HighlightedText({ text, queryTokens }) {
  if (!text) return null;
  const parts = splitTextByMatches(text, queryTokens);
  return (
    <>
      {parts.map((part, idx) =>
        part.isMatch ? (
          <mark
            key={idx}
            className="bg-blue-500/25 text-blue-200 font-semibold px-0.5 rounded"
          >
            {part.text}
          </mark>
        ) : (
          <span key={idx}>{part.text}</span>
        )
      )}
    </>
  );
}

/**
 * Small indicator badge showing where the search matched
 */
function MatchBadge({ matchType, matchedHeading }) {
  if (!matchType) return null;
  if (matchType === 'video_title') {
    return (
      <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-900/50">
        Video Title
      </span>
    );
  }
  if (matchType === 'heading') {
    return (
      <span
        title={matchedHeading ? `Section: ${matchedHeading}` : 'Heading'}
        className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-900/50 truncate max-w-22.5"
      >
        Heading
      </span>
    );
  }
  if (matchType === 'tag') {
    return (
      <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-900/50">
        Tag
      </span>
    );
  }
  if (matchType === 'content') {
    return (
      <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
        Content
      </span>
    );
  }
  return null;
}

/**
 * Enhanced Sidebar Search View:
 * Features multi-word tokenization, fuzzy matching, snippet highlighting,
 * folder matching, and quick-filter chips (Video, Scope, Tags, Sort).
 */
export default function SidebarSearch({
  query,
  onQueryChange,
  files,
  collections,
  selectedFileId,
  selectedCollectionId = null,
  onSelectFile,
  onSelectCollection,
}) {
  const inputRef = useRef(null);

  // Quick-Filter Facets State
  const [hasVideoOnly, setHasVideoOnly] = useState(false);
  const [scopeCurrentFolder, setScopeCurrentFolder] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [sortBy, setSortBy] = useState('relevance'); // 'relevance' | 'recent'

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Current collection object for scoped filtering
  const activeCollection = useMemo(() => {
    return selectedCollectionId
      ? findCollectionInTree(selectedCollectionId, collections)
      : null;
  }, [selectedCollectionId, collections]);

  // Extract all existing hashtags from user's notes
  const allTags = useMemo(() => {
    return extractAllTags(files);
  }, [files]);

  // Tokenize the current search query
  const queryTokens = useMemo(() => {
    return tokenize(query);
  }, [query]);

  // Search matching collections/folders
  const folderResults = useMemo(() => {
    if (!query.trim() || scopeCurrentFolder) return [];
    return searchCollections(query, collections);
  }, [query, collections, scopeCurrentFolder]);

  // Search matching notes with active facets
  const noteResults = useMemo(() => {
    return searchFiles(query, files, collections, {
      hasVideoOnly,
      collectionId: scopeCurrentFolder ? selectedCollectionId : null,
      tag: selectedTag,
      sortBy,
    });
  }, [query, files, collections, hasVideoOnly, scopeCurrentFolder, selectedCollectionId, selectedTag, sortBy]);

  const hasActiveFilters = hasVideoOnly || scopeCurrentFolder || Boolean(selectedTag) || sortBy !== 'relevance';

  function resetAllFilters() {
    setHasVideoOnly(false);
    setScopeCurrentFolder(false);
    setSelectedTag(null);
    setSortBy('relevance');
    onQueryChange('');
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-900/40">
      {/* Search Input Bar */}
      <div className="p-2 border-b border-zinc-800 bg-zinc-900/80">
        <div className="relative flex items-center">
          <FiSearch className="absolute left-2.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search notes, videos, tags... (Ctrl+K)"
            className="w-full bg-zinc-800 text-zinc-100 text-xs pl-8 pr-7 py-1.5 rounded-lg border border-zinc-700/80 focus:outline-none focus:border-blue-500 placeholder-zinc-500 transition-colors"
          />
          {query && (
            <button
              onClick={() => onQueryChange('')}
              title="Clear search"
              className="absolute right-2 p-0.5 text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <FiX className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Filter Chips Bar (Video, Scope, Sort, Tags) */}
      <div className="px-2.5 py-2 border-b border-zinc-800/70 bg-zinc-900/30 flex flex-col gap-1.5 select-none shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Has Video toggle */}
          <button
            onClick={() => setHasVideoOnly((prev) => !prev)}
            title="Filter notes that have an associated YouTube video"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
              hasVideoOnly
                ? 'bg-red-950/70 text-red-200 border-red-800 shadow-xs'
                : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <FaYoutube className={hasVideoOnly ? 'text-red-400' : 'text-zinc-500'} />
            <span>Video</span>
          </button>

          {/* Scope to active folder */}
          {activeCollection && (
            <button
              onClick={() => setScopeCurrentFolder((prev) => !prev)}
              title={`Filter within "${activeCollection.name}" only`}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer max-w-30 truncate ${
                scopeCurrentFolder
                  ? 'bg-blue-950/70 text-blue-200 border-blue-800 shadow-xs'
                  : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <FiFolder className={scopeCurrentFolder ? 'text-blue-400' : 'text-zinc-500'} />
              <span className="truncate">{activeCollection.name}</span>
            </button>
          )}

          {/* Sort order toggle */}
          <button
            onClick={() => setSortBy((prev) => (prev === 'relevance' ? 'recent' : 'relevance'))}
            title={sortBy === 'relevance' ? 'Sorted by Relevance score. Click for Recent' : 'Sorted by Recently Updated. Click for Relevance'}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-zinc-800/60 text-zinc-400 border border-zinc-700/60 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer ml-auto"
          >
            <FiClock className="w-3 h-3 text-zinc-400" />
            <span>{sortBy === 'relevance' ? 'Relevance' : 'Recent'}</span>
          </button>
        </div>

        {/* Tags Row */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pt-0.5">
            <FiTag className="w-3 h-3 text-zinc-500 shrink-0 mr-0.5" />
            {allTags.slice(0, 6).map(({ tag, count }) => {
              const isActive = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag((prev) => (prev === tag ? null : tag))}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 transition-colors cursor-pointer border ${
                    isActive
                      ? 'bg-emerald-950/80 text-emerald-200 border-emerald-700 font-semibold'
                      : 'bg-zinc-800/40 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  #{tag} <span className="opacity-60 text-[9px]">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Results Header / Summary */}
      <div className="px-3 py-1.5 flex items-center justify-between text-[11px] text-zinc-500 border-b border-zinc-800/60 font-medium select-none shrink-0">
        <span>
          {noteResults.length} {noteResults.length === 1 ? 'note' : 'notes'}
          {folderResults.length > 0 && ` · ${folderResults.length} folder${folderResults.length === 1 ? '' : 's'}`}
        </span>
        {(query.trim() || hasActiveFilters) && (
          <button
            onClick={resetAllFilters}
            className="text-[11px] text-blue-400 hover:underline cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Results List View */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5 scrollbar-thin">
        {/* Matching Folders Section */}
        {folderResults.length > 0 && (
          <div className="space-y-1 mb-2.5">
            <div className="px-2 pt-1 pb-0.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Matching Folders ({folderResults.length})
            </div>
            {folderResults.map(({ collection, breadcrumb, fileCount }) => (
              <div
                key={collection.id}
                onClick={() => onSelectCollection?.(collection.id)}
                className="group flex items-center justify-between gap-2 p-2 rounded-lg cursor-pointer bg-zinc-900/60 hover:bg-blue-950/40 border border-zinc-800/80 hover:border-blue-500/50 transition-all select-none"
              >
                <div className="flex items-center gap-2 truncate min-w-0">
                  <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 shrink-0">
                    <FiFolder className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-semibold text-zinc-200 group-hover:text-blue-300 truncate">
                      <HighlightedText text={collection.name} queryTokens={queryTokens} />
                    </span>
                    {breadcrumb && (
                      <span className="text-[10px] text-zinc-500 truncate">{breadcrumb}</span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
                  {fileCount} {fileCount === 1 ? 'note' : 'notes'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Note Results */}
        {noteResults.length === 0 && folderResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-zinc-500 gap-2">
            <FiSearch className="w-8 h-8 opacity-30" />
            <p className="text-xs text-zinc-400">
              No notes or folders found matching {query.trim() ? `"${query}"` : 'active filters'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="text-xs text-blue-400 hover:underline mt-1 cursor-pointer"
              >
                Clear all active filters
              </button>
            )}
          </div>
        ) : (
          noteResults.map(({ file, breadcrumb, matchType, matchedHeading, snippet }) => {
            const isSelected = selectedFileId === file.id;
            const displayTitle = file.name.replace(/\.md$/, '');

            return (
              <div
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`group flex flex-col gap-1.5 p-2.5 rounded-lg cursor-pointer transition-all select-none ${
                  isSelected
                    ? 'bg-blue-600/20 border border-blue-500/50 text-blue-200 shadow-xs'
                    : 'bg-zinc-900/40 hover:bg-zinc-800/70 border border-zinc-800/70 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100'
                }`}
              >
                {/* Header: Note Title + Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <FiFileText className="text-xs text-blue-400 shrink-0" />
                    <span className="text-xs font-semibold truncate text-zinc-100 group-hover:text-blue-300">
                      <HighlightedText text={displayTitle} queryTokens={queryTokens} />
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {query.trim() && (
                      <MatchBadge matchType={matchType} matchedHeading={matchedHeading} />
                    )}
                    {file.youtubeVideoId && (
                      <span title="Contains YouTube video">
                        <FaYoutube className="text-red-500 text-xs shrink-0" />
                      </span>
                    )}
                  </div>
                </div>

                {/* YouTube Video Title if present */}
                {file.youtubeTitle && (
                  <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1">
                    <span className="text-[10px] text-red-400 font-mono">YT:</span>
                    <span className="truncate">
                      <HighlightedText text={file.youtubeTitle} queryTokens={queryTokens} />
                    </span>
                  </div>
                )}

                {/* Contextual Excerpt / Snippet with Highlighted Keywords */}
                {snippet && (
                  <p className="text-[11px] text-zinc-400/90 line-clamp-2 leading-relaxed bg-zinc-950/40 p-1.5 rounded border border-zinc-800/50">
                    <HighlightedText text={snippet} queryTokens={queryTokens} />
                  </p>
                )}

                {/* Breadcrumb folder path */}
                {breadcrumb && (
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 truncate">
                    <FiFolder className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{breadcrumb}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
