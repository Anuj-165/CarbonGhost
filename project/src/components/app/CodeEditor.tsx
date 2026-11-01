import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { RangeSetBuilder, StateField, type EditorState } from '@codemirror/state';
import { Decoration, EditorView, type DecorationSet } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

const editorTheme = EditorView.theme(
  {
    '&': { backgroundColor: 'transparent', color: '#E9EDE6', fontSize: '13px', height: '100%' },
    '&.cm-focused': { outline: 'none' },
    '.cm-scroller': { fontFamily: '"JetBrains Mono", ui-monospace, monospace', lineHeight: '1.75' },
    '.cm-content': { caretColor: '#C7F36B', padding: '14px 0' },
    '.cm-gutters': { backgroundColor: 'transparent', color: '#5E7266', border: 'none' },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 14px 0 16px', minWidth: '44px' },
    '.cm-activeLine': { backgroundColor: 'rgba(199, 243, 107, 0.035)' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#C7F36B' },
    '.cm-cursor': { borderLeftColor: '#C7F36B' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: 'rgba(199, 243, 107, 0.16) !important',
    },
    '.cm-diff-line': {
      backgroundColor: 'rgba(199, 243, 107, 0.07)',
      boxShadow: 'inset 2px 0 0 #C7F36B',
    },
  },
  { dark: true },
);

const highlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#C7F36B' },
  { tag: [t.string, t.special(t.string)], color: '#D8D2B0' },
  { tag: t.number, color: '#B3C2B7' },
  { tag: t.bool, color: '#B3C2B7' },
  { tag: t.comment, color: '#7A9083', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.definition(t.function(t.variableName))], color: '#F4F2E9' },
  { tag: t.propertyName, color: '#A9D3C0' },
  { tag: [t.punctuation, t.bracket, t.operator], color: '#8FA596' },
  { tag: t.variableName, color: '#E9EDE6' },
]);

const changedLineMark = Decoration.line({ class: 'cm-diff-line' });

function buildChangedLines(state: EditorState, lines: Set<number>): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (let n = 1; n <= state.doc.lines; n++) {
    if (!lines.has(n)) continue;
    const line = state.doc.line(n);
    builder.add(line.from, line.from, changedLineMark);
  }
  return builder.finish();
}

function changedLinesExtension(lines: Set<number>) {
  return StateField.define<DecorationSet>({
    create: (state) => buildChangedLines(state, lines),
    update: (value, transaction) => (transaction.docChanged ? buildChangedLines(transaction.state, lines) : value),
    provide: (field) => EditorView.decorations.from(field),
  });
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  changedLines?: Set<number>;
  label: string;
}

export default function CodeEditor({ value, onChange, changedLines, label }: CodeEditorProps) {
  const extensions = useMemo(
    () => [
      javascript(),
      editorTheme,
      syntaxHighlighting(highlightStyle),
      changedLinesExtension(changedLines ?? new Set<number>()),
    ],
    [changedLines],
  );

  return (
    <div aria-label={label} className="h-full">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        height="100%"
        minHeight="100%"
        theme="none"
        basicSetup={{
          foldGutter: false,
          dropCursor: false,
          autocompletion: false,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          lineNumbers: true,
        }}
      />
    </div>
  );
}
