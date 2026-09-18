import { useMemo, useCallback, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { Prec } from '@codemirror/state';

import { useSettings } from '../../hooks/useSettings.js';
import { DEFAULT_EDITOR_COLORS } from '../../data/settings.js';

const TOOLBAR_ITEMS = [
  { label: 'B', title: 'Bold', before: '**', after: '**' },
  { label: 'I', title: 'Italic', before: '_', after: '_' },
  { label: 'H1', title: 'Heading 1', before: '# ' },
  { label: 'H2', title: 'Heading 2', before: '## ' },
  { label: 'H3', title: 'Heading 3', before: '### ' },
  { label: '`', title: 'Inline code', before: '`', after: '`' },
  { label: '```', title: 'Code block', before: '```\n', after: '\n```' },
  { label: '—', title: 'Divider' },
  { label: '> ', title: 'Blockquote', before: '> ' },
  { label: '- ', title: 'List', before: '- ' },
  { label: '1. ', title: 'Ordered list', before: '1. ' },
  { label: '[ ]', title: 'Task list', before: '- [ ] ' },
];

/**
 * Dynamic dark theme styling for CodeMirror based on customizable user colors
 */
function createEditorTheme(c = DEFAULT_EDITOR_COLORS) {
  const colors = { ...DEFAULT_EDITOR_COLORS, ...(c || {}) };
  return EditorView.theme(
    {
      '&': {
        height: '100%',
        backgroundColor: `var(--app-editor-bg, ${colors.background})`,
        color: `var(--app-editor-text, ${colors.text})`,
        fontSize: 'var(--app-font-editor-size, 15px)',
        lineHeight: 'var(--app-editor-line-height, 1.7)',
        fontFamily: 'var(--app-font-family-editor, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace)',
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily: 'inherit',
        lineHeight: 'inherit',
        scrollbarWidth: 'thin',
        scrollbarColor: '#3f3f46 transparent',
      },
      '.cm-content': {
        padding: '1rem 1.25rem 2.5rem 1.25rem',
        caretColor: `var(--app-editor-cursor, ${colors.cursor})`,
        lineHeight: 'inherit',
        color: `var(--app-editor-text, ${colors.text})`,
      },
      '.cm-line': {
        lineHeight: 'inherit',
        padding: '0 4px',
        color: `var(--app-editor-text, ${colors.text})`,
      },
      '.cm-gutters': {
        backgroundColor: `var(--app-editor-gutter-bg, ${colors.gutterBg || colors.background})`,
        color: `var(--app-editor-gutter-text, ${colors.gutterText || '#52525b'})`,
        borderRight: `1px solid var(--app-editor-gutter-border, ${colors.gutterBorder || '#27272a'})`,
        userSelect: 'none',
      },
      '.cm-gutterElement': {
        lineHeight: 'inherit',
      },
      '.cm-lineNumbers .cm-gutterElement': {
        padding: '0 8px 0 12px',
        minWidth: '32px',
        textAlign: 'right',
        lineHeight: 'inherit',
        color: `var(--app-editor-gutter-text, ${colors.gutterText || '#52525b'})`,
      },
      '.cm-foldGutter .cm-gutterElement': {
        lineHeight: 'inherit',
        textAlign: 'center',
        color: `var(--app-editor-gutter-text, ${colors.gutterText || '#52525b'})`,
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'transparent',
        color: `var(--app-editor-link, ${colors.link})`,
      },
      '.cm-activeLine': {
        backgroundColor: `var(--app-editor-active-line-bg, ${colors.activeLineBg || 'rgba(39, 39, 42, 0.4)'})`,
      },
      '.cm-selectionBackground, ::selection': {
        backgroundColor: `var(--app-editor-selection-bg, ${colors.selectionBg || 'rgba(37, 99, 235, 0.28)'}) !important`,
      },
      '&.cm-focused .cm-cursor': {
        borderLeftColor: `var(--app-editor-cursor, ${colors.cursor || '#60a5fa'})`,
        borderLeftWidth: '2px',
      },
      '&.cm-focused': {
        outline: 'none',
      },
    },
    { dark: true }
  );
}

/**
 * Dynamic syntax highlighting styles based on customizable user colors
 */
function createEditorHighlightStyle(c = DEFAULT_EDITOR_COLORS) {
  const colors = { ...DEFAULT_EDITOR_COLORS, ...(c || {}) };
  return HighlightStyle.define([
    // Headings
    { tag: tags.heading1, fontWeight: '700', color: `var(--app-editor-heading, ${colors.heading || '#60a5fa'})` },
    { tag: tags.heading2, fontWeight: '700', color: `var(--app-editor-heading, ${colors.heading || '#93c5fd'})` },
    { tag: tags.heading3, fontWeight: '600', color: `var(--app-editor-heading, ${colors.heading || '#bfdbfe'})` },
    { tag: [tags.heading4, tags.heading5, tags.heading6], fontWeight: '600', color: `var(--app-editor-heading, ${colors.heading || '#dbeafe'})` },

    // Normal text & markdown content
    { tag: tags.content, color: `var(--app-editor-text, ${colors.text || '#ffffff'})` },
    { tag: tags.strong, fontWeight: 'bold', color: `var(--app-editor-bold, ${colors.bold || colors.text || '#ffffff'})` },
    { tag: tags.emphasis, fontStyle: 'italic', color: `var(--app-editor-italic, ${colors.italic || '#e4e4e7'})` },
    { tag: tags.strikethrough, textDecoration: 'line-through', color: '#71717a' },

    // Programming & formatting syntax
    { tag: tags.keyword, color: `var(--app-editor-keyword, ${colors.keyword || '#c084fc'})` },
    { tag: [tags.atom, tags.bool, tags.contentSeparator], color: `var(--app-editor-number, ${colors.number || '#38bdf8'})` },
    { tag: [tags.literal, tags.inserted], color: `var(--app-editor-code, ${colors.code || '#4ade80'})` },
    { tag: [tags.string, tags.deleted], color: `var(--app-editor-string, ${colors.string || '#a3e635'})` },
    { tag: [tags.regexp, tags.escape, tags.special(tags.string)], color: '#f472b6' },
    { tag: tags.definition(tags.variableName), color: `var(--app-editor-number, ${colors.number || '#38bdf8'})` },
    { tag: tags.local(tags.variableName), color: `var(--app-editor-heading, ${colors.heading || '#93c5fd'})` },
    { tag: [tags.typeName, tags.namespace], color: '#2dd4bf' },
    { tag: tags.className, color: '#facc15' },
    { tag: [tags.special(tags.variableName), tags.macroName], color: `var(--app-editor-number, ${colors.number || '#38bdf8'})` },
    { tag: tags.definition(tags.propertyName), color: `var(--app-editor-link, ${colors.link || '#60a5fa'})` },
    { tag: tags.comment, color: `var(--app-editor-comment, ${colors.comment || '#71717a'})`, fontStyle: 'italic' },
    { tag: tags.meta, color: '#fb923c' },
    { tag: tags.monospace, color: `var(--app-editor-code, ${colors.code || '#34d399'})` },

    // Links & URLs (placed last to take highest precedence)
    {
      tag: [tags.link, tags.url],
      color: `var(--app-editor-link, ${colors.link || '#60a5fa'})`,
      textDecoration: 'underline',
    },
    { tag: tags.labelName, color: `var(--app-editor-link, ${colors.link || '#60a5fa'})` },
  ]);
}

/**
 * Syntax-highlighted Markdown editor with line numbers and CodeMirror engine
 */
export default function MarkdownEditor({ value, onChange }) {
  const editorViewRef = useRef(null);
  const { editorColors } = useSettings();

  const editorTheme = useMemo(() => createEditorTheme(editorColors), [editorColors]);
  const highlightStyle = useMemo(() => createEditorHighlightStyle(editorColors), [editorColors]);

  const extensions = useMemo(
    () => [
      markdown({ codeLanguages: languages }),
      Prec.highest(syntaxHighlighting(highlightStyle, { fallback: false })),
      EditorView.lineWrapping,
      editorTheme,
    ],
    [highlightStyle, editorTheme]
  );

  const insert = useCallback(
    (before, after = '') => {
      const view = editorViewRef.current;
      if (view) {
        const { state } = view;
        const main = state.selection.main;
        const selected = state.sliceDoc(main.from, main.to);
        const insertText = before + selected + after;
        view.dispatch({
          changes: { from: main.from, to: main.to, insert: insertText },
          selection: {
            anchor: main.from + before.length,
            head: main.from + before.length + selected.length,
          },
          scrollIntoView: true,
        });
        view.focus();
      } else {
        onChange(value + before + after);
      }
    },
    [value, onChange]
  );

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: editorColors?.background || '#09090b' }}
    >
      {/* CodeMirror syntax highlighted editor */}
      <div className="flex-1 overflow-hidden min-h-0">
        <CodeMirror
          value={value}
          height="100%"
          className="h-full"
          theme="none"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: false,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
          extensions={extensions}
          onChange={onChange}
          onCreateEditor={(view) => {
            editorViewRef.current = view;
          }}
        />
      </div>

      {/* Toolbar — docked cleanly at the bottom */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-t border-zinc-800 bg-zinc-900/70 flex-wrap shrink-0 select-none z-10">
        {TOOLBAR_ITEMS.map((item, idx) =>
          item.label === '—' ? (
            <div key={idx} className="w-px h-4 bg-zinc-700 mx-1" />
          ) : (
            <button
              key={idx}
              title={item.title}
              onMouseDown={(e) => {
                e.preventDefault();
                insert(item.before, item.after || '');
              }}
              className="px-2 py-0.5 text-xs font-mono text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          )
        )}
      </div>
    </div>
  );
}
