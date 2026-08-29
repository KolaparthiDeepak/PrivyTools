import { motion } from 'framer-motion';
import { Lock, LockOpen } from 'lucide-react';

export function LockAnim({ mode, reduced }: { mode: 'add' | 'remove'; reduced?: boolean }) {
  const Icon = mode === 'add' ? Lock : LockOpen;
  return (
    <div className="grid h-32 place-items-center">
      <motion.span
        className="grid size-16 place-items-center rounded-2xl border border-border-hi bg-raise text-accent"
        initial={reduced ? false : { rotate: -8, scale: 0.9 }}
        animate={reduced ? {} : { rotate: [-8, 6, 0], scale: [0.9, 1.05, 1] }}
        transition={{ duration: 1.1, repeat: reduced ? 0 : Infinity, repeatDelay: 0.6 }}
      >
        <Icon className="size-7" />
      </motion.span>
    </div>
  );
}
export default LockAnim;
