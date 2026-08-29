import { motion } from 'framer-motion';

export function PixelGridAnim({ reduced }: { reduced?: boolean }) {
  return (
    <div className="mx-auto grid h-32 w-32 grid-cols-8 gap-0.5">
      {Array.from({ length: 64 }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-[1px] bg-accent/60"
          animate={reduced ? { opacity: 0.5 } : { opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 1.6, repeat: reduced ? 0 : Infinity, delay: (i % 8) * 0.06 + Math.floor(i / 8) * 0.04 }}
        />
      ))}
    </div>
  );
}
export default PixelGridAnim;
