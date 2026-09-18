import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Floating context menu rendered into document.body to avoid parent CSS transforms.
 * Automatically aligns to anchor bounds and clamps to the viewport.
 */
export default function ContextMenu({ items, position, onClose }) {
  const menuRef = useRef(null);
  const [style, setStyle] = useState({
    top: position.y,
    left: position.x,
    opacity: 0,
  });

  useLayoutEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const menuWidth = rect.width || 160;
    const menuHeight = rect.height || 140;

    let left = position.x;
    let top = position.y;

    if (position.align === 'end') {
      left = position.x - menuWidth;
    } else if (position.align === 'right') {
      left = position.x;
    }

    const padding = 8;
    // Prevent overflowing right viewport edge
    if (left + menuWidth > window.innerWidth - padding) {
      if (position.anchorRect) {
        left = Math.max(padding, position.anchorRect.left - menuWidth - 6);
      } else {
        left = window.innerWidth - menuWidth - padding;
      }
    }
    // Prevent overflowing left viewport edge
    if (left < padding) {
      left = padding;
    }

    // Prevent overflowing bottom viewport edge
    if (top + menuHeight > window.innerHeight - padding) {
      if (position.align === 'end' && position.anchorTop !== undefined) {
        top = Math.max(padding, position.anchorTop - menuHeight - 4);
      } else {
        top = Math.max(padding, window.innerHeight - menuHeight - padding);
      }
    }
    if (top < padding) {
      top = padding;
    }

    setStyle({
      top: Math.round(top),
      left: Math.round(left),
      opacity: 1,
    });
  }, [position]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose?.();
    };
    const handleScroll = () => onClose?.();

    window.addEventListener('keydown', handleKey);
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [onClose]);

  const menuContent = (
    <div
      ref={menuRef}
      className="fixed z-50 bg-zinc-800 border border-zinc-700/90 rounded-xl shadow-2xl py-1.5 min-w-40 backdrop-blur-md select-none transition-opacity duration-75"
      style={{
        top: `${style.top}px`,
        left: `${style.left}px`,
        opacity: style.opacity,
      }}
    >
      {items.map((item, idx) =>
        item.divider ? (
          <div key={idx} className="border-t border-zinc-700 my-1" />
        ) : (
          <button
            key={idx}
            onClick={() => { item.onClick?.(); onClose?.(); }}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs transition-colors cursor-pointer ${
              item.danger
                ? 'text-red-400 hover:bg-red-900/40'
                : 'text-zinc-200 hover:bg-zinc-700/80'
            }`}
          >
            {item.icon && <span className="shrink-0 text-zinc-400">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        )
      )}
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(menuContent, document.body)
    : menuContent;
}
