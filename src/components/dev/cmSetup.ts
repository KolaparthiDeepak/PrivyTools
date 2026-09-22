// Dynamically imported — keeps CodeMirror out of the app bundle and out of jsdom.
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, placeholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';

export type EditorLanguage = 'json' | 'yaml' | 'text';

// Colours come from tokens.css so they switch with the light/dark theme.
const syntaxStyle = HighlightStyle.define([
  { tag: [t.propertyName, t.definition(t.propertyName)], color: 'hsl(var(--syn-key))' },
  { tag: [t.string, t.special(t.string)], color: 'hsl(var(--syn-string))' },
  { tag: t.number, color: 'hsl(var(--syn-number))' },
  { tag: [t.bool, t.null, t.atom, t.keyword], color: 'hsl(var(--syn-atom))' },
  { tag: [t.comment, t.meta, t.punctuation, t.bracket, t.separator], color: 'var(--text-dim)' },
  { tag: t.invalid, color: 'hsl(var(--danger))' },
]);

const langExt = (l: EditorLanguage): Extension[] =>
  l === 'json' ? [json()] : l === 'yaml' ? [yaml()] : [];

export function createEditor(opts: {
  parent: HTMLElement;
  doc: string;
  language: EditorLanguage;
  readOnly: boolean;
  wrap?: boolean;
  placeholderText?: string;
  label: string;
  onChange: (v: string) => void;
}): EditorView {
  const state = EditorState.create({
    doc: opts.doc,
    extensions: [
      lineNumbers(),
      history(),
      bracketMatching(),
      syntaxHighlighting(syntaxStyle),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.editable.of(!opts.readOnly),
      EditorState.readOnly.of(opts.readOnly),
      EditorView.contentAttributes.of({ 'aria-label': opts.label }),
      EditorView.theme({
        '&': { fontFamily: 'var(--font-mono, monospace)', fontSize: '13px', backgroundColor: 'transparent' },
        '.cm-content': { padding: '12px 0' },
        '.cm-gutters': { backgroundColor: 'transparent', border: 'none', color: 'var(--text-dim)' },
        // CodeMirror's defaults are light-blue; use the app's neutral tokens so both themes match.
        '&.cm-focused': { outline: 'none' },
        '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
          backgroundColor: 'var(--border-hi)',
          outline: 'none',
        },
        '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--text)' },
        '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
          { backgroundColor: 'var(--border-hi)' },
      }),
      opts.wrap ? EditorView.lineWrapping : [],
      opts.placeholderText ? placeholder(opts.placeholderText) : [],
      ...langExt(opts.language),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) opts.onChange(u.state.doc.toString());
      }),
    ],
  });
  return new EditorView({ state, parent: opts.parent });
}
