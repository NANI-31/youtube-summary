import { useState } from 'react';
import { FiFileText, FiEdit2, FiFolder, FiTrash2, FiMoreVertical } from 'react-icons/fi';
import ContextMenu from '../common/ContextMenu.jsx';
import Modal from '../common/Modal.jsx';

/**
 * Renders a single .md file row in the sidebar tree.
 */
export default function FileItem({
  file,
  depth,
  isSelected,
  onSelect,
  onRename,
  onDelete,
  onMove,
  collections,
}) {
  const [contextMenu, setContextMenu] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [moveTarget, setMoveTarget] = useState('');

  const indent = depth * 12 + 24; // px

  function openContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  function openRename() {
    setRenameValue(file.name.replace(/\.md$/, ''));
    setShowRenameModal(true);
  }

  function submitRename() {
    if (renameValue.trim()) onRename(file.id, renameValue.trim());
    setShowRenameModal(false);
  }

  // Flatten all collections for move dropdown
  function flattenCollections(nodes, prefix = '') {
    const result = [];
    for (const node of nodes) {
      const label = prefix ? `${prefix} / ${node.name}` : node.name;
      result.push({ id: node.id, label });
      if (node.children?.length) {
        result.push(...flattenCollections(node.children, label));
      }
    }
    return result;
  }

  const allCollections = flattenCollections(collections);

  const menuItems = [
    { label: 'Open', icon: <FiFileText className="text-sm" />, onClick: () => onSelect(file.id) },
    { label: 'Rename', icon: <FiEdit2 className="text-sm" />, onClick: openRename },
    onMove && { label: 'Move to…', icon: <FiFolder className="text-sm" />, onClick: () => { setMoveTarget(''); setShowMoveModal(true); } },
    { divider: true },
    { label: 'Delete', icon: <FiTrash2 className="text-sm text-red-400" />, danger: true, onClick: () => setShowDeleteModal(true) },
  ].filter(Boolean);

  return (
    <>
      <div
        className={`
          group flex items-center gap-2 py-1.5 pr-2 rounded-lg cursor-pointer
          transition-colors duration-100 select-none
          ${isSelected
            ? 'bg-blue-600/20 text-blue-300'
            : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
          }
        `}
        style={{ paddingLeft: `${indent}px` }}
        onClick={() => onSelect(file.id)}
        onContextMenu={openContextMenu}
        title={file.name}
      >
        <FiFileText className="text-xs opacity-70 shrink-0" />
        <span className="text-xs truncate flex-1">{file.name}</span>

        {/* Three-dot menu button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setContextMenu({
              x: rect.right + 6,
              y: rect.top,
              anchorRect: rect,
              align: 'right',
            });
          }}
          className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-zinc-700 transition-all cursor-pointer flex items-center justify-center"
        >
          <FiMoreVertical className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          items={menuItems}
          position={contextMenu}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Rename modal */}
      {showRenameModal && (
        <Modal title="Rename File" onClose={() => setShowRenameModal(false)}>
          <div className="flex flex-col gap-3">
            <input
              autoFocus
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
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

      {/* Delete modal */}
      {showDeleteModal && (
        <Modal title="Delete File" onClose={() => setShowDeleteModal(false)}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-300">
              Delete <span className="font-semibold text-zinc-100">"{file.name}"</span>? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteModal(false)} className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">Cancel</button>
              <button
                onClick={() => { onDelete(file.id); setShowDeleteModal(false); }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Move modal */}
      {showMoveModal && (
        <Modal title="Move File" onClose={() => setShowMoveModal(false)}>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-zinc-400">Move <span className="text-zinc-200">"{file.name}"</span> to:</p>
            <select
              value={moveTarget}
              onChange={(e) => setMoveTarget(e.target.value)}
              className="w-full bg-zinc-800 text-zinc-100 text-sm px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">— Select folder —</option>
              {allCollections
                .filter((c) => c.id !== file.collectionId)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowMoveModal(false)} className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">Cancel</button>
              <button
                disabled={!moveTarget}
                onClick={() => { onMove(file.id, moveTarget); setShowMoveModal(false); }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Move
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
