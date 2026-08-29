import type { Variants } from 'framer-motion';

export const fade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};
export const slideUp: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};
export const routeTransition: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};
export const springSoft = { type: 'spring', stiffness: 220, damping: 28 } as const;
export const stagger = (gap = 0.04): Variants => ({
  animate: { transition: { staggerChildren: gap } },
});
export const maybe = (v: Variants, reduced: boolean): Variants => (reduced ? fade : v);
