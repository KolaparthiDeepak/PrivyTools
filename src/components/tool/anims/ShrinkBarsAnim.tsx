import { motion } from 'framer-motion';

const BARS = [1, 0.72, 0.5, 0.32];

export function ShrinkBarsAnim({ reduced }: { reduced?: boolean }) {
  return (
    <div className="flex h-32 flex-col items-center justify-center gap-2">
      {BARS.map((base, i) => (
        <motion.div
          key={i}
          className="h-3 rounded bg-accent/70"
          initial={{ width: 180 }}
          animate={reduced ? { width: 180 * base } : { width: [180, 180 * base] }}
          transition={{ duration: 1.4, repeat: reduced ? 0 : Infinity, repeatType: 'reverse', delay: i * 0.1 }}
        />
      ))}
    </div>
  );
}
export default ShrinkBarsAnim;
