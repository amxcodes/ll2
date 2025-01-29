// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

interface User {
  id: string;
  username: string;
  email?: string;
  bio?: string;
  avatar?: string;
  links?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string, repeatPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  checkProfileCompletion: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper functions
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) => password.length >= 6;

  const checkProfileCompletion = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('bio, avatar, links')
        .eq('id', userId)
        .single();

      if (error) return false;
      return Boolean(data?.bio?.trim() && data?.avatar && data?.links);
    } catch {
      return false;
    }
  };

  const signIn = async (username: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      if (!username || !password) {
        throw new Error('Username and password are required.');
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', password)
        .single();

      if (error || !data) {
        throw new Error('Invalid username or password.');
      }

      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (username: string, email: string, password: string, repeatPassword: string) => {
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!username || !email || !password || !repeatPassword) {
        throw new Error('All fields are required.');
      }

      if (!validateEmail(email)) {
        throw new Error('Invalid email address.');
      }

      if (!validatePassword(password)) {
        throw new Error('Password must be at least 6 characters long.');
      }

      if (password !== repeatPassword) {
        throw new Error('Passwords do not match.');
      }

      // Create user
      const { error } = await supabase.from('users').insert({
        username,
        email,
        password_hash: password,
      });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
  };

  const clearError = () => {
    setError(null);
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: session } = await supabase
          .from('users')
          .select('*')
          .limit(1)
          .single();
          
        if (session) {
          setUser(session);
        }
      } catch (error) {
        console.log('No session found');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        clearError,
        checkProfileCompletion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};