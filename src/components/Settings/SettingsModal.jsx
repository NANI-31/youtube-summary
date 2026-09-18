import SettingsPage from './SettingsPage.jsx';

/**
 * Backward-compatible SettingsModal wrapper.
 * Renders the SettingsPage as a full-viewport overlay when invoked modally.
 */
export default function SettingsModal({
  isOpen,
  onClose,
  activeVideoId = null,
  activeVideoTitle = null,
  ...props
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
      <SettingsPage
        onClose={onClose}
        activeVideoId={activeVideoId}
        activeVideoTitle={activeVideoTitle}
        {...props}
      />
    </div>
  );
}
