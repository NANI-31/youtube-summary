import { useAppState } from './hooks/useAppState.js';
import {
  useAppDispatch,
  useAppSelector,
  selectCurrentView,
  selectDesktopSidebarOpen,
  selectMobileSidebarOpen,
  selectShowStorageModal,
  selectSelectedFile,
  selectSelectedFileId,
} from './store/hooks.js';
import {
  setCurrentView,
  toggleDesktopSidebar,
  toggleMobileSidebar,
  setMobileSidebarOpen,
  setShowStorageModal,
} from './store/slices/uiSlice.js';
import Sidebar from './components/Sidebar/Sidebar.jsx';
import EditorPanel from './components/Editor/EditorPanel.jsx';
import FolderCardsView from './components/Cards/FolderCardsView.jsx';
import StorageModal from './components/Storage/StorageModal.jsx';
import SettingsPage from './components/Settings/SettingsPage.jsx';

import { useSettings } from './hooks/useSettings.js';

/**
 * Root Application component connected to Redux Toolkit.
 */
export default function App() {
  const dispatch = useAppDispatch();
  // Ensure settings & theme variables are hydrated on startup
  useSettings();

  // Redux UI State
  const currentView = useAppSelector(selectCurrentView);
  const desktopSidebarOpen = useAppSelector(selectDesktopSidebarOpen);
  const mobileSidebarOpen = useAppSelector(selectMobileSidebarOpen);
  const showStorageModal = useAppSelector(selectShowStorageModal);
  const selectedFile = useAppSelector(selectSelectedFile);
  const selectedFileId = useAppSelector(selectSelectedFileId);

  // Redux Notes State & Operations
  const {
    collections,
    files,
    selectedCollectionId,
    createCollection,
    renameCollection,
    deleteCollection,
    createFile,
    updateFile,
    renameFile,
    deleteFile,
    moveFile,
    selectFile,
    selectCollection,
  } = useAppState();

  function handleToggleSidebar() {
    if (window.innerWidth < 768) {
      dispatch(toggleMobileSidebar());
    } else {
      dispatch(toggleDesktopSidebar());
    }
  }

  function handleSelectFile(id) {
    selectFile(id);
    dispatch(setCurrentView('editor'));
  }

  function handleDeleteFile(id) {
    deleteFile(id);
  }

  function handleDeleteCollection(id) {
    deleteCollection(id);
  }

  return (
    <div
      className="flex h-screen text-zinc-100 overflow-hidden"
      style={{
        backgroundColor: 'var(--app-bg-base, #09090b)',
        fontSize: 'var(--app-font-ui-size, 14px)',
      }}
    >
      {/* Main Notes Sidebar: visible when in editor view */}
      {currentView !== 'settings' && (
        <Sidebar
          isOpen={mobileSidebarOpen}
          isDesktopOpen={desktopSidebarOpen}
          onClose={() => dispatch(setMobileSidebarOpen(false))}
          onToggleSidebar={handleToggleSidebar}
          onOpenStorage={() => dispatch(setShowStorageModal(true))}
          onOpenSettings={() => dispatch(setCurrentView('settings'))}
          collections={collections}
          files={files}
          selectedFileId={selectedFileId}
          selectedCollectionId={selectedCollectionId}
          onSelectFile={handleSelectFile}
          onSelectCollection={selectCollection}
          onCreateCollection={createCollection}
          onRenameCollection={renameCollection}
          onDeleteCollection={handleDeleteCollection}
          onCreateFile={createFile}
        />
      )}

      {/* Main Workspace Area (Full-width Settings Page, Editor, or Cards View) */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {currentView === 'settings' ? (
          <SettingsPage
            onClose={() => dispatch(setCurrentView('editor'))}
            activeVideoId={selectedFile?.youtubeVideoId}
            activeVideoTitle={selectedFile?.youtubeTitle}
            collections={collections}
            files={files}
            isSidebarCollapsed={!desktopSidebarOpen}
            onToggleSidebar={handleToggleSidebar}
          />
        ) : selectedFile ? (
          <EditorPanel
            file={selectedFile}
            onUpdate={updateFile}
            onBack={() => selectFile(null)}
          />
        ) : (
          <FolderCardsView
            collectionId={selectedCollectionId}
            collections={collections}
            files={files}
            onSelectFile={handleSelectFile}
            onSelectCollection={selectCollection}
            onCreateFile={createFile}
            onCreateCollection={createCollection}
            onRenameFile={renameFile}
            onDeleteFile={handleDeleteFile}
            onRenameCollection={renameCollection}
            onDeleteCollection={handleDeleteCollection}
            onUpdateFile={updateFile}
            onMoveFile={moveFile}
            isSidebarCollapsed={!desktopSidebarOpen}
            onToggleSidebar={handleToggleSidebar}
          />
        )}
      </main>

      {/* Cloud Storage Management Modal */}
      <StorageModal
        isOpen={showStorageModal}
        onClose={() => dispatch(setShowStorageModal(false))}
        collections={collections}
        files={files}
      />
    </div>
  );
}
