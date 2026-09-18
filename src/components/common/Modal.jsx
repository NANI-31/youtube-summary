import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';

/**
 * Reusable modal dialog.
 * Closes on Escape key.
 */
export default function Modal({ title, children, onClose, className = '' }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose?.();
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className={`bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-md mx-4 ${className}`}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700">
            <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-100 transition-colors p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
