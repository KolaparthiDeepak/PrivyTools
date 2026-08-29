import { create } from 'zustand';

interface HandoffState {
  pendingFile: File | null;
  setPendingFile: (f: File | null) => void;
  consume: () => File | null;
}

export const useHandoff = create<HandoffState>((set, get) => ({
  pendingFile: null,
  setPendingFile: (pendingFile) => set({ pendingFile }),
  consume: () => {
    const f = get().pendingFile;
    set({ pendingFile: null });
    return f;
  },
}));
