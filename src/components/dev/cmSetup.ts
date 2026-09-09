// Dynamically imported — keeps CodeMirror out of the app bundle and out of jsdom.
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, placeholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';

export type EditorLanguage = 'json' | 'yaml' | 'text';

const langExt = (l: EditorLanguage): Extension[] =>
  l === 'json' ? [json()] : l === 'yaml' ? [yaml()] : [];

export function createEditor(opts: {
  parent: HTMLElement;
  doc: string;
  language: EditorLanguage;
  readOnly: boolean;
  placeholderText?: string;
  onChange: (v: string) => void;
}): EditorView {
  const state = EditorState.create({
    doc: opts.doc,
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      bracketMatching(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.editable.of(!opts.readOnly),
      EditorState.readOnly.of(opts.readOnly),
      EditorView.theme({
        '&': { fontFamily: 'var(--font-mono, monospace)', fontSize: '13px', backgroundColor: 'transparent' },
        '.cm-content': { padding: '12px 0' },
        '.cm-gutters': { backgroundColor: 'transparent', border: 'none', color: 'var(--text-dim)' },
      }),
      opts.placeholderText ? placeholder(opts.placeholderText) : [],
      ...langExt(opts.language),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) opts.onChange(u.state.doc.toString());
      }),
    ],
  });
  return new EditorView({ state, parent: opts.parent });
}
