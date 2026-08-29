import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { TOOLS } from '../tools/registry';
import { isAccepted } from '../lib/fileValidation';
import { useHandoff } from '../store/handoff.store';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { Button } from '../components/ui';

export function DragToAction() {
  const navigate = useNavigate();
  const setPendingFile = useHandoff((s) => s.setPendingFile);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);
  const [dragType, setDragType] = useState<string>('');
  const [dropped, setDropped] = useState<File | null>(null);

  useEffect(() => {
    const hasFiles = (dt: DataTransfer | null) =>
      !!dt && Array.from(dt.types ?? []).includes('Files');

    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e.dataTransfer)) return;
      e.preventDefault();
      setDragType(e.dataTransfer?.items?.[0]?.type ?? '');
      setActive(true);
    };
    const onOver = (e: DragEvent) => {
      if (hasFiles(e.dataTransfer)) e.preventDefault();
    };
    const onLeave = (e: DragEvent) => {
      if (e.relatedTarget === null) setActive(false);
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e.dataTransfer)) return;
      e.preventDefault();
      setDropped(e.dataTransfer?.files?.[0] ?? null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') reset();
    };

    window.addEventListener('dragenter', onEnter);
    window.addEventListener('dragover', onOver);
    window.addEventListener('dragleave', onLeave);
    window.addEventListener('drop', onDrop);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('dragenter', onEnter);
      window.removeEventListener('dragover', onOver);
      window.removeEventListener('dragleave', onLeave);
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const reset = () => {
    setActive(false);
    setDropped(null);
  };

  const matches = TOOLS.filter((t) => {
    if (t.id === 'privacy-center') return false;
    if (!dragType) return true;
    return isAccepted({ type: dragType, name: '' }, t.accept);
  });

  const pick = (route: string) => {
    if (dropped) setPendingFile(dropped);
    reset();
    navigate(route);
  };

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.15 }}
          className="fixed inset-0 z-[60] grid place-items-center bg-bg/80 p-6 text-center backdrop-blur"
          onClick={reset}
        >
          <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center gap-5">
            <h2 className="text-xl font-semibold text-text">
              What would you like to do with this file?
            </h2>
            <div className="flex flex-wrap justify-center gap-2.5">
              {matches.map((t) => (
                <Button key={t.id} onClick={() => pick(t.route)}>
                  {t.name}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
