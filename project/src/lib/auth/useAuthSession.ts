import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface AuthState {
  ready: boolean;
  session: Session | null;
}

export function useAuthSession(): AuthState {
  const [state, setState] = useState<AuthState>({ ready: false, session: null });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState({ ready: true, session: null });
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setState({ ready: true, session: data.session });
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (active) setState({ ready: true, session });
      })();
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return state;
}
