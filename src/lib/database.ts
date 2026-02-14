import { supabase } from './supabase';
import type {
  Property, Lead, Deal, Activity, User, AuditLog, Notification, Announcement,
  ReferralEarning, ReferralSummary, ReferredAgent,
  Reward, UserReward, UserRewardWithDetails
} from '@/types';

// ============================================
// USER OPERATIONS
// ============================================
export const userService = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },

  async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'> & { password?: string }): Promise<User> {
    // Require password for new users - no default password for security
    if (!user.password || user.password.length < 8) {
      throw new Error('Password is required and must be at least 8 characters');
    }
    const password = user.password;

    // First create the auth user using Supabase Auth API
    // Note: This requires the service role key for admin operations
    // For now, we'll use signUp which works with anon key but sends verification email
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: user.email,
      password: password,
      options: {
        data: {
          full_name: user.full_name,
          role: user.role,
        },
        emailRedirectTo: undefined, // Disable email verification redirect
      }
    });

    if (authError) {
      // Check if user already exists
      if (authError.message.includes('already registered')) {
        throw new Error('A user with this email already exists');
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create auth user');
    }

    // Now create the user profile in the users table
    const { password: _, ...userDataWithoutPassword } = user;
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        ...userDataWithoutPassword,
      })
      .select()
      .single();

    if (error) {
      // If profile creation fails, we should ideally delete the auth user
      // but that requires admin API access
      console.error('Failed to create user profile:', error);
      throw new Error('User account created but profile creation failed. Please contact admin.');
    }

    return data;
  },

  async update(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Try to use Edge Function for complete deletion (auth + profile)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/admin-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'delete_user', userId: id }),
      });

      if (response.ok) {
        return; // Successfully deleted via Edge Function
      }

      // If Edge Function fails, fall back to profile-only deletion
      const result = await response.json().catch(() => ({}));
      console.warn('Edge Function delete failed, falling back to profile deletion:', result);
    } catch (error) {
      console.warn('Edge Function not available, falling back to profile deletion:', error);
    }

    // Fallback: Delete only the profile (user can still exist in auth)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async toggleStatus(id: string, newStatus: 'active' | 'inactive'): Promise<User> {
    return this.update(id, { status: newStatus });
  },

  async changePassword(userId: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Get the current session to check if we're changing our own password
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // If changing own password, use updateUser (this works with anon key for current user)
    if (session.user.id === userId) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.error('Password update failed:', error);
        throw new Error(error.message || 'Failed to update password');
      }
      return;
    }

    // For other users, try the Edge Function first, then fall back to error
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/admin-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'change_password', userId, newPassword }),
      });

      if (response.ok) {
        return;
      }

      // If Edge Function is not deployed or fails
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || 'Edge Function not available');
    } catch (error) {
      // Edge Function not available - provide guidance
      console.error('Password change failed:', error);
      throw new Error('To change other users\' passwords, the admin Edge Function must be deployed to Supabase. Please deploy the admin-user function or use the Supabase Dashboard.');
    }
  },

  async sendPasswordResetEmail(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      console.error('Password reset email failed:', error);
      throw new Error(error.message || 'Failed to send password reset email');
    }
  }
};

// ============================================
// PROPERTY OPERATIONS
// ============================================
export const propertyService = {
  async getAll(): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        creator:users!properties_created_by_fkey(id, full_name, email, role)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getByUser(_userId: string, _isAdmin: boolean): Promise<Property[]> {
    // All users can see all published properties (requirement: Admin-Driven Content System)
    // Users see all published content, not just their own creations
    return this.getAll();
  },

  async getById(id: string): Promise<Property | null> {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        creator:users!properties_created_by_fkey(id, full_name, email, role)
      `)
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },

  async create(property: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'creator'>): Promise<Property> {
    // Remove computed/relation fields and new fields that may not be in schema cache yet
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { media, videos, documents, is_offplan, ...dbProperty } = property as any;

    // For now, skip the new fields entirely until schema cache is updated
    // TODO: Re-enable once schema cache has propagated
    const propertyData: Record<string, unknown> = { ...dbProperty };

    // Use Promise.race with timeout to prevent hanging Supabase client
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Property create timeout')), 10000);
    });

    const createPromise = supabase
      .from('properties')
      .insert(propertyData)
      .select(`
        *,
        creator:users!properties_created_by_fkey(id, full_name, email, role)
      `)
      .single();

    try {
      const result = await Promise.race([createPromise, timeoutPromise]);
      if (result.error) throw result.error;
      return result.data;
    } catch (timeoutError) {
      console.warn('Supabase client timeout on property create, trying direct REST API...');

      // Fallback to direct REST API
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Get current session for auth token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || supabaseKey;

      const response = await fetch(`${supabaseUrl}/rest/v1/properties`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(propertyData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `REST API error: ${response.status}`);
      }

      const properties = await response.json();
      const newProperty = Array.isArray(properties) ? properties[0] : properties;

      // Fetch creator info separately
      if (newProperty && newProperty.created_by) {
        const creatorResponse = await fetch(
          `${supabaseUrl}/rest/v1/users?id=eq.${newProperty.created_by}&select=id,full_name,email,role`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${accessToken}`,
            }
          }
        );
        if (creatorResponse.ok) {
          const creators = await creatorResponse.json();
          newProperty.creator = creators[0] || null;
        }
      }

      return newProperty;
    }
  },

  async update(id: string, updates: Partial<Property>): Promise<Property> {
    // Remove computed/relation fields and extract new fields separately
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { creator, media, videos, documents, is_offplan, ...cleanUpdates } = updates as any;

    // For now, skip the new fields entirely until schema cache is updated
    // TODO: Re-enable once schema cache has propagated
    const updateData: Record<string, unknown> = { ...cleanUpdates };

    // Use Promise.race with timeout to prevent hanging Supabase client
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Property update timeout')), 10000);
    });

    const updatePromise = supabase
      .from('properties')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        creator:users!properties_created_by_fkey(id, full_name, email, role)
      `)
      .single();

    try {
      const result = await Promise.race([updatePromise, timeoutPromise]);
      if (result.error) throw result.error;
      return result.data;
    } catch (timeoutError) {
      console.warn('Supabase client timeout on property update, trying direct REST API...');

      // Fallback to direct REST API
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || supabaseKey;

      const response = await fetch(`${supabaseUrl}/rest/v1/properties?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `REST API error: ${response.status}`);
      }

      const properties = await response.json();
      const updatedProperty = Array.isArray(properties) ? properties[0] : properties;

      // Fetch creator info separately
      if (updatedProperty && updatedProperty.created_by) {
        const creatorResponse = await fetch(
          `${supabaseUrl}/rest/v1/users?id=eq.${updatedProperty.created_by}&select=id,full_name,email,role`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${accessToken}`,
            }
          }
        );
        if (creatorResponse.ok) {
          const creators = await creatorResponse.json();
          updatedProperty.creator = creators[0] || null;
        }
      }

      return updatedProperty;
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async archive(id: string): Promise<Property> {
    return this.update(id, { status: 'archived' });
  }
};

// ============================================
// LEAD OPERATIONS
// ============================================
export const leadService = {
  async getAll(): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        assignee:users!leads_assigned_to_fkey(id, full_name, email, role)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getByUser(userId: string, isAdmin: boolean): Promise<Lead[]> {
    if (isAdmin) return this.getAll();

    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        assignee:users!leads_assigned_to_fkey(id, full_name, email, role)
      `)
      .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Lead | null> {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        assignee:users!leads_assigned_to_fkey(id, full_name, email, role)
      `)
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },

  async create(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'assignee'>): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .insert(lead)
      .select(`
        *,
        assignee:users!leads_assigned_to_fkey(id, full_name, email, role)
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Lead>): Promise<Lead> {
    const { assignee, ...cleanUpdates } = updates;

    const { data, error } = await supabase
      .from('leads')
      .update(cleanUpdates)
      .eq('id', id)
      .select(`
        *,
        assignee:users!leads_assigned_to_fkey(id, full_name, email, role)
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async archive(id: string): Promise<Lead> {
    return this.update(id, { status: 'archived' });
  }
};

// ============================================
// DEAL OPERATIONS
// ============================================
export const dealService = {
  async getAll(): Promise<Deal[]> {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        property:properties(id, title, price, location, status),
        lead:leads(id, name, email, phone),
        closer:users!deals_closer_id_fkey(id, full_name, email, role)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getByUser(_userId: string, _isAdmin: boolean): Promise<Deal[]> {
    // All users can see all deals - this is a CRM where agents need full visibility
    // into all deals to understand property status and client relationships
    return this.getAll();
  },

  async getById(id: string): Promise<Deal | null> {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        property:properties(id, title, price, location, status),
        lead:leads(id, name, email, phone),
        closer:users!deals_closer_id_fkey(id, full_name, email, role)
      `)
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },

  async create(deal: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'property' | 'lead' | 'closer' | 'commission_amount'>): Promise<Deal> {
    // Use Promise.race with timeout to prevent hanging Supabase client
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Deal create timeout')), 10000);
    });

    const createPromise = supabase
      .from('deals')
      .insert(deal)
      .select(`
        *,
        property:properties(id, title, price, location, status),
        lead:leads(id, name, email, phone),
        closer:users!deals_closer_id_fkey(id, full_name, email, role)
      `)
      .single();

    try {
      const result = await Promise.race([createPromise, timeoutPromise]);
      if (result.error) throw result.error;
      return result.data;
    } catch (timeoutError) {
      console.warn('Supabase client timeout on deal create, trying direct REST API...');
      // Fallback to direct REST API
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || supabaseKey;

      const response = await fetch(`${supabaseUrl}/rest/v1/deals`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(deal)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create deal: ${errorText}`);
      }

      const newDeal = (await response.json())[0];

      // Fetch the complete deal with relations
      const { data: fullDeal } = await supabase
        .from('deals')
        .select(`
          *,
          property:properties(id, title, price, location, status),
          lead:leads(id, name, email, phone),
          closer:users!deals_closer_id_fkey(id, full_name, email, role)
        `)
        .eq('id', newDeal.id)
        .single();

      return fullDeal || newDeal;
    }
  },

  async update(id: string, updates: Partial<Deal>): Promise<Deal> {
    const { property, lead, closer, ...cleanUpdates } = updates;

    // If closing the deal, set closed_at
    if (updates.status === 'closed' && !updates.closed_at) {
      cleanUpdates.closed_at = new Date().toISOString();
    }

    // Use Promise.race with timeout to prevent hanging Supabase client
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Deal update timeout')), 10000);
    });

    const updatePromise = supabase
      .from('deals')
      .update(cleanUpdates)
      .eq('id', id)
      .select(`
        *,
        property:properties(id, title, price, location, status),
        lead:leads(id, name, email, phone),
        closer:users!deals_closer_id_fkey(id, full_name, email, role)
      `)
      .single();

    try {
      const result = await Promise.race([updatePromise, timeoutPromise]);
      if (result.error) throw result.error;
      return result.data;
    } catch (timeoutError) {
      console.warn('Supabase client timeout on deal update, trying direct REST API...');
      // Fallback to direct REST API
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || supabaseKey;

      const response = await fetch(`${supabaseUrl}/rest/v1/deals?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(cleanUpdates)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update deal: ${errorText}`);
      }

      // Fetch the complete deal with relations
      const { data: fullDeal } = await supabase
        .from('deals')
        .select(`
          *,
          property:properties(id, title, price, location, status),
          lead:leads(id, name, email, phone),
          closer:users!deals_closer_id_fkey(id, full_name, email, role)
        `)
        .eq('id', id)
        .single();

      return fullDeal!;
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// ============================================
// ACTIVITY OPERATIONS
// ============================================
export const activityService = {
  async getAll(limit = 100): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        user:users(id, full_name, email, role)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async getByUser(userId: string, isAdmin: boolean, limit = 50): Promise<Activity[]> {
    if (isAdmin) return this.getAll(limit);

    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        user:users(id, full_name, email, role)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async create(activity: Omit<Activity, 'id' | 'created_at' | 'user'>): Promise<Activity> {
    const { data, error } = await supabase
      .from('activities')
      .insert(activity)
      .select(`
        *,
        user:users(id, full_name, email, role)
      `)
      .single();
    if (error) throw error;
    return data;
  }
};

// ============================================
// AUDIT LOG OPERATIONS
// ============================================
export const auditLogService = {
  async getAll(filters?: { userId?: string; entityType?: string; action?: string }): Promise<AuditLog[]> {
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        user:users(id, full_name, email, role)
      `)
      .order('created_at', { ascending: false });

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }
    if (filters?.action) {
      query = query.ilike('action', `%${filters.action}%`);
    }

    const { data, error } = await query.limit(500);
    if (error) throw error;
    return data || [];
  },

  async create(log: Omit<AuditLog, 'id' | 'created_at' | 'user'>): Promise<AuditLog> {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert(log)
      .select(`
        *,
        user:users(id, full_name, email, role)
      `)
      .single();
    if (error) throw error;
    return data;
  }
};

// ============================================
// NOTIFICATION OPERATIONS
// ============================================
export const notificationService = {
  async getForUser(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        sender:users!notifications_sender_id_fkey(id, full_name, email)
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return data || [];
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false);
    if (error) throw error;
    return count || 0;
  },

  async create(notification: Omit<Notification, 'id' | 'created_at' | 'sender' | 'read'>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({ ...notification, read: false })
      .select(`
        *,
        sender:users!notifications_sender_id_fkey(id, full_name, email)
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    if (error) throw error;
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('recipient_id', userId);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// ============================================
// ANNOUNCEMENT OPERATIONS
// ============================================
export const announcementService = {
  async getActive(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        creator:users!announcements_created_by_fkey(id, full_name, email)
      `)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(announcement: Omit<Announcement, 'id' | 'created_at' | 'creator'>): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .insert(announcement)
      .select(`
        *,
        creator:users!announcements_created_by_fkey(id, full_name, email)
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// ============================================
// REFERRAL EARNINGS OPERATIONS
// ============================================
export const referralService = {
  async getEarningsForUser(userId: string): Promise<ReferralEarning[]> {
    const { data, error } = await supabase
      .from('referral_earnings')
      .select(`
        *,
        referrer:users!referral_earnings_referrer_id_fkey(id, full_name, email, avatar_url),
        referred_agent:users!referral_earnings_referred_agent_id_fkey(id, full_name, email, avatar_url),
        deal:deals(id, deal_value, commission_amount, status)
      `)
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getReferredAgents(userId: string): Promise<ReferredAgent[]> {
    // Get all users referred by this user
    const { data: referredUsers, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email, avatar_url, status, created_at')
      .eq('referred_by', userId);
    if (usersError) throw usersError;

    if (!referredUsers || referredUsers.length === 0) return [];

    // For each referred user, get their deals count and earnings generated
    const referredAgents: ReferredAgent[] = await Promise.all(
      referredUsers.map(async (user) => {
        // Get closed deals count
        const { count: dealsCount } = await supabase
          .from('deals')
          .select('*', { count: 'exact', head: true })
          .eq('closer_id', user.id)
          .eq('status', 'closed');

        // Get total earnings generated for the referrer from this agent
        const { data: earnings } = await supabase
          .from('referral_earnings')
          .select('earning_amount')
          .eq('referrer_id', userId)
          .eq('referred_agent_id', user.id);

        const totalEarnings = earnings?.reduce((sum, e) => sum + Number(e.earning_amount), 0) || 0;

        return {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          avatar_url: user.avatar_url,
          status: user.status,
          deals_closed: dealsCount || 0,
          total_earnings_generated: totalEarnings,
          joined_at: user.created_at,
        };
      })
    );

    return referredAgents;
  },

  async getSummary(userId: string): Promise<ReferralSummary> {
    const referredAgents = await this.getReferredAgents(userId);

    // Get all earnings
    const { data: allEarnings } = await supabase
      .from('referral_earnings')
      .select('earning_amount, created_at')
      .eq('referrer_id', userId);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalLifetime = allEarnings?.reduce((sum, e) => sum + Number(e.earning_amount), 0) || 0;
    const totalThisMonth = allEarnings
      ?.filter(e => new Date(e.created_at) >= startOfMonth)
      .reduce((sum, e) => sum + Number(e.earning_amount), 0) || 0;

    return {
      total_referrals: referredAgents.length,
      total_earnings_lifetime: totalLifetime,
      total_earnings_this_month: totalThisMonth,
      referred_agents: referredAgents,
    };
  },

  async createEarning(earning: Omit<ReferralEarning, 'id' | 'created_at' | 'referrer' | 'referred_agent' | 'deal'>): Promise<ReferralEarning> {
    const { data, error } = await supabase
      .from('referral_earnings')
      .insert(earning)
      .select(`
        *,
        referrer:users!referral_earnings_referrer_id_fkey(id, full_name, email, avatar_url),
        referred_agent:users!referral_earnings_referred_agent_id_fkey(id, full_name, email, avatar_url),
        deal:deals(id, deal_value, commission_amount, status)
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async getAllEarnings(): Promise<ReferralEarning[]> {
    const { data, error } = await supabase
      .from('referral_earnings')
      .select(`
        *,
        referrer:users!referral_earnings_referrer_id_fkey(id, full_name, email, avatar_url),
        referred_agent:users!referral_earnings_referred_agent_id_fkey(id, full_name, email, avatar_url),
        deal:deals(id, deal_value, commission_amount, status)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
};

// ============================================
// REWARDS OPERATIONS
// ============================================
export const rewardService = {
  async getAll(includeInactive = false): Promise<Reward[]> {
    let query = supabase
      .from('rewards')
      .select(`
        *,
        creator:users!rewards_created_by_fkey(id, full_name, email)
      `)
      .order('sort_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Reward | null> {
    const { data, error } = await supabase
      .from('rewards')
      .select(`
        *,
        creator:users!rewards_created_by_fkey(id, full_name, email)
      `)
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },

  async create(reward: Omit<Reward, 'id' | 'created_at' | 'updated_at' | 'creator'>): Promise<Reward> {
    const { data, error } = await supabase
      .from('rewards')
      .insert(reward)
      .select(`
        *,
        creator:users!rewards_created_by_fkey(id, full_name, email)
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Reward>): Promise<Reward> {
    const { creator, ...cleanUpdates } = updates as any;
    const { data, error } = await supabase
      .from('rewards')
      .update(cleanUpdates)
      .eq('id', id)
      .select(`
        *,
        creator:users!rewards_created_by_fkey(id, full_name, email)
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async toggleActive(id: string, isActive: boolean): Promise<Reward> {
    return this.update(id, { is_active: isActive });
  }
};

// ============================================
// USER REWARDS OPERATIONS
// ============================================
export const userRewardService = {
  async getForUser(userId: string): Promise<UserRewardWithDetails[]> {
    const { data, error } = await supabase
      .from('user_rewards')
      .select(`
        *,
        reward:rewards(*),
        user:users!user_rewards_user_id_fkey(id, full_name, email, avatar_url),
        fulfiller:users!user_rewards_fulfilled_by_fkey(id, full_name, email)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getAll(): Promise<UserReward[]> {
    const { data, error } = await supabase
      .from('user_rewards')
      .select(`
        *,
        reward:rewards(*),
        user:users!user_rewards_user_id_fkey(id, full_name, email, avatar_url),
        fulfiller:users!user_rewards_fulfilled_by_fkey(id, full_name, email)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(userReward: Omit<UserReward, 'id' | 'created_at' | 'updated_at' | 'user' | 'reward' | 'fulfiller'>): Promise<UserReward> {
    const { data, error } = await supabase
      .from('user_rewards')
      .insert(userReward)
      .select(`
        *,
        reward:rewards(*),
        user:users!user_rewards_user_id_fkey(id, full_name, email, avatar_url)
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<UserReward>): Promise<UserReward> {
    const { user, reward, fulfiller, ...cleanUpdates } = updates as any;
    const { data, error } = await supabase
      .from('user_rewards')
      .update(cleanUpdates)
      .eq('id', id)
      .select(`
        *,
        reward:rewards(*),
        user:users!user_rewards_user_id_fkey(id, full_name, email, avatar_url),
        fulfiller:users!user_rewards_fulfilled_by_fkey(id, full_name, email)
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async fulfill(id: string, fulfilledBy: string, notes?: string): Promise<UserReward> {
    return this.update(id, {
      status: 'fulfilled',
      fulfilled_at: new Date().toISOString(),
      fulfilled_by: fulfilledBy,
      notes,
    });
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_rewards')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getUserPointsBalance(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('users')
      .select('points_balance')
      .eq('id', userId)
      .single();
    if (error) return 0;
    return data?.points_balance || 0;
  },

  async updateUserPoints(userId: string, points: number): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ points_balance: points })
      .eq('id', userId);
    if (error) throw error;
  }
};

// ============================================
// DASHBOARD STATS
// ============================================
export const statsService = {
  async getDashboardStats(userId: string, isAdmin: boolean): Promise<{
    total_properties: number;
    properties_sold: number;
    team_size: number;
    active_leads: number;
    total_value: number;
    available_properties: number;
  }> {
    // Get properties count
    let propertiesQuery = supabase.from('properties').select('status', { count: 'exact' });
    if (!isAdmin) {
      propertiesQuery = propertiesQuery.eq('created_by', userId);
    }
    const { data: properties } = await propertiesQuery;

    // Get leads count
    let leadsQuery = supabase.from('leads').select('status', { count: 'exact' });
    if (!isAdmin) {
      leadsQuery = leadsQuery.or(`created_by.eq.${userId},assigned_to.eq.${userId}`);
    }
    const { data: leads } = await leadsQuery;

    // Get deals value
    let dealsQuery = supabase.from('deals').select('deal_value, status');
    if (!isAdmin) {
      dealsQuery = dealsQuery.or(`created_by.eq.${userId},closer_id.eq.${userId}`);
    }
    const { data: deals } = await dealsQuery;

    // Get team size (only for admin)
    const { count: teamSize } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const totalProperties = properties?.length || 0;
    const propertiesSold = properties?.filter(p => p.status === 'sold').length || 0;
    const availableProperties = properties?.filter(p => p.status === 'available').length || 0;
    const activeLeads = leads?.filter(l => !['won', 'lost', 'archived'].includes(l.status)).length || 0;
    const totalValue = deals?.filter(d => d.status === 'closed').reduce((sum, d) => sum + (d.deal_value || 0), 0) || 0;

    return {
      total_properties: totalProperties,
      properties_sold: propertiesSold,
      team_size: teamSize || 0,
      active_leads: activeLeads,
      total_value: totalValue,
      available_properties: availableProperties,
    };
  }
};
