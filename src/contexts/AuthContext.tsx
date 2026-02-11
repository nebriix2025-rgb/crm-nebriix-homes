import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const fetchUserProfile = async (userId: string) => {
    console.log('fetchUserProfile: Starting for userId:', userId);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('fetchUserProfile: Result:', { data: data ? 'has data' : 'no data', error });

      if (error) {
        console.error('Error fetching user profile:', error);
        setUser(null);
        return;
      }

      console.log('fetchUserProfile: Setting user');
      setUser(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    const initSession = async () => {
      console.log('AuthContext: Getting session...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('AuthContext: Session result:', session ? 'Has session' : 'No session', error);

        if (!isMounted) return;

        if (session?.user) {
          console.log('AuthContext: Fetching profile for user:', session.user.id);
          await fetchUserProfile(session.user.id);
        }

        if (isMounted) {
          console.log('AuthContext: Setting isLoading to false');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('AuthContext: getSession error:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed:', event, 'session:', session ? 'exists' : 'null', 'isMounted:', isMounted);
        if (!isMounted) {
          console.log('AuthContext: Not mounted, skipping');
          return;
        }

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('AuthContext: SIGNED_IN - calling fetchUserProfile');
          await fetchUserProfile(session.user.id);
          console.log('AuthContext: fetchUserProfile completed');
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        console.log('AuthContext: Setting isLoading to false after auth change');
        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    // Prevent concurrent sign-in attempts
    if (isSigningIn) {
      console.log('Sign in already in progress, skipping...');
      return;
    }

    setIsSigningIn(true);
    console.log('Starting sign in for:', email);

    try {
      console.log('Calling signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('Auth result received:', { hasData: !!data, hasError: !!error, error });

      if (error) throw error;

      if (!data.user) {
        throw new Error('Authentication failed - no user returned');
      }

      console.log('Auth user ID:', data.user.id);

      // Fetch user profile to check status
      console.log('Fetching user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      console.log('Profile result:', { profile, profileError });

      if (profileError) throw new Error('User profile not found: ' + profileError.message);

      if (profile.status !== 'active') {
        await supabase.auth.signOut();
        throw new Error('Your account has been deactivated. Please contact an administrator.');
      }

      // Update last login
      console.log('Updating last login...');
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);

      console.log('Sign in complete, setting user');
      setUser({ ...profile, last_login: new Date().toISOString() });
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  }, [isSigningIn]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('Not authenticated');

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters');
    }

    // Verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new Error('Current password is incorrect');
    }

    // Now update the password
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }, [user]);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) throw new Error('Not authenticated');

    // Users cannot change their own role or email
    const safeUpdates = {
      ...updates,
      role: undefined,
      email: undefined,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined fields
    Object.keys(safeUpdates).forEach(key => {
      if (safeUpdates[key as keyof typeof safeUpdates] === undefined) {
        delete safeUpdates[key as keyof typeof safeUpdates];
      }
    });

    const { data, error } = await supabase
      .from('users')
      .update(safeUpdates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    setUser(data);
  }, [user]);

  const refreshUser = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  }, [user]);

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]) => {
      if (!user) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        signIn,
        signOut,
        changePassword,
        updateProfile,
        hasRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
