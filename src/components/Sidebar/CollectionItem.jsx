import { useState } from 'react';
import {
  FiFolder,
  FiFolderPlus,
  FiFilePlus,
  FiEdit2,
  FiTrash2,
  FiChevronRight,
  FiMoreVertical,
} from 'react-icons/fi';
import ContextMenu from '../common/ContextMenu.jsx';
import Modal from '../common/Modal.jsx';

/**
 * Recursive folder/collection item.
 * Renders the folder hierarchy exclusively (notes are presented in the cards panel).
 * No depth limit — recursion handles arbitrary nesting.
 */
export default function CollectionItem({
  collection,
  depth,
  selectedFileId,
  selectedCollectionId,
  onSelectFile,
  onSelectCollection,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
  onCreateFile,
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const [contextMenu, setContextMenu] = useState(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const indent = depth * 12; // px per level
  const fileCount = (collection.fileIds || []).length;
  const hasSubfolders = (collection.children?.length || 0) > 0;

  function openContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  function openModal(modal) {
    setInputValue('');
    if (modal === 'folder') setShowNewFolderModal(true);
    if (modal === 'file') setShowNewFileModal(true);
    if (modal === 'rename') { setInputValue(collection.name); setShowRenameModal(true); }
    if (modal === 'delete') setShowDeleteModal(true);
  }

  function submitNewFolder() {
    if (inputValue.trim()) {
      onCreateCollection(inputValue.trim(), collection.id);
      setExpanded(true);
    }
    setShowNewFolderModal(false);
  }

  function submitNewFile() {
    if (inputValue.trim()) {
      const id = onCreateFile(inputValue.trim(), collection.id);
      onSelectFile(id);
      setExpanded(true);
    }
    setShowNewFileModal(false);
  }

  function submitRename() {
    if (inputValue.trim()) onRenameCollection(collection.id, inputValue.trim());
    setShowRenameModal(false);
  }

  const menuItems = [
    { label: 'New Folder', icon: <FiFolderPlus className="text-sm" />, onClick: () => openModal('folder') },
    { label: 'New Note', icon: <FiFilePlus className="text-sm" />, onClick: () => openModal('file') },
    { divider: true },
    { label: 'Rename', icon: <FiEdit2 className="text-sm" />, onClick: () => openModal('rename') },
    { divider: true },
    { label: 'Delete', icon: <FiTrash2 className="text-sm text-red-400" />, danger: true, onClick: () => openModal('delete') },
  ];

  return (
    <>
      {/* Folder row */}
      <div
        className={`group flex items-center gap-1 py-1.5 pr-2 rounded-lg cursor-pointer transition-colors duration-100 select-none ${
          selectedCollectionId === collection.id && !selectedFileId
            ? 'bg-blue-600/20 text-blue-200 font-medium'
            : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100'
        }`}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={() => {
          setExpanded((e) => !e);
          onSelectCollection?.(collection.id);
        }}
        onContextMenu={openContextMenu}
        title={collection.name}
      >
        {/* Expand/collapse chevron */}
        {hasSubfolders ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="p-0.5 rounded hover:bg-zinc-700/50"
          >
            <FiChevronRight
              className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-150 shrink-0 ${
                expanded ? 'rotate-90' : ''
              }`}
            />
          </span>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        {expanded && hasSubfolders ? (
          <FiFolder className="text-sm text-blue-400 shrink-0" />
        ) : (
          <FiFolder className="text-sm text-zinc-400 shrink-0" />
        )}
        <span className="text-xs font-medium truncate flex-1 ml-1">{collection.name}</span>

        {/* Note count badge */}
        {fileCount > 0 && (
          <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/40 shrink-0 mr-1 group-hover:opacity-0 transition-opacity">
            {fileCount}
          </span>
        )}

        {/* Action buttons (show on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); openModal('file'); }}
            title="New note"
            className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 cursor-pointer flex items-center justify-center"
          >
            <FiFilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openModal('folder'); }}
            title="New folder"
            className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 cursor-pointer flex items-center justify-center"
          >
            <FiFolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              setContextMenu({
                x: rect.right + 6,
                y: rect.top,
                anchorRect: rect,
              });
            }}
            title="Options"
            className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 cursor-pointer flex items-center justify-center"
          >
            <FiMoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Children: Subfolders only */}
      {expanded && hasSubfolders && (
        <div>
          {collection.children.map((child) => (
            <CollectionItem
              key={child.id}
              collection={child}
              depth={depth + 1}
              selectedFileId={selectedFileId}
              selectedCollectionId={selectedCollectionId}
              onSelectFile={onSelectFile}
              onSelectCollection={onSelectCollection}
              onCreateCollection={onCreateCollection}
              onRenameCollection={onRenameCollection}
              onDeleteCollection={onDeleteCollection}
              onCreateFile={onCreateFile}
            />
          ))}
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu items={menuItems} position={contextMenu} onClose={() => setContextMenu(null)} />
      )}

      {/* New folder modal */}
      {showNewFolderModal && (
        <Modal title="New Folder" onClose={() => setShowNewFolderModal(false)}>
          <div className="flex flex-col gap-3">
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitNewFolder(); }}
              className="w-full bg-zinc-800 text-zinc-100 text-sm px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500"
              placeholder="Folder name"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNewFolderModal(false)} className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">Cancel</button>
              <button onClick={submitNewFolder} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">Create</button>
            </div>
          </div>
        </Modal>
      )}

      {/* New file modal */}
      {showNewFileModal && (
        <Modal title="New Note" onClose={() => setShowNewFileModal(false)}>
          <div className="flex flex-col gap-3">
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitNewFile(); }}
              className="w-full bg-zinc-800 text-zinc-100 text-sm px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500"
              placeholder="Note name"
            />
            <p className="text-xs text-zinc-500">The .md extension will be added automatically.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNewFileModal(false)} className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">Cancel</button>
              <button onClick={submitNewFile} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">Create</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Rename modal */}
      {showRenameModal && (
        <Modal title="Rename Folder" onClose={() => setShowRenameModal(false)}>
          <div className="flex flex-col gap-3">
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitRename(); }}
              className="w-full bg-zinc-800 text-zinc-100 text-sm px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowRenameModal(false)} className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">Cancel</button>
              <button onClick={submitRename} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">Rename</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {showDeleteModal && (
        <Modal title="Delete Folder" onClose={() => setShowDeleteModal(false)}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-300">
              Delete <span className="font-semibold text-zinc-100">"{collection.name}"</span> and all its contents? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteModal(false)} className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">Cancel</button>
              <button
                onClick={() => { onDeleteCollection(collection.id); setShowDeleteModal(false); }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Delete All
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
