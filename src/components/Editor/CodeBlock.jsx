import { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';

/**
 * Syntax-highlighted code block with a copy button.
 */
export default function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);

  const code = String(children).replace(/\n$/, '');

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative group my-4">
      <button
        onClick={handleCopy}
        className="
          absolute top-2 right-2 z-10
          px-2 py-1 text-xs rounded
          bg-zinc-700 hover:bg-zinc-600
          text-zinc-300 hover:text-white
          opacity-0 group-hover:opacity-100
          transition-all duration-150
          flex items-center gap-1.5 cursor-pointer
        "
      >
        {copied ? (
          <>
            <FiCheck className="w-3 h-3 text-emerald-400" />
            <span>Copied</span>
          </>
        ) : (
          <>
            <FiCopy className="w-3 h-3" />
            <span>Copy</span>
          </>
        )}
      </button>
      <pre className={`${className || ''} rounded-xl overflow-x-auto p-4 bg-zinc-900 border border-zinc-700 text-sm leading-relaxed`}>
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}
