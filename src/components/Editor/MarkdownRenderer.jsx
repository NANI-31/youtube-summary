import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import CodeBlock from './CodeBlock.jsx';
import YoutubeThumbnail from '../YouTube/YoutubeThumbnail.jsx';
import { extractYouTubeVideoId } from '../../utils/youtube.js';

/**
 * Renders Markdown content with:
 *  - GitHub-flavored Markdown (tables, task lists, strikethrough)
 *  - Syntax-highlighted code blocks with copy button
 *  - YouTube URLs replaced by clickable thumbnails
 */
export default function MarkdownRenderer({ content }) {
  return (
    <div
      style={{
        fontSize: 'var(--app-font-preview-size, 16px)',
        color: 'var(--app-preview-text, #ffffff)',
      }}
      className="prose prose-invert prose-zinc max-w-none
      prose-headings:font-bold prose-headings:text-(--app-preview-heading,#93c5fd)
      prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-6 prose-h1:border-b prose-h1:border-(--app-preview-hr-border,#3f3f46) prose-h1:pb-2
      prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-5
      prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4
      prose-p:text-(--app-preview-text,#ffffff) prose-p:leading-relaxed prose-p:my-3
      prose-a:text-(--app-preview-link,var(--app-accent-hover,#60a5fa)) prose-a:no-underline hover:prose-a:underline
      prose-strong:text-(--app-preview-bold,#ffffff)
      prose-em:text-(--app-preview-italic,#e4e4e7)
      prose-code:text-(--app-preview-code,#34d399) prose-code:bg-(--app-preview-code-bg,rgba(39,39,42,0.6)) prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
      prose-pre:p-0 prose-pre:bg-transparent prose-pre:border-0
      prose-blockquote:border-l-4 prose-blockquote:border-(--app-preview-blockquote-border,#3b82f6) prose-blockquote:pl-4 prose-blockquote:text-(--app-preview-blockquote-text,#a1a1aa) prose-blockquote:italic
      prose-ul:text-(--app-preview-text,#ffffff) prose-ol:text-(--app-preview-text,#ffffff)
      prose-li:my-1 prose-li:text-(--app-preview-text,#ffffff)
      prose-table:border-collapse prose-table:w-full
      prose-th:bg-(--app-preview-table-header-bg,#27272a) prose-th:text-(--app-preview-text,#ffffff) prose-th:px-3 prose-th:py-2 prose-th:border prose-th:border-(--app-preview-table-border,#3f3f46)
      prose-td:text-(--app-preview-text,#ffffff) prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-(--app-preview-table-border,#3f3f46)
      prose-hr:border-(--app-preview-hr-border,#3f3f46)
      prose-img:rounded-xl prose-img:shadow-lg
    ">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Replace code blocks with our custom CodeBlock (with copy button)
          pre({ children }) {
            return <>{children}</>;
          },
          code({ inline, className, children, ...props }) {
            if (inline) {
              return <code className={className} {...props}>{children}</code>;
            }
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },

          // Intercept <a> tags — if YouTube URL, render thumbnail instead
          a({ href, children, ...props }) {
            const videoId = extractYouTubeVideoId(href);
            if (videoId) {
              return (
                <span className="block my-4">
                  <YoutubeThumbnail videoId={videoId} title={String(children)} />
                </span>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
          // Tables get a wrapper for horizontal scroll on mobile
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto my-4">
                <table {...props}>{children}</table>
              </div>
            );
          },
          // Task list checkboxes
          input({ type, checked, ...props }) {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 accent-blue-500"
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
