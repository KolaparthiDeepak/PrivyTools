import { motion } from 'framer-motion';

const DOTS = Array.from({ length: 14 }, (_, i) => i);

export function ParticlesAnim({ reduced }: { reduced?: boolean }) {
  return (
    <div className="relative grid h-32 place-items-center">
      {DOTS.map((i) => {
        const angle = (i / DOTS.length) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute size-1.5 rounded-full bg-[hsl(var(--accent-privacy))]"
            initial={{ x: 0, y: 0, opacity: 0.9 }}
            animate={
              reduced
                ? { opacity: 0.4 }
                : { x: Math.cos(angle) * 46, y: Math.sin(angle) * 46, opacity: [0.9, 0] }
            }
            transition={{ duration: 1.8, repeat: reduced ? 0 : Infinity, delay: i * 0.05 }}
          />
        );
      })}
    </div>
  );
}
export default ParticlesAnim;
