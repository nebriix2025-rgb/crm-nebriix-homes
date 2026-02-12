import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  const signingInRef = useRef(false);

  const fetchUserProfile = async (userId: string): Promise<boolean> => {
    console.log('fetchUserProfile called with userId:', userId);
    try {
      // Use Promise.race with a timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000);
      });

      const fetchPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      let data, error;
      try {
        const result = await Promise.race([fetchPromise, timeoutPromise]);
        data = result.data;
        error = result.error;
      } catch (timeoutError) {
        console.warn('Supabase client timeout, trying direct REST API...');
        // Fallback to direct REST API call
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(
          `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=*`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const users = await response.json();
          data = users[0] || null;
          error = users.length === 0 ? { message: 'User not found' } : null;
        } else {
          error = { message: `REST API error: ${response.status}` };
        }
      }

      console.log('fetchUserProfile result:', { data, error });

      if (error) {
        console.error('Error fetching user profile:', error);
        setUser(null);
        return false;
      }

      console.log('Setting user:', data);
      setUser(data);
      return true;
    } catch (error) {
      console.error('Error fetching user profile (catch):', error);
      setUser(null);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    // Get initial session
    const initSession = async () => {
      console.log('AuthContext: initSession called');

      // Set a timeout to ensure we eventually stop loading
      timeoutId = setTimeout(() => {
        if (isMounted) {
          console.log('AuthContext: Timeout reached, setting isLoading to false');
          setIsLoading(false);
        }
      }, 5000);

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('AuthContext: getSession result:', { session: session?.user?.id, error });

        if (!isMounted) {
          console.log('AuthContext: component unmounted, skipping');
          return;
        }

        if (session?.user) {
          console.log('AuthContext: Found session, fetching profile for:', session.user.id);
          const success = await fetchUserProfile(session.user.id);
          console.log('AuthContext: fetchUserProfile completed, success:', success);
        } else {
          console.log('AuthContext: No session found');
        }

        if (isMounted) {
          clearTimeout(timeoutId);
          console.log('AuthContext: Setting isLoading to false');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('AuthContext: getSession error:', err);
        if (isMounted) {
          clearTimeout(timeoutId);
          setIsLoading(false);
        }
      }
    };

    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    // Prevent concurrent sign-in attempts using ref (persists across renders)
    if (signingInRef.current) {
      console.log('Sign in already in progress, skipping...');
      return;
    }

    signingInRef.current = true;

    try {
      console.log('Starting sign in for:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Auth error:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error('Authentication failed - no user returned');
      }

      console.log('Auth successful, user ID:', data.user.id);

      // Fetch user profile - try by ID first, then by email as fallback
      let profile = null;

      // Try fetching by ID
      console.log('Fetching profile by ID...');
      const { data: idProfile, error: idError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      console.log('Profile by ID result:', idProfile, idError);

      if (idProfile) {
        profile = idProfile;
      } else {
        // Try fetching by email as a fallback (in case IDs don't match)
        console.log('Profile not found by ID, trying by email...');
        const { data: emailProfile, error: emailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', data.user.email)
          .single();

        console.log('Profile by email result:', emailProfile, emailError);

        if (emailProfile) {
          profile = emailProfile;
        } else {
          throw new Error('User profile not found. Please contact an administrator.');
        }
      }

      if (profile.status !== 'active') {
        await supabase.auth.signOut();
        throw new Error('Your account has been deactivated. Please contact an administrator.');
      }

      // Update last login (don't wait for it)
      supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', profile.id)
        .then(() => {});

      console.log('Setting user profile:', profile);
      setUser({ ...profile, last_login: new Date().toISOString() });
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      signingInRef.current = false;
    }
  }, []);

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
