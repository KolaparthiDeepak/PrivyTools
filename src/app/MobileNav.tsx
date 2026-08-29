import { NavLink } from 'react-router-dom';
import { Home, FileText, Image, Lock } from 'lucide-react';
import { cn } from '../lib/cn';

const ITEMS = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/pdf/merge', label: 'PDF', Icon: FileText },
  { to: '/image/compress', label: 'Image', Icon: Image },
  { to: '/privacy', label: 'Privacy', Icon: Lock },
];

export function MobileNav() {
  return (
    <div className="flex h-full items-stretch justify-around bg-surface-hi">
      {ITEMS.map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          end={i.to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2 font-mono text-[9px] uppercase tracking-wider',
              isActive ? 'text-text' : 'text-dim/70',
            )
          }
        >
          <i.Icon className="size-[18px]" />
          {i.label}
        </NavLink>
      ))}
    </div>
  );
}
