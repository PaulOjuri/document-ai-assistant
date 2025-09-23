'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, Session } from '@supabase/supabase-js';
import { createSupabaseClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createSupabaseClient();

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('AuthProvider: Getting initial session...');
        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.log('AuthProvider: Session result', { hasSession: !!session, userId: session?.user?.id });

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          setInitialLoad(false);
          console.log('AuthProvider: Set loading to false');
        }
      } catch (error) {
        console.error('AuthProvider: Error getting session:', error);
        if (mounted) {
          setLoading(false);
          setInitialLoad(false);
          console.log('AuthProvider: Set loading to false (error case)');
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted && !initialLoad) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Only navigate on successful sign in, not on every auth change
        if (event === 'SIGNED_IN' && session && pathname.startsWith('/auth')) {
          router.push('/dashboard');
        }

        // Navigate to login on sign out
        if (event === 'SIGNED_OUT') {
          router.push('/auth/login');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth, router, pathname, initialLoad]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Navigation is handled by the auth state change listener
    } catch (error) {
      console.error('Error signing out:', error);
      router.push('/auth/login');
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}