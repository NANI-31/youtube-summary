import { useState } from 'react';
import { FiFolder, FiFolderPlus, FiLayers } from 'react-icons/fi';
import CollectionItem from './CollectionItem.jsx';
import Modal from '../common/Modal.jsx';
import { useAppSelector, selectNotesLoaded } from '../../store/hooks.js';

/**
 * The full sidebar: collection tree + footer buttons.
 */
export default function CollectionTree({
  collections,
  selectedFileId,
  selectedCollectionId,
  onSelectFile,
  onSelectCollection,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
  onCreateFile,
}) {
  const [showNewRootFolder, setShowNewRootFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const isLoaded = useAppSelector(selectNotesLoaded);

  function submitRootFolder() {
    if (folderName.trim()) onCreateCollection(folderName.trim(), null);
    setFolderName('');
    setShowNewRootFolder(false);
  }

  return (
    <div className="flex flex-col h-full">

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-2 px-1 scrollbar-thin">
        {/* Quick jump to Root / All Notes */}
        <div
          onClick={() => {
            onSelectCollection?.(null);
            onSelectFile?.(null);
          }}
          className={`group flex items-center gap-2 py-1.5 px-2.5 mb-1 rounded-lg cursor-pointer transition-colors duration-100 select-none ${
            selectedCollectionId === null && !selectedFileId
              ? 'bg-blue-600/20 text-blue-300 font-medium'
              : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
          }`}
        >
          <FiLayers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="text-xs font-medium">All Notes / Root</span>
        </div>

        {!isLoaded ? (
          <div className="flex flex-col gap-1.5 p-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-zinc-800/30">
                <div className="w-3.5 h-3.5 rounded bg-zinc-800/80 shrink-0" />
                <div className="h-3 bg-zinc-800/70 rounded w-28" />
              </div>
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-600">
            <FiFolder className="w-10 h-10 opacity-40" />
            <p className="text-xs text-center">No collections yet.<br />Create your first folder below.</p>
          </div>
        ) : (
          collections.map((col) => (
            <CollectionItem
              key={col.id}
              collection={col}
              depth={0}
              selectedFileId={selectedFileId}
              selectedCollectionId={selectedCollectionId}
              onSelectFile={onSelectFile}
              onSelectCollection={onSelectCollection}
              onCreateCollection={onCreateCollection}
              onRenameCollection={onRenameCollection}
              onDeleteCollection={onDeleteCollection}
              onCreateFile={onCreateFile}
            />
          ))
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t border-zinc-800 p-2 flex flex-col gap-1">
        <button
          onClick={() => setShowNewRootFolder(true)}
          className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors w-full text-left cursor-pointer"
        >
          <FiFolderPlus className="text-sm" />
          <span>New Folder</span>
        </button>
      </div>



      {/* New root folder modal */}
      {showNewRootFolder && (
        <Modal title="New Folder" onClose={() => setShowNewRootFolder(false)}>
          <div className="flex flex-col gap-3">
            <input
              autoFocus
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitRootFolder(); }}
              className="w-full bg-zinc-800 text-zinc-100 text-sm px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500"
              placeholder="Folder name"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNewRootFolder(false)} className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">Cancel</button>
              <button onClick={submitRootFolder} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">Create</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
