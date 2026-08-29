import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import { CATEGORIES, type Tool } from '../../tools/registry';
import { useFavorites } from '../../hooks/useFavorites';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Kbd } from '../ui';
import { cn } from '../../lib/cn';

export function ToolCard({ tool }: { tool: Tool }) {
  const { isFavorite, toggle } = useFavorites();
  const reduced = useReducedMotion();
  const fav = isFavorite(tool.id);
  const Icon = tool.icon;
  return (
    <motion.div
      data-accent={CATEGORIES[tool.category].accent}
      whileHover={reduced ? undefined : { y: -2 }}
      className="group relative flex min-h-32 flex-col gap-2.5 rounded-xl border border-border bg-surface-hi p-4 transition-colors hover:border-border-hi"
    >
      <button
        type="button"
        aria-label={fav ? `Unfavorite ${tool.name}` : `Favorite ${tool.name}`}
        aria-pressed={fav}
        onClick={() => toggle(tool.id)}
        className={cn('absolute right-3 top-3 z-10', fav ? 'text-accent' : 'text-dim/40 hover:text-dim')}
      >
        <Star className={cn('size-3.5', fav && 'fill-current')} />
      </button>
      <span className="grid size-8 place-items-center rounded-lg border border-border bg-sunken text-accent">
        <Icon className="size-4" />
      </span>
      <Link to={tool.route} className="font-medium text-text after:absolute after:inset-0">
        {tool.name}
      </Link>
      <span className="text-xs text-dim">{tool.description}</span>
      <div className="mt-auto flex items-center gap-2 font-mono text-[11px] text-dim/70">
        <span className="flex items-center gap-1 transition-all group-hover:gap-2 group-hover:text-dim">
          Open <ArrowRight className="size-3" />
        </span>
        {tool.shortcut && <Kbd className="ml-auto">{tool.shortcut}</Kbd>}
      </div>
    </motion.div>
  );
}
