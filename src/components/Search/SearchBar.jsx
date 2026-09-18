import { useRef, useEffect, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

/**
 * Compact icon-triggered search bar.
 * Renders as a search icon button and expands to an input when clicked or on Ctrl+K.
 */
export default function SearchBar({ query, onChange, onFocus, onBlur }) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);

  // Cmd/Ctrl+K to expand and focus
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const isExpanded = isOpen || Boolean(query);

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        title="Search notes (Ctrl+K)"
        className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
      >
        <FiSearch className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="relative flex items-center">
      <FiSearch className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onChange('');
            setIsOpen(false);
          }
        }}
        placeholder="Search notes… (Ctrl+K)"
        className="
          bg-zinc-800 text-zinc-100 text-xs sm:text-sm
          pl-9 pr-7 py-1.5 rounded-xl w-56 sm:w-72
          border border-zinc-700
          focus:outline-none focus:border-blue-500
          placeholder-zinc-500
          transition-all duration-200
        "
      />
      <button
        onClick={() => {
          onChange('');
          setIsOpen(false);
        }}
        title="Close search (Esc)"
        className="absolute right-2 p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
      >
        <FiX className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
