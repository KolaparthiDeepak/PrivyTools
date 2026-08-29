import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'system' | 'light' | 'dark';

interface PrefsState {
  favorites: string[];
  theme: Theme;
  telemetry: boolean;
  sidebarCollapsed: boolean;
  privacyMode: boolean;
  toggleFavorite: (id: string) => void;
  setTheme: (t: Theme) => void;
  setTelemetry: (b: boolean) => void;
  toggleSidebar: () => void;
  setPrivacyMode: (b: boolean) => void;
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      favorites: [],
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
      setTheme: (theme) => set({ theme }),
      setTelemetry: (telemetry) => set({ telemetry }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setPrivacyMode: (privacyMode) => set({ privacyMode }),
    }),
    {
      name: 'privytools:prefs',
      partialize: (s) => ({
        favorites: s.favorites,
        theme: s.theme,
        telemetry: s.telemetry,
        sidebarCollapsed: s.sidebarCollapsed,
        privacyMode: s.privacyMode,
      }),
    },
  ),
);
