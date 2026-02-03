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

// Demo users for when Supabase is not configured (Admin/User roles only)
const DEMO_USERS: Record<string, User> = {
  'admin@nebriix.com': {
    id: '1',
    email: 'admin@nebriix.com',
    full_name: 'Ahmed Al-Rashid',
    role: 'admin',
    status: 'active',
    phone: '+971 50 123 4567',
    password_hash: 'demo123',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: new Date().toISOString(),
  },
  'user@nebriix.com': {
    id: '2',
    email: 'user@nebriix.com',
    full_name: 'Sarah Thompson',
    role: 'user',
    status: 'active',
    phone: '+971 50 234 5678',
    password_hash: 'demo123',
    created_at: '2024-02-20T10:00:00Z',
    updated_at: new Date().toISOString(),
  },
  'john@nebriix.com': {
    id: '3',
    email: 'john@nebriix.com',
    full_name: 'John Smith',
    role: 'user',
    status: 'active',
    password_hash: 'demo123',
    created_at: '2024-03-10T10:00:00Z',
    updated_at: new Date().toISOString(),
  },
};

const isDemoMode = !import.meta.env.VITE_SUPABASE_URL;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDemoUser = () => {
    const savedUser = localStorage.getItem('nebriix_demo_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      // Merge with any updates from localStorage
      const storedUsers = localStorage.getItem('nebriix_users');
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        const updatedUser = users.find((u: User) => u.id === parsed.id);
        if (updatedUser) {
          setUser(updatedUser);
          return;
        }
      }
      setUser(parsed);
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      loadDemoUser();
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = useCallback(async (email: string, password: string) => {
    if (isDemoMode) {
      // Check demo users first
      let demoUser = DEMO_USERS[email.toLowerCase()];

      // Check dynamically created users from localStorage
      if (!demoUser) {
        const storedUsers = localStorage.getItem('nebriix_users');
        if (storedUsers) {
          const users: User[] = JSON.parse(storedUsers);
          demoUser = users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null as unknown as User;
        }
      }

      if (demoUser && (demoUser.password_hash === password || password === 'demo123')) {
        // Check if user is active
        if (demoUser.status !== 'active') {
          throw new Error('Your account has been deactivated. Please contact an administrator.');
        }

        const updatedUser = { ...demoUser, last_login: new Date().toISOString() };
        setUser(updatedUser);
        localStorage.setItem('nebriix_demo_user', JSON.stringify(updatedUser));

        // Update in stored users
        const storedUsers = localStorage.getItem('nebriix_users');
        if (storedUsers) {
          const users: User[] = JSON.parse(storedUsers);
          const idx = users.findIndex(u => u.id === updatedUser.id);
          if (idx >= 0) {
            users[idx] = updatedUser;
            localStorage.setItem('nebriix_users', JSON.stringify(users));
          }
        }
        return;
      }
      throw new Error('Invalid credentials. Try admin@nebriix.com or user@nebriix.com with password demo123');
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      setUser(null);
      localStorage.removeItem('nebriix_demo_user');
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('Not authenticated');

    if (isDemoMode) {
      // Verify current password
      const storedUsers = localStorage.getItem('nebriix_users');
      let users: User[] = storedUsers ? JSON.parse(storedUsers) : Object.values(DEMO_USERS);

      const currentUser = users.find(u => u.id === user.id);
      if (!currentUser) throw new Error('User not found');

      if (currentUser.password_hash !== currentPassword && currentPassword !== 'demo123') {
        throw new Error('Current password is incorrect');
      }

      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters');
      }

      // Update password
      const updatedUser = { ...currentUser, password_hash: newPassword, updated_at: new Date().toISOString() };
      const idx = users.findIndex(u => u.id === user.id);
      if (idx >= 0) {
        users[idx] = updatedUser;
      }

      localStorage.setItem('nebriix_users', JSON.stringify(users));
      localStorage.setItem('nebriix_demo_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }, [user]);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) throw new Error('Not authenticated');

    if (isDemoMode) {
      // Get stored users or initialize from DEMO_USERS
      const storedUsers = localStorage.getItem('nebriix_users');
      let users: User[] = storedUsers ? JSON.parse(storedUsers) : [];

      // If no users in storage, initialize with demo users
      if (users.length === 0) {
        users = Object.values(DEMO_USERS);
      }

      const updatedUser: User = {
        ...user,
        ...updates,
        updated_at: new Date().toISOString(),
        // Users cannot change their own role or email
        role: user.role,
        email: user.email,
      };

      const idx = users.findIndex(u => u.id === user.id);
      if (idx >= 0) {
        users[idx] = updatedUser;
      } else {
        users.push(updatedUser);
      }

      localStorage.setItem('nebriix_users', JSON.stringify(users));
      localStorage.setItem('nebriix_demo_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return;
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);
    if (error) throw error;

    setUser({ ...user, ...updates });
  }, [user]);

  const refreshUser = useCallback(() => {
    if (isDemoMode) {
      loadDemoUser();
    } else if (user) {
      fetchUserProfile(user.id);
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
