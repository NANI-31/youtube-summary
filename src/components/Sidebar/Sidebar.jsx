import { useState, useEffect } from 'react';
import { FiSidebar, FiFolder, FiSearch, FiSettings, FiCloud } from 'react-icons/fi';
import CollectionTree from './CollectionTree.jsx';
import SidebarSearch from './SidebarSearch.jsx';
import { useAppSelector, selectSyncStatus } from '../../store/hooks.js';

/**
 * Main application sidebar for browsing collections, notes, and search.
 */
export default function Sidebar({
  isOpen,
  isDesktopOpen = true,
  onClose,
  onToggleSidebar,
  collections,
  files,
  selectedFileId,
  selectedCollectionId,
  onSelectFile,
  onSelectCollection,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
  onCreateFile,
  onOpenSettings,
  onOpenStorage,
}) {
  const [sidebarTab, setSidebarTab] = useState('collections'); // 'collections' | 'search'
  const [searchQuery, setSearchQuery] = useState('');
  const syncStatus = useAppSelector(selectSyncStatus);

  // Cmd/Ctrl+K shortcut to switch to search tab
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSidebarTab('search');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        style={{
          backgroundColor: 'var(--app-bg-sidebar)',
          borderColor: 'var(--app-border-color)',
        }}
        className={`
          fixed md:relative inset-y-0 left-0 z-30
          shrink-0 bg-zinc-900 border-r border-zinc-800
          flex flex-col h-full
          transition-all duration-200 ease-in-out
          ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
          ${isDesktopOpen ? 'md:w-64' : 'md:w-0 md:border-r-0 md:overflow-hidden'}
        `}
      >
        {/* Top Icon Bar */}
        <div
          style={{
            backgroundColor: 'color-mix(in oklab, var(--app-bg-sidebar) 90%, transparent)',
            borderColor: 'var(--app-border-color)',
          }}
          className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/90 shrink-0 select-none"
        >
          <div className="flex items-center gap-1">
            {/* Toggle Sidebar */}
            <button
              onClick={onToggleSidebar}
              title="Collapse Sidebar"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer flex items-center justify-center"
            >
              <FiSidebar className="w-4 h-4" />
            </button>

            {/* Collections Tab (Folder Icon) */}
            <button
              onClick={() => setSidebarTab('collections')}
              title="Collections & Notes"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                sidebarTab === 'collections'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
              }`}
            >
              <FiFolder className="w-4 h-4" />
            </button>

            {/* Search Tab (Search Icon) */}
            <button
              onClick={() => setSidebarTab('search')}
              title="Search Notes (Ctrl+K)"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                sidebarTab === 'search'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
              }`}
            >
              <FiSearch className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* Supabase Cloud Database */}
            {onOpenStorage && (
              <button
                onClick={onOpenStorage}
                title={`Cloud Database: ${
                  syncStatus?.status === 'syncing'
                    ? 'Syncing with Supabase…'
                    : syncStatus?.status === 'error'
                    ? 'Sync Error'
                    : syncStatus?.status === 'synced'
                    ? 'Synced with Supabase Cloud'
                    : 'Supabase Cloud (Unconfigured)'
                }`}
                className="relative p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer flex items-center justify-center"
              >
                <FiCloud className="w-4 h-4" />
                <span
                  className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                    syncStatus?.status === 'syncing'
                      ? 'bg-blue-400 animate-spin'
                      : syncStatus?.status === 'error'
                      ? 'bg-red-400'
                      : syncStatus?.status === 'synced'
                      ? 'bg-emerald-400'
                      : 'bg-amber-400'
                  }`}
                />
              </button>
            )}

            {/* Settings */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                title="Settings"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer flex items-center justify-center"
              >
                <FiSettings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tabbed Content: Collections Tree or Search View */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {sidebarTab === 'collections' ? (
            <CollectionTree
              collections={collections}
              selectedFileId={selectedFileId}
              selectedCollectionId={selectedCollectionId}
              onSelectFile={(id) => {
                onSelectFile(id);
                onClose?.();
              }}
              onSelectCollection={(id) => {
                onSelectCollection?.(id);
                onClose?.();
              }}
              onCreateCollection={onCreateCollection}
              onRenameCollection={onRenameCollection}
              onDeleteCollection={onDeleteCollection}
              onCreateFile={onCreateFile}
            />
          ) : (
            <SidebarSearch
              query={searchQuery}
              onQueryChange={setSearchQuery}
              files={files}
              collections={collections}
              selectedFileId={selectedFileId}
              selectedCollectionId={selectedCollectionId}
              onSelectFile={(id) => {
                onSelectFile(id);
                onClose?.();
              }}
              onSelectCollection={(id) => {
                onSelectCollection?.(id);
                onClose?.();
              }}
            />
          )}
        </div>
      </aside>
    </>
  );
}
