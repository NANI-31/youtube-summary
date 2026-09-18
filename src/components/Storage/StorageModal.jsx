import { useState } from 'react';
import {
  FiCloud,
  FiUploadCloud,
  FiRefreshCw,
  FiDownload,
  FiInfo,
  FiCheckCircle,
  FiAlertCircle,
  FiDatabase,
  FiServer,
  FiFolder,
  FiHardDrive,
} from 'react-icons/fi';
import Modal from '../common/Modal.jsx';
import {
  downloadBackupToPc,
  exportNotesToPcFolder,
  isFileSystemAccessSupported,
} from '../../utils/fileSystemAccess.js';
import { useAppSelector, selectSyncStatus } from '../../store/hooks.js';
import { isSupabaseConfigured } from '../../utils/supabase.js';
import {
  migrateLocalDataToSupabase,
  pushToSupabase,
  pullFromSupabase,
  pushSettingsToSupabase,
} from '../../services/syncService.js';
import { store } from '../../store/index.js';

/**
 * Modal dialog for inspecting and managing the Supabase Cloud database.
 * Completely cloud-native: Zero data stored in localStorage or local PC disk.
 */
export default function StorageModal({
  isOpen,
  onClose,
  collections = [],
  files = {},
}) {
  const syncStatus = useAppSelector(selectSyncStatus);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isExportingFolder, setIsExportingFolder] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  if (!isOpen) return null;

  const fileCount = Object.keys(files || {}).length;
  const collectionCount = (collections || []).length;
  const configured = isSupabaseConfigured();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

  async function handleMigrateToSupabase() {
    setIsMigrating(true);
    setSyncMessage(null);
    try {
      const result = await migrateLocalDataToSupabase({ collections, files });
      setSyncMessage({
        type: 'success',
        text: `✓ Uploaded ${result.collectionsCount} folders and ${result.notesCount} notes directly to your Supabase cloud tables!`,
      });
    } catch (err) {
      setSyncMessage({
        type: 'error',
        text: `Migration failed: ${err.message}`,
      });
    } finally {
      setIsMigrating(false);
    }
  }

  async function handleManualCloudSync() {
    setIsManualSyncing(true);
    setSyncMessage(null);
    try {
      await pushToSupabase({ collections, files });
      const currentSettings = store.getState().settings;
      if (currentSettings) {
        await pushSettingsToSupabase({
          theme: currentSettings.theme,
          thumbnail: currentSettings.thumbnail,
        });
      }
      await pullFromSupabase();
      setSyncMessage({
        type: 'success',
        text: `✓ Cloud synchronization complete. Collections, notes, and custom settings updated in Supabase!`,
      });
    } catch (err) {
      setSyncMessage({
        type: 'error',
        text: `Sync error: ${err.message}`,
      });
    } finally {
      setIsManualSyncing(false);
    }
  }

  function handleDownloadBackup() {
    const currentSettings = store.getState().settings;
    const res = downloadBackupToPc({
      collections,
      files,
      settings: currentSettings ? { theme: currentSettings.theme, thumbnail: currentSettings.thumbnail } : undefined,
    });
    setSyncMessage({
      type: 'success',
      text: `✓ Downloaded offline backup "${res.fileName}" to your PC!`,
    });
  }

  async function handleExportToFolder() {
    setIsExportingFolder(true);
    setSyncMessage(null);
    try {
      const currentSettings = store.getState().settings;
      const result = await exportNotesToPcFolder(
        collections,
        files,
        currentSettings ? { theme: currentSettings.theme, thumbnail: currentSettings.thumbnail } : null
      );
      if (result.success) {
        setSyncMessage({
          type: 'success',
          text: `✓ Wrote ${result.filesExported} notes into folder "${result.folderName}" on your PC!`,
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setSyncMessage({
          type: 'error',
          text: `Export failed: ${err.message}`,
        });
      }
    } finally {
      setIsExportingFolder(false);
    }
  }

  return (
    <Modal title="Supabase Cloud Database" onClose={onClose} className="max-w-xl">
      <div className="flex flex-col gap-4 text-sm max-h-[80vh] overflow-y-auto pr-1">
        {/* Cloud Connection & Status Hero Card */}
        <div className="bg-linear-to-br from-zinc-900/90 to-zinc-800/80 border border-blue-500/20 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <FiCloud className="text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <span>Supabase PostgreSQL</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded-full border border-blue-500/30">
                    Cloud Native
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  100% Cloud-Powered • Zero localStorage • Zero PC Disk
                </p>
              </div>
            </div>

            {configured ? (
              <span
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${
                  syncStatus?.status === 'syncing'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : syncStatus?.status === 'error'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    syncStatus?.status === 'syncing'
                      ? 'bg-blue-400 animate-spin'
                      : syncStatus?.status === 'error'
                      ? 'bg-red-400'
                      : 'bg-emerald-400'
                  }`}
                />
                {syncStatus?.status === 'syncing'
                  ? 'Syncing…'
                  : syncStatus?.status === 'error'
                  ? 'Sync Error'
                  : 'Connected'}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Missing .env Keys
              </span>
            )}
          </div>

          {/* Database Endpoint Info */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <FiServer className="text-xs text-zinc-500" />
                <span>Database Host:</span>
              </span>
              <span className="font-mono text-[11px] text-zinc-300">
                {supabaseUrl ? supabaseUrl.replace('https://', '') : 'Unconfigured'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <FiDatabase className="text-xs text-zinc-500" />
                <span>Live Cloud State:</span>
              </span>
              <span className="text-zinc-200">
                <strong className="text-blue-400">{collectionCount}</strong> folders •{' '}
                <strong className="text-blue-400">{fileCount}</strong> notes
              </span>
            </div>
            {syncStatus?.lastSynced && (
              <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/60">
                <span>Last Cloud Sync:</span>
                <span className="font-mono text-zinc-400">{syncStatus.lastSynced}</span>
              </div>
            )}
          </div>

          {syncStatus?.error && (
            <p className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded-lg border border-red-800/50 flex items-start gap-2">
              <FiAlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{syncStatus.error}</span>
            </p>
          )}

          {/* Cloud Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            {configured && (
              <button
                onClick={handleManualCloudSync}
                disabled={isManualSyncing}
                title="Trigger immediate sync with Supabase tables"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors text-xs disabled:opacity-50 cursor-pointer shadow-md"
              >
                <FiRefreshCw className={`text-xs ${isManualSyncing ? 'animate-spin' : ''}`} />
                <span>{isManualSyncing ? 'Synchronizing…' : 'Sync With Cloud Now'}</span>
              </button>
            )}

            <button
              onClick={handleMigrateToSupabase}
              disabled={!configured || isMigrating}
              title={
                configured
                  ? 'Push in-memory state directly to Supabase cloud'
                  : 'Configure Supabase credentials first'
              }
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-medium transition-colors text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border border-zinc-700/60"
            >
              <FiUploadCloud className={`text-sm ${isMigrating ? 'animate-bounce' : ''}`} />
              <span>{isMigrating ? 'Pushing…' : 'Force Push to Cloud'}</span>
            </button>
          </div>

          {syncMessage && (
            <p
              className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${
                syncMessage.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-700/50 text-emerald-300'
                  : 'bg-red-950/60 border border-red-700/50 text-red-300'
              }`}
            >
              <FiCheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{syncMessage.text}</span>
            </p>
          )}
        </div>

        {/* Export Data to PC: JSON Backup & PC Folder */}
        <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                <FiHardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Data to PC</span>
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Download a complete offline JSON backup or export as markdown files directly to a PC folder.
              </p>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-700">
              {Object.keys(files || {}).length} Notes
            </span>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={handleExportToFolder}
              disabled={isExportingFolder || !isFileSystemAccessSupported()}
              title={
                isFileSystemAccessSupported()
                  ? 'Pick any folder on your PC and save markdown files directly'
                  : 'Folder picker not supported in this browser'
              }
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-400 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed shadow-xs"
            >
              <FiFolder className={`w-3.5 h-3.5 ${isExportingFolder ? 'animate-bounce' : ''}`} />
              <span>{isExportingFolder ? 'Writing…' : 'Export to PC Folder'}</span>
            </button>

            <button
              onClick={handleDownloadBackup}
              title="Download offline JSON backup file"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 border border-zinc-600/70"
            >
              <FiDownload className="w-3.5 h-3.5 text-blue-400" />
              <span>Download JSON</span>
            </button>
          </div>
        </div>

        {/* Architecture Note */}
        <div className="text-xs text-zinc-400 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 leading-relaxed">
          <p className="font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
            <FiInfo className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>How Cloud Storage Works:</span>
          </p>
          <ul className="list-disc pl-4 space-y-1 text-zinc-400 text-[11px]">
            <li>
              <strong>Pure Cloud Single Source of Truth:</strong> Every folder created and note
              edited is mirrored directly to your Supabase PostgreSQL database via HTTPS.
            </li>
            <li>
              <strong>No Local Footprint:</strong> Zero data is stored in your browser's
              localStorage or your PC's local hard drive.
            </li>
            <li>
              <strong>Universal Availability:</strong> Changes made on Vercel or locally are
              instantly accessible from any browser or device.
            </li>
          </ul>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
