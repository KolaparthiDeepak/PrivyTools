import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from './ThemeProvider';
import { routeTransition } from '../design/motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

export function AppShell() {
  const loc = useLocation();
  const reduced = useReducedMotion();
  return (
    <ThemeProvider>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:p-3"
      >
        Skip to content
      </a>
      <div className="grid h-full grid-cols-1 lg:grid-cols-[240px_1fr]">
        <aside id="sidebar-slot" className="hidden border-r border-border lg:block" />
        <div className="flex min-w-0 flex-col">
          <header id="topbar-slot" className="h-14 border-b border-border" />
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
          <nav id="mobilenav-slot" className="border-t border-border lg:hidden" />
        </div>
      </div>
    </ThemeProvider>
  );
}
