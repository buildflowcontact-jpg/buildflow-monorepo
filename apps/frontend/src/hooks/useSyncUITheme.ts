import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { UITheme, useUIStore } from '@/store/uiStore';
import { useToast } from '@/ui/ToastProvider';

function isUITheme(value: unknown): value is UITheme {
  return value === 'industrial' || value === 'cockpit' || value === 'streamline';
}

export function useSyncUITheme(user: { id?: string; user_metadata?: Record<string, unknown> } | null) {
  const uiTheme = useUIStore((state) => state.uiTheme);
  const setUITheme = useUIStore((state) => state.setUITheme);
  const setIsThemeSyncing = useUIStore((state) => state.setIsThemeSyncing);
  const setThemeSyncError = useUIStore((state) => state.setThemeSyncError);
  const themeSyncVersion = useUIStore((state) => state.themeSyncVersion);
  const { showToast } = useToast() || {};
  const initializedUserRef = useRef<string | null>(null);
  const lastSyncedThemeRef = useRef<UITheme | null>(null);

  useEffect(() => {
    if (!user?.id) {
      initializedUserRef.current = null;
      lastSyncedThemeRef.current = null;
      setIsThemeSyncing(false);
      setThemeSyncError(null);
      return;
    }

    if (initializedUserRef.current === user.id) {
      return;
    }

    initializedUserRef.current = user.id;

    const remoteTheme = user.user_metadata?.ui_theme;
    if (isUITheme(remoteTheme)) {
      lastSyncedThemeRef.current = remoteTheme;
      setThemeSyncError(null);
      if (remoteTheme !== uiTheme) {
        setUITheme(remoteTheme);
      }
      return;
    }

    lastSyncedThemeRef.current = null;
  }, [setIsThemeSyncing, setThemeSyncError, setUITheme, uiTheme, user?.id, user?.user_metadata]);

  useEffect(() => {
    if (!user?.id || initializedUserRef.current !== user.id) {
      return;
    }

    const userMetadata = user.user_metadata ?? {};

    if (lastSyncedThemeRef.current === uiTheme) {
      return;
    }

    let cancelled = false;

    async function persistTheme() {
      setIsThemeSyncing(true);
      setThemeSyncError(null);
      const { error } = await supabase.auth.updateUser({
        data: {
          ...userMetadata,
          ui_theme: uiTheme,
        },
      });

      if (!cancelled) {
        if (!error) {
          lastSyncedThemeRef.current = uiTheme;
          setThemeSyncError(null);
        } else {
          setThemeSyncError('Impossible de synchroniser votre style pour le moment.');
          showToast?.('Sync du style impossible pour le moment', 'error');
        }
        setIsThemeSyncing(false);
      }
    }

    void persistTheme();

    return () => {
      cancelled = true;
    };
  }, [setIsThemeSyncing, setThemeSyncError, showToast, themeSyncVersion, uiTheme, user, user?.id]);
}