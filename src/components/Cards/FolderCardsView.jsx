import { useState, useEffect, useRef } from 'react';
import {
  FiFolderPlus,
  FiFolder,
  FiFilePlus,
  FiFileText,
  FiChevronRight,
  FiArrowLeft,
  FiSidebar,
  FiPlay,
  FiTrash2,
  FiEdit2,
} from 'react-icons/fi';
import Modal from '../common/Modal.jsx';
import { findCollectionInTree, getCollectionPathNodes } from '../../utils/search.js';
import { useAppSelector, selectNotesLoaded } from '../../store/hooks.js';

/**
 * Helper to recursively flatten collections tree for select dropdown with depth prefix
 */
function flattenTreeForSelect(nodes, depth = 0) {
  let list = [];
  for (const n of nodes || []) {
    list.push({ id: n.id, name: `${'— '.repeat(depth)}${n.name}` });
    if (n.children?.length) {
      list = list.concat(flattenTreeForSelect(n.children, depth + 1));
    }
  }
  return list;
}

/**
 * Format relative or short date
 */
function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Extract likely video title from note content if youtubeTitle is not set
 */
function extractVideoTitleFromContent(content) {
  if (!content) return null;
  // Match patterns like: summary of the video **"Title"** or **"Title"** by
  const matchQuoted = content.match(/\*\*["“]([^"”]+)["”]\*\*/);
  if (matchQuoted && matchQuoted[1]?.trim()) {
    return matchQuoted[1].trim();
  }
  const matchSummary = content.match(/(?:summary of(?: the)? video|video:?)\s*[*_"]*([^"\n*]+)[*"_]*/i);
  if (matchSummary && matchSummary[1]?.trim()) {
    return matchSummary[1].trim();
  }
  return null;
}

/**
 * Determine the display title for a note card:
 * Priority: file.youtubeTitle -> fetchedTitle -> extractedFromContent -> file.name without .md
 */
function getVideoDisplayTitle(file, fetchedTitle) {
  if (file.youtubeTitle && file.youtubeTitle.trim()) {
    return file.youtubeTitle.trim();
  }
  if (fetchedTitle && fetchedTitle.trim()) {
    return fetchedTitle.trim();
  }
  if (file.youtubeVideoId) {
    const extracted = extractVideoTitleFromContent(file.content);
    if (extracted) return extracted;
  }
  return file.name.replace(/\.md$/, '');
}

/**
 * FolderCardsView — displays the contents of a folder as modern interactive cards.
 * Shows subfolders and .md note cards with YouTube thumbnails and excerpts.
 */
export default function FolderCardsView({
  collectionId = null,
  collections = [],
  files = {},
  onSelectFile,
  onSelectCollection,
  onCreateFile,
  onCreateCollection,
  onRenameFile,
  onDeleteFile,
  onRenameCollection,
  onDeleteCollection,
  onUpdateFile,
  onMoveFile = null,
  isSidebarCollapsed = false,
  onToggleSidebar = null,
}) {
  const isLoaded = useAppSelector(selectNotesLoaded);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(null); // { type: 'file' | 'folder', id, name }
  const [showDeleteModal, setShowDeleteModal] = useState(null); // { type: 'file' | 'folder', id, name }
  const [showMoveModal, setShowMoveModal] = useState(null); // { id, name, currentCollectionId }
  const [moveTargetId, setMoveTargetId] = useState('');
  const [inputText, setInputText] = useState('');
  const [fetchedTitles, setFetchedTitles] = useState({});
  const fetchedIdsRef = useRef(new Set());

  // Resolve current collection node and breadcrumb path
  const currentCollection = collectionId
    ? findCollectionInTree(collectionId, collections)
    : null;

  const breadcrumbs = collectionId
    ? getCollectionPathNodes(collectionId, collections)
    : [];

  // Notes in this collection
  const noteList = currentCollection
    ? (currentCollection.fileIds || []).map((id) => files[id]).filter(Boolean)
    : Object.values(files).filter((f) => !f.collectionId);

  // Auto-fetch YouTube title if note has videoId but no title
  useEffect(() => {
    noteList.forEach((file) => {
      if (file.youtubeVideoId && !file.youtubeTitle && !fetchedIdsRef.current.has(file.id)) {
        fetchedIdsRef.current.add(file.id);
        fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${file.youtubeVideoId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data?.title) {
              setFetchedTitles((prev) => ({ ...prev, [file.id]: data.title }));
              onUpdateFile?.(file.id, { youtubeTitle: data.title });
            }
          })
          .catch(() => {});
      }
    });
  }, [noteList, onUpdateFile]);

  // Navigate back to parent folder
  function handleGoBack() {
    if (breadcrumbs.length > 1) {
      const parentId = breadcrumbs[breadcrumbs.length - 2].id;
      onSelectCollection(parentId);
    } else {
      onSelectCollection(null); // Return to root
    }
  }

  function handleCreateNote() {
    if (inputText.trim()) {
      const newId = onCreateFile(inputText.trim(), collectionId);
      setInputText('');
      setShowNewNoteModal(false);
      if (newId) onSelectFile(newId);
    }
  }

  function handleCreateFolder() {
    if (inputText.trim()) {
      onCreateCollection(inputText.trim(), collectionId);
      setInputText('');
      setShowNewFolderModal(false);
    }
  }

  function handleConfirmRename() {
    if (!showRenameModal || !inputText.trim()) return;
    if (showRenameModal.type === 'file') {
      onRenameFile(showRenameModal.id, inputText.trim());
    } else {
      onRenameCollection(showRenameModal.id, inputText.trim());
    }
    setShowRenameModal(null);
    setInputText('');
  }

  function handleConfirmDelete() {
    if (!showDeleteModal) return;
    if (showDeleteModal.type === 'file') {
      onDeleteFile(showDeleteModal.id);
    } else {
      onDeleteCollection(showDeleteModal.id);
    }
    setShowDeleteModal(null);
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-y-auto">
      {/* ── Top Navigation / Breadcrumbs Bar ─────────────────────── */}
      <div className="sticky top-0 z-10 px-6 py-3.5 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md flex items-center justify-between gap-4 flex-wrap select-none">
        <div className="flex items-center gap-2 min-w-0">
          {/* Sidebar Toggle when collapsed */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              title="Toggle Sidebar"
              className={`p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer shrink-0 ${
                !isSidebarCollapsed ? 'md:hidden' : 'flex'
              }`}
            >
              <FiSidebar className="w-4 h-4" />
            </button>
          )}

          {/* Up / Back arrow if inside a subfolder */}
          {collectionId && (
            <button
              onClick={handleGoBack}
              title="Back to parent folder"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            >
              <FiArrowLeft className="w-4 h-4" />
            </button>
          )}

          {/* Breadcrumb links */}
          <nav className="flex items-center gap-1.5 text-xs text-zinc-400 truncate">
            <button
              onClick={() => onSelectCollection(null)}
              className={`hover:text-blue-400 transition-colors cursor-pointer truncate font-medium ${
                !collectionId ? 'text-zinc-100 font-semibold' : ''
              }`}
            >
              Collections
            </button>

            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <span key={crumb.id} className="flex items-center gap-1.5 truncate">
                  <FiChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  <button
                    onClick={() => onSelectCollection(crumb.id)}
                    className={`hover:text-blue-400 transition-colors cursor-pointer truncate ${
                      isLast ? 'text-zinc-100 font-semibold' : 'text-zinc-400'
                    }`}
                  >
                    {crumb.name}
                  </button>
                </span>
              );
            })}
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { setInputText(''); setShowNewFolderModal(true); }}
            title="Create new subfolder"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-800/90 hover:bg-zinc-700 hover:text-white border border-zinc-700/70 transition-colors cursor-pointer"
          >
            <FiFolderPlus className="w-3.5 h-3.5 text-blue-400" />
            <span>New Folder</span>
          </button>

          <button
            onClick={() => { setInputText(''); setShowNewNoteModal(true); }}
            title="Create new markdown note"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-colors cursor-pointer"
          >
            <FiFilePlus className="w-3.5 h-3.5" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* ── Main Cards Canvas (Only .md cards for this folder) ──── */}
      <div className="p-6 md:p-8 max-w-7xl w-full mx-auto flex-1">
        {!isLoaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-xl bg-zinc-900/50 border border-zinc-800/80 overflow-hidden"
              >
                <div className="aspect-video w-full bg-zinc-800/50" />
                <div className="p-3.5 space-y-2">
                  <div className="h-4 bg-zinc-800/70 rounded w-3/4" />
                  <div className="h-3 bg-zinc-800/40 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : noteList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
              <FiFileText className="w-12 h-12 text-zinc-600 mb-3 opacity-40" />
              <h3 className="text-sm font-semibold text-zinc-300 mb-1">
                {currentCollection ? `No notes in "${currentCollection.name}"` : 'No notes created yet'}
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mb-4">
                Start by creating your first markdown note in this folder.
              </p>
              <button
                onClick={() => { setInputText(''); setShowNewNoteModal(true); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-colors cursor-pointer"
              >
                <FiFilePlus className="w-4 h-4" />
                <span>Create Note</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {noteList.map((file) => {
                const hasYoutube = Boolean(file.youtubeVideoId);
                const titleWithoutExt = file.name.replace(/\.md$/, '');
                const videoTitle = getVideoDisplayTitle(file, fetchedTitles[file.id]);

                return (
                  <div
                    key={file.id}
                    onClick={() => onSelectFile(file.id)}
                    className="group relative flex flex-col justify-between rounded-xl bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-blue-500/50 transition-colors duration-150 cursor-pointer overflow-hidden select-none"
                  >
                    {/* Card Top: Video thumbnail OR clean gradient header */}
                    {hasYoutube ? (
                      <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden shrink-0 border-b border-zinc-800/60">
                        <img
                          src={`https://img.youtube.com/vi/${file.youtubeVideoId}/mqdefault.jpg`}
                          alt={videoTitle}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-70" />
                        <div className="absolute bottom-2 right-2.5 flex items-center text-white text-xs">
                          <span className="p-1.5 rounded-full bg-black/60 backdrop-blur-xs text-white opacity-80 group-hover:opacity-100 group-hover:bg-blue-600 transition-all shadow-xs">
                            <FiPlay className="w-3 h-3 fill-current" />
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-10 bg-linear-to-r from-blue-950/40 via-zinc-900 to-zinc-900 border-b border-zinc-800/60 px-3.5 flex items-center justify-between shrink-0">
                        <span className="flex items-center gap-1.5 text-xs text-blue-400 font-medium">
                          <FiFileText className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-mono uppercase bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 text-blue-300">
                            .md
                          </span>
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">
                          {formatDate(file.updatedAt || file.createdAt)}
                        </span>
                      </div>
                    )}

                    {/* Card Body: Only show the video title */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <h3
                          title={videoTitle}
                          className="text-sm font-semibold text-zinc-100 group-hover:text-blue-300 transition-colors line-clamp-2 leading-snug"
                        >
                          {videoTitle}
                        </h3>
                      </div>

                      {/* Card Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-500 font-medium">
                        <span>{formatDate(file.updatedAt || file.createdAt)}</span>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {onMoveFile && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMoveTargetId(file.collectionId || '');
                                setShowMoveModal({ id: file.id, name: file.name, currentCollectionId: file.collectionId });
                              }}
                              title="Move note to folder"
                              className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                            >
                              <FiFolder className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInputText(titleWithoutExt);
                              setShowRenameModal({ type: 'file', id: file.id, name: file.name });
                            }}
                            title="Rename note"
                            className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                          >
                            <FiEdit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteModal({ type: 'file', id: file.id, name: file.name });
                            }}
                            title="Delete note"
                            className="p-1 rounded hover:bg-red-900/30 text-zinc-400 hover:text-red-400 cursor-pointer"
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      {/* ── Modals: New Note, New Folder, Rename, Delete ────────── */}
      {showNewNoteModal && (
        <Modal title="Create New Note" onClose={() => setShowNewNoteModal(false)}>
          <div className="flex flex-col gap-3">
            <input
              autoFocus
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateNote(); }}
              placeholder="e.g. props.md"
              className="w-full bg-zinc-800 text-zinc-100 text-sm px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-zinc-500">The .md extension will be added automatically.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewNoteModal(false)}
                className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNote}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showNewFolderModal && (
        <Modal title="Create New Folder" onClose={() => setShowNewFolderModal(false)}>
          <div className="flex flex-col gap-3">
            <input
              autoFocus
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); }}
              placeholder="e.g. react"
              className="w-full bg-zinc-800 text-zinc-100 text-sm px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Create Folder
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showRenameModal && (
        <Modal
          title={`Rename ${showRenameModal.type === 'file' ? 'Note' : 'Folder'}`}
          onClose={() => setShowRenameModal(null)}
        >
          <div className="flex flex-col gap-3">
            <input
              autoFocus
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmRename(); }}
              className="w-full bg-zinc-800 text-zinc-100 text-sm px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRenameModal(null)}
                className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRename}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Rename
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteModal && (
        <Modal
          title={`Delete ${showDeleteModal.type === 'file' ? 'Note' : 'Folder'}`}
          onClose={() => setShowDeleteModal(null)}
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-300">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-zinc-100">"{showDeleteModal.name}"</span>?
              {showDeleteModal.type === 'folder' && ' All notes and subfolders inside it will be permanently deleted.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showMoveModal && (
        <Modal
          title="Move Note"
          onClose={() => setShowMoveModal(null)}
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-300">
              Move <span className="font-semibold text-zinc-100">"{showMoveModal.name}"</span> to:
            </p>
            <select
              value={moveTargetId}
              onChange={(e) => setMoveTargetId(e.target.value)}
              className="w-full bg-zinc-800 text-zinc-100 text-sm px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">📁 Root / All Notes</option>
              {flattenTreeForSelect(collections).map((col) => (
                <option key={col.id} value={col.id}>
                  📁 {col.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowMoveModal(null)}
                className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onMoveFile) {
                    onMoveFile(showMoveModal.id, moveTargetId || null);
                  }
                  setShowMoveModal(null);
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Move Note
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
