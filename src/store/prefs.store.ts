import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'system' | 'light' | 'dark';

interface PrefsState {
  favorites: string[];
  recent: string[];
  theme: Theme;
  telemetry: boolean;
  sidebarCollapsed: boolean;
  privacyMode: boolean;
  toggleFavorite: (id: string) => void;
  pushRecent: (id: string) => void;
  setTheme: (t: Theme) => void;
  setTelemetry: (b: boolean) => void;
  toggleSidebar: () => void;
  setPrivacyMode: (b: boolean) => void;
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      favorites: [],
      recent: [],
      theme: 'system',
      telemetry: false,
      sidebarCollapsed: false,
      privacyMode: true,
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((x) => x !== id)
            : [...s.favorites, id],
        })),
      pushRecent: (id) =>
        set((s) => ({ recent: [id, ...s.recent.filter((x) => x !== id)].slice(0, 5) })),
      setTheme: (theme) => set({ theme }),
      setTelemetry: (telemetry) => set({ telemetry }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setPrivacyMode: (privacyMode) => set({ privacyMode }),
    }),
    {
      name: 'privytools:prefs',
      partialize: (s) => ({
        favorites: s.favorites,
        recent: s.recent,
        theme: s.theme,
        telemetry: s.telemetry,
        sidebarCollapsed: s.sidebarCollapsed,
        privacyMode: s.privacyMode,
      }),
    },
  ),
);
