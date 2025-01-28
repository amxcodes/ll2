import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Platform } from 'react-native';

export default function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      try {
        // Only try to get session if we're in a client environment
        if (Platform.OS !== 'web' || (typeof window !== 'undefined')) {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (mounted) {
            setSession(currentSession);
          }
        }
      } catch (error) {
        console.warn('Error fetching session:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    getSession();

    // Only set up auth state listener in client environment
    if (Platform.OS !== 'web' || (typeof window !== 'undefined')) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (mounted) {
            setSession(session);
          }
        }
      );

      return () => {
        mounted = false;
        subscription?.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  return session;
}