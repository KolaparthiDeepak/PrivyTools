import { motion } from 'framer-motion';

export function StackAnim({ count, reduced }: { count: number; reduced?: boolean }) {
  const n = Math.min(Math.max(count, 2), 6);
  return (
    <div className="relative grid h-32 place-items-center">
      {Array.from({ length: n }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-20 w-16 rounded border border-border-hi bg-surface-hi"
          initial={reduced ? false : { x: (i - (n - 1) / 2) * 26, opacity: 0.5, rotate: (i - (n - 1) / 2) * 4 }}
          animate={reduced ? { x: (i - (n - 1) / 2) * 3 } : { x: (i - (n - 1) / 2) * 3, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.9, repeat: reduced ? 0 : Infinity, repeatType: 'reverse', delay: i * 0.08 }}
          style={{ zIndex: i }}
        />
      ))}
    </div>
  );
}
export default StackAnim;
