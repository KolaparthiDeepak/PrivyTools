import { motion } from 'framer-motion';

export function ScanBeamAnim({
  reduced,
  children,
}: {
  reduced?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative h-40 overflow-hidden rounded-md border border-border">
      <div className="absolute inset-0">{children}</div>
      {!reduced && (
        <motion.div
          className="absolute inset-x-0 h-1/3 bg-[linear-gradient(180deg,transparent,hsl(var(--accent-ai)/0.28),transparent)]"
          animate={{ top: ['-33%', '100%'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
    </div>
  );
}
export default ScanBeamAnim;
