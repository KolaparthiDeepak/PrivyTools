import { NavLink } from 'react-router-dom';
import { Home, Star, Clock, PanelLeftClose, PanelLeftOpen, Shield } from 'lucide-react';
import { TOOLS, getTool, toolsByCategory } from '../tools/registry';
import { usePrefs } from '../store/prefs.store';
import { cn } from '../lib/cn';

const NAV_SECTIONS = [
  { label: 'PDF', tools: () => toolsByCategory('pdf') },
  { label: 'Image', tools: () => [...toolsByCategory('image'), ...toolsByCategory('ai')] },
  { label: 'Privacy', tools: () => toolsByCategory('privacy') },
];

function Item({ to, label, Icon, collapsed }: { to: string; label: string; Icon: typeof Home; collapsed: boolean }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] text-dim',
          'hover:text-text',
          isActive && 'bg-surface-hi text-text shadow-[inset_0_0_0_1px_var(--border)]',
        )
      }
      title={collapsed ? label : undefined}
    >
      <Icon className="size-4 shrink-0 opacity-80" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

export function Sidebar() {
  const collapsed = usePrefs((s) => s.sidebarCollapsed);
  const toggle = usePrefs((s) => s.toggleSidebar);
  const favorites = usePrefs((s) => s.favorites);
  const recent = usePrefs((s) => s.recent);

  return (
    <div className="flex h-full flex-col gap-5 p-3.5">
      <div className="flex items-center justify-between px-1.5">
        <div className="flex items-center gap-2.5 font-semibold">
          <span className="grid size-6 place-items-center rounded-md border border-border-hi bg-raise text-accent">
            <Shield className="size-3.5" />
          </span>
          {!collapsed && 'PrivyTools'}
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="text-dim hover:text-text"
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      <nav className="flex flex-col gap-1">
        <Item to="/" label="Home" Icon={Home} collapsed={collapsed} />
      </nav>

      {NAV_SECTIONS.map((sec) => (
        <nav key={sec.label} className="flex flex-col gap-0.5">
          {!collapsed && (
            <span className="px-2.5 pb-1 pt-2 font-mono text-[10px] uppercase tracking-widest text-dim/70">
              {sec.label}
            </span>
          )}
          {sec.tools().map((t) => (
            <Item key={t.id} to={t.route} label={t.name} Icon={t.icon} collapsed={collapsed} />
          ))}
        </nav>
      ))}

      {favorites.length > 0 && (
        <nav className="flex flex-col gap-0.5">
          {!collapsed && (
            <span className="flex items-center gap-1.5 px-2.5 pb-1 pt-2 font-mono text-[10px] uppercase tracking-widest text-dim/70">
              <Star className="size-3" /> Favorites
            </span>
          )}
          {favorites.map((id) => getTool(id)).filter(Boolean).map((t) => (
            <Item key={t!.id} to={t!.route} label={t!.name} Icon={t!.icon} collapsed={collapsed} />
          ))}
        </nav>
      )}

      {recent.length > 0 && (
        <nav className="mt-auto flex flex-col gap-0.5">
          {!collapsed && (
            <span className="flex items-center gap-1.5 px-2.5 pb-1 pt-2 font-mono text-[10px] uppercase tracking-widest text-dim/70">
              <Clock className="size-3" /> Recent
            </span>
          )}
          {recent.map((id) => getTool(id)).filter(Boolean).map((t) => (
            <Item key={t!.id} to={t!.route} label={t!.name} Icon={t!.icon} collapsed={collapsed} />
          ))}
        </nav>
      )}

      <p className="sr-only">{TOOLS.length} tools available</p>
    </div>
  );
}
