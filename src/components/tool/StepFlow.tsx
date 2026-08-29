import { AnimatePresence, motion } from 'framer-motion';
import { slideUp, maybe } from '../../design/motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type Step = 'select' | 'configure' | 'process' | 'result' | 'error';

export function StepFlow({
  step,
  views,
}: {
  step: Step;
  views: Record<Step, React.ReactNode>;
}) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        variants={maybe(slideUp, reduced)}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2 }}
      >
        {views[step]}
      </motion.div>
    </AnimatePresence>
  );
}
