import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES, type Tool } from '../../tools/registry';

export function ToolHeader({
  tool,
  title,
  subtitle,
}: {
  tool: Tool;
  title: string;
  subtitle?: string;
}) {
  const cat = CATEGORIES[tool.category];
  useEffect(() => {
    document.title = `${tool.name} - PrivyTools`;
  }, [tool.name]);
  return (
    <div data-accent={cat.accent} className="flex flex-col gap-3">
      <nav className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-widest text-dim/70">
        <Link to="/" className="hover:text-text">
          Home
        </Link>
        <span>/</span>
        <span>{cat.label}</span>
        <span>/</span>
        <span className="text-dim">{tool.name}</span>
      </nav>
      <h1
        className="text-3xl font-semibold text-text sm:text-4xl"
        style={{ letterSpacing: 'var(--tracking-display)' }}
      >
        {title}
      </h1>
      {subtitle && <p className="max-w-prose text-sm text-dim">{subtitle}</p>}
    </div>
  );
}
