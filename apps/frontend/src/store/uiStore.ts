// store/uiStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UITheme = 'industrial' | 'cockpit' | 'streamline';

export const uiThemeLabels: Record<UITheme, string> = {
  industrial: 'Mode Chantier',
  cockpit: 'Mode Dashboard',
  streamline: 'Mode Focus',
};

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  uiTheme: UITheme;
  setUITheme: (theme: UITheme) => void;
  isThemeSyncing: boolean;
  setIsThemeSyncing: (isSyncing: boolean) => void;
  themeSyncError: string | null;
  setThemeSyncError: (message: string | null) => void;
  themeSyncVersion: number;
  retryThemeSync: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      uiTheme: 'cockpit',
      setUITheme: (theme) => set({ uiTheme: theme }),
      isThemeSyncing: false,
      setIsThemeSyncing: (isSyncing) => set({ isThemeSyncing: isSyncing }),
      themeSyncError: null,
      setThemeSyncError: (message) => set({ themeSyncError: message }),
      themeSyncVersion: 0,
      retryThemeSync: () => set((state) => ({ themeSyncVersion: state.themeSyncVersion + 1 })),
    }),
    {
      name: 'buildflow-ui',
      partialize: (state) => ({ uiTheme: state.uiTheme }),
    },
  ),
);
