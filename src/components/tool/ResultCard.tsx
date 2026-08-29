import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { FileResult } from '../../services/types';
import { formatBytes } from '../../lib/formatBytes';
import { formatPercent } from '../../lib/formatPercent';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { DownloadButton } from './DownloadButton';
import { ResetButton } from './ResetButton';

const RESERVED = new Set(['estimate', 'note']);

export function ResultCard({
  result,
  onReset,
  successVerb = 'All done.',
}: {
  result: FileResult;
  onReset: () => void;
  successVerb?: string;
}) {
  const reduced = useReducedMotion();
  const { originalBytes, outputBytes, meta } = result;
  const isEstimate = meta?.estimate === 1;
  const chips = Object.entries(meta ?? {}).filter(([k]) => !RESERVED.has(k));

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <motion.span
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="grid size-11 place-items-center rounded-full bg-[hsl(var(--accent-privacy)/0.14)] text-[hsl(var(--accent-privacy))]"
      >
        <Check className="size-5" />
      </motion.span>
      <p className="text-base font-semibold text-text">{successVerb}</p>
      <p className="font-mono text-xs text-dim">{result.filename}</p>

      {outputBytes != null && (
        <p className="font-mono text-sm text-text">
          {formatBytes(originalBytes)} \u2192{' '}
          {isEstimate ? `\u2248 ${formatBytes(outputBytes)} (estimated)` : formatBytes(outputBytes)}
          {!isEstimate && outputBytes < originalBytes && (
            <span className="text-[hsl(var(--accent-image))]">
              {' '}\u00b7 saved {formatBytes(originalBytes - outputBytes)} ({formatPercent(originalBytes, outputBytes)})
            </span>
          )}
        </p>
      )}

      {chips.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 font-mono text-[11px] text-dim">
          {chips.map(([k, v]) => (
            <span key={k} className="rounded-full border border-border px-2 py-0.5">
              {v}
            </span>
          ))}
        </div>
      )}

      <div className="mt-1 flex flex-wrap justify-center gap-2.5">
        <DownloadButton blob={result.blob} filename={result.filename} />
        <ResetButton onClick={onReset} />
      </div>

      <p className="text-[11px] text-dim/70">
        {result.demo
          ? 'This was a preview - no real transformation was applied.'
          : 'Your file was processed on your device.'}
      </p>
    </div>
  );
}
