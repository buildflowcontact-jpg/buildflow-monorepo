import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadSession() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        // Token invalide ou absent — on purge la session corrompue
        await supabase.auth.signOut();
      }
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    }
    loadSession();
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
        return;
      }
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

export async function signInWithMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}
