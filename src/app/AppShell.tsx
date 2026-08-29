import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from './ThemeProvider';
import { routeTransition } from '../design/motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { CommandPalette } from './CommandPalette';
import { useCommandPalette } from '../hooks/useCommandPalette';
import { PrivacyPill } from './PrivacyPill';
import { DragToAction } from './DragToAction';

export function AppShell() {
  const loc = useLocation();
  const reduced = useReducedMotion();
  const palette = useCommandPalette();
  return (
    <ThemeProvider>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:p-3"
      >
        Skip to content
      </a>
      <div className="grid h-full grid-cols-1 lg:grid-cols-[240px_1fr]">
        <aside className="hidden overflow-y-auto border-r border-border lg:block">
          <Sidebar />
        </aside>
        <div className="flex min-w-0 flex-col">
          <header className="h-14 shrink-0 border-b border-border">
            <Topbar onOpenPalette={() => palette.setOpen(true)} />
          </header>
          <div id="content" className="min-h-0 flex-1 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={loc.pathname}
                variants={reduced ? undefined : routeTransition}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
          <nav className="shrink-0 border-t border-border lg:hidden">
            <MobileNav />
          </nav>
        </div>
      </div>
      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
      <PrivacyPill />
      <DragToAction />
    </ThemeProvider>
  );
}
