import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Module flag: the opening plays once per full page load, not on every route change.
let played = false;

const DOTS = Array.from({ length: 18 }, (_, i) => i);

export function SplashScreen() {
  const reduced = useReducedMotion();
  const onHome = useLocation().pathname === '/';
  const [show, setShow] = useState(() => !played && !reduced && onHome);

  useEffect(() => {
    if (!show) return;
    played = true;
    const t = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[100] grid place-items-center bg-bg"
          style={{ perspective: 1200 }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.12, filter: 'blur(6px)' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="relative grid place-items-center"
            initial={{ rotateX: 55, scale: 0.35, opacity: 0 }}
            animate={{ rotateX: 0, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 90, damping: 16, delay: 0.05 }}
          >
            {/* expanding concentric rings */}
            {[0, 1, 2].map((r) => (
              <motion.span
                key={r}
                className="absolute rounded-full border border-[hsl(var(--accent-privacy)/0.35)]"
                initial={{ width: 96, height: 96, opacity: 0 }}
                animate={{ width: 96 + r * 150, height: 96 + r * 150, opacity: [0, 0.5, 0] }}
                transition={{ duration: 1.6, delay: 0.2 + r * 0.18, ease: 'easeOut' }}
              />
            ))}

            {/* drifting particles */}
            {DOTS.map((i) => {
              const a = (i / DOTS.length) * Math.PI * 2;
              return (
                <motion.span
                  key={i}
                  className="absolute size-1.5 rounded-full bg-[hsl(var(--accent-privacy))]"
                  initial={{ x: 0, y: 0, opacity: 0 }}
                  animate={{
                    x: Math.cos(a) * (70 + (i % 3) * 26),
                    y: Math.sin(a) * (70 + (i % 3) * 26),
                    opacity: [0, 0.9, 0],
                  }}
                  transition={{ duration: 1.5, delay: 0.35 + i * 0.02, ease: 'easeOut' }}
                />
              );
            })}

            {/* core */}
            <motion.span
              className="grid size-16 place-items-center rounded-full border border-[hsl(var(--accent-privacy)/0.5)] text-[hsl(var(--accent-privacy))]"
              animate={{
                boxShadow: [
                  '0 0 0 0 hsl(var(--accent-privacy)/0.0)',
                  '0 0 0 14px hsl(var(--accent-privacy)/0.08)',
                  '0 0 0 0 hsl(var(--accent-privacy)/0.0)',
                ],
              }}
              transition={{ duration: 1.6, repeat: Infinity }}
            >
              <Lock className="size-6" />
            </motion.span>
          </motion.div>

          <motion.p
            className="absolute bottom-[32%] font-mono text-[11px] uppercase tracking-[0.4em] text-dim"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            PrivyTools
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
