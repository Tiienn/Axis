import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { identify, resetAnalytics } from './analytics';
import type { UserRow } from './database.types';
import { supabase } from './supabase';

type SessionCtx = {
  session: Session | null;
  profile: UserRow | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<SessionCtx>({
  session: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) {
      console.warn('[auth] failed to load profile', error.message);
      setProfile(null);
      return;
    }
    const row = data as UserRow;
    setProfile(row);
    identify(userId, { subscription_status: row.subscription_status ?? 'free' });
  };

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await loadProfile(newSession.user.id);
      } else {
        setProfile(null);
        resetAnalytics();
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (session) await loadProfile(session.user.id);
  };

  return (
    <Ctx.Provider value={{ session, profile, loading, refreshProfile }}>{children}</Ctx.Provider>
  );
}

export const useSession = () => useContext(Ctx);
