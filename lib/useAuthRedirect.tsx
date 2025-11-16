// lib/useAuthRedirect.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase-client';
import type { User } from '@supabase/supabase-js';

export function useAuthRedirect(fallback = '/auth/signin') {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (error || !data.user) {
        // not logged in → send to fallback (signin)
        router.replace(fallback);
        return;
      }

      setUser(data.user);
      setLoading(false);
    };

    // initial check
    void checkUser();

    // listen to auth state changes (sign-in / sign-out)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;

        if (!session?.user) {
          router.replace(fallback);
        } else {
          setUser(session.user);
        }
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router, fallback]); // ✅ fix exhaustive-deps

  return { loading, user };
}
