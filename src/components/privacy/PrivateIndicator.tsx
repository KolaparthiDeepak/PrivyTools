import ParticlesAnim from '../tool/anims/ParticlesAnim';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export function PrivateIndicator() {
  const reduced = useReducedMotion();
  return (
    <div className="relative flex flex-col items-center gap-2 py-4 text-center">
      <div className="absolute inset-0 grid place-items-center opacity-60">
        <ParticlesAnim reduced={reduced} />
      </div>
      <span className="z-10 grid size-13 place-items-center rounded-full border border-[hsl(var(--accent-privacy)/0.4)] text-[hsl(var(--accent-privacy))] shadow-[0_0_0_6px_hsl(var(--accent-privacy)/0.06)]">
        <span className="size-2.5 rounded-full bg-current" />
      </span>
      <b className="z-10 font-mono tracking-[0.2em] text-xs">PRIVATE</b>
      <span className="z-10 max-w-xs text-xs text-dim">
        Your files remain on your device for local operations.
      </span>
    </div>
  );
}
