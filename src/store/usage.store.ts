import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UsageState {
  counts: Record<string, number>;
  increment: (toolId: string) => void;
  clear: () => void;
}

export const useUsage = create<UsageState>()(
  persist(
    (set) => ({
      counts: {},
      increment: (toolId) =>
        set((s) => ({ counts: { ...s.counts, [toolId]: (s.counts[toolId] ?? 0) + 1 } })),
      clear: () => set({ counts: {} }),
    }),
    { name: 'privytools:usage' },
  ),
);
