import { useEffect, useId, useRef, useState } from 'react';
import type { EditorView } from '@codemirror/view';
import type { EditorLanguage } from './cmSetup';
import { cn } from '../../lib/cn';

interface CodeEditorProps {
  value: string;
  onChange?: (v: string) => void;
  language?: EditorLanguage;
  readOnly?: boolean;
  placeholder?: string;
  label: string;
  className?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = 'text',
  readOnly = false,
  placeholder,
  label,
  className,
}: CodeEditorProps) {
  const id = useId();
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const cb = useRef(onChange);
  cb.current = onChange;
  const [cmReady, setCmReady] = useState(false);

  // Mount CodeMirror in a real browser only. jsdom defines createRange in this
  // repo's vitest setup, so a DOM-API probe alone would let CM try to mount and
  // spew act() warnings — gate on the test MODE too. cmSetup is dynamically
  // imported so CodeMirror never enters the app bundle or the jsdom run.
  useEffect(() => {
    if (import.meta.env.MODE === 'test') return; // unit tests: textarea only
    if (typeof document === 'undefined' || !host.current) return;
    if (typeof document.createRange !== 'function') return;
    let disposed = false;
    import('./cmSetup')
      .then(({ createEditor }) => {
        if (disposed || !host.current) return;
        view.current = createEditor({
          parent: host.current,
          doc: value,
          language,
          readOnly,
          placeholderText: placeholder,
          label,
          onChange: (v) => cb.current?.(v),
        });
        setCmReady(true);
      })
      .catch(() => {
        /* fall back to textarea */
      });
    return () => {
      disposed = true;
      view.current?.destroy();
      view.current = null;
    };
    // language/readOnly/placeholder are fixed per tool instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep CodeMirror's doc in sync when `value` changes from outside (swap, reset).
  useEffect(() => {
    const v = view.current;
    if (!v) return;
    if (v.state.doc.toString() !== value) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
    }
  }, [value]);

  return (
    <div className={cn('relative min-h-[40vh] rounded-md border border-border bg-sunken px-3', className)}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <div ref={host} hidden={!cmReady} aria-label={label} className="h-full w-full" />
      <textarea
        id={id}
        hidden={cmReady}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        spellCheck={false}
        className="h-full min-h-[40vh] w-full resize-none bg-transparent py-3 font-mono text-[13px] text-text outline-none placeholder:text-dim"
      />
    </div>
  );
}

export type { CodeEditorProps };
