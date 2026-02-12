import { create } from 'zustand';
import type { Property, Lead, Deal, Activity, User, DashboardStats, AuditLog, Notification, Announcement } from '@/types';
import {
  propertyService,
  leadService,
  dealService,
  activityService,
  userService,
  auditLogService,
  notificationService,
  announcementService,
  statsService
} from './database';

interface AppState {
  // Data (cached from Supabase)
  properties: Property[];
  leads: Lead[];
  deals: Deal[];
  activities: Activity[];
  users: User[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  announcements: Announcement[];

  // UI State
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  currentUserId: string | null;

  // Set current user (for data isolation)
  setCurrentUser: (userId: string | null) => void;

  // Data Loading
  loadInitialData: (userId: string, isAdmin: boolean) => Promise<void>;
  refreshData: (userId: string, isAdmin: boolean) => Promise<void>;

  // Property Actions
  setProperties: (properties: Property[]) => void;
  addProperty: (property: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'creator'>) => Promise<Property>;
  updateProperty: (id: string, updates: Partial<Property>) => Promise<Property>;
  deleteProperty: (id: string) => Promise<void>;
  archiveProperty: (id: string) => Promise<Property>;

  // Lead Actions
  setLeads: (leads: Lead[]) => void;
  addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'assignee'>) => Promise<Lead>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<Lead>;
  deleteLead: (id: string) => Promise<void>;
  archiveLead: (id: string) => Promise<Lead>;

  // Deal Actions
  setDeals: (deals: Deal[]) => void;
  addDeal: (deal: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'property' | 'lead' | 'closer' | 'commission_amount'>) => Promise<Deal>;
  updateDeal: (id: string, updates: Partial<Deal>) => Promise<Deal>;
  deleteDeal: (id: string) => Promise<void>;

  // Activity Actions
  setActivities: (activities: Activity[]) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'created_at' | 'user'>) => Promise<Activity>;

  // User Actions
  setUsers: (users: User[]) => void;
  loadUsers: () => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'created_at' | 'updated_at'> & { password?: string }) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<User>;
  changeUserPassword: (id: string, newPassword: string) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;

  // Audit Log Actions
  addAuditLog: (log: Omit<AuditLog, 'id' | 'created_at' | 'user'>) => Promise<AuditLog>;
  loadAuditLogs: (filters?: { userId?: string; entityType?: string; action?: string }) => Promise<void>;

  // Notification Actions
  loadNotifications: (userId: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'sender' | 'read'>) => Promise<Notification>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: (userId: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  getNotificationsForUser: (userId: string) => Notification[];
  getUnreadCountForUser: (userId: string) => number;

  // Announcement Actions
  loadAnnouncements: () => Promise<void>;
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'created_at' | 'creator'>) => Promise<Announcement>;
  deleteAnnouncement: (id: string) => Promise<void>;
  getActiveAnnouncements: () => Announcement[];

  // UI Actions
  setSearchQuery: (query: string) => void;
  setError: (error: string | null) => void;

  // Computed (with data isolation)
  getStats: (userId: string, isAdmin: boolean) => Promise<DashboardStats>;
  getPropertyById: (id: string) => Property | undefined;
  getLeadById: (id: string) => Lead | undefined;
  getUserById: (id: string) => User | undefined;

  // Data Access (with isolation - from cache)
  getPropertiesForUser: (userId: string, isAdmin: boolean) => Property[];
  getLeadsForUser: (userId: string, isAdmin: boolean) => Lead[];
  getDealsForUser: (userId: string, isAdmin: boolean) => Deal[];
  getActivitiesForUser: (userId: string, isAdmin: boolean) => Activity[];

  // Admin functions
  getUserActivitySummary: (userId: string) => { leads: number; properties: number; deals: number };
  getAuditLogs: (filters?: { userId?: string; entityType?: string; action?: string }) => AuditLog[];
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initialize with empty data (will be loaded from Supabase)
  properties: [],
  leads: [],
  deals: [],
  activities: [],
  users: [],
  auditLogs: [],
  notifications: [],
  announcements: [],
  searchQuery: '',
  isLoading: false,
  error: null,
  currentUserId: null,

  setCurrentUser: (userId) => set({ currentUserId: userId }),

  // Load initial data from Supabase
  loadInitialData: async (userId, isAdmin) => {
    set({ isLoading: true, error: null });
    try {
      const [properties, leads, deals, activities, users, announcements] = await Promise.all([
        propertyService.getByUser(userId, isAdmin),
        leadService.getByUser(userId, isAdmin),
        dealService.getByUser(userId, isAdmin),
        activityService.getByUser(userId, isAdmin),
        userService.getAll(),
        announcementService.getActive(),
      ]);

      set({
        properties,
        leads,
        deals,
        activities,
        users,
        announcements,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading initial data:', error);
      set({ error: 'Failed to load data. Please refresh the page.', isLoading: false });
    }
  },

  refreshData: async (userId, isAdmin) => {
    await get().loadInitialData(userId, isAdmin);
  },

  // Property Actions
  setProperties: (properties) => set({ properties }),

  addProperty: async (property) => {
    try {
      const newProperty = await propertyService.create(property);

      // Log activity
      await activityService.create({
        user_id: property.created_by,
        action: 'property_added',
        entity_type: 'property',
        entity_id: newProperty.id,
        entity_name: newProperty.title,
      });

      // Log audit
      await auditLogService.create({
        user_id: property.created_by,
        action: 'property_added',
        entity_type: 'property',
        entity_id: newProperty.id,
        new_value: { title: newProperty.title, price: newProperty.price, location: newProperty.location },
      });

      set((state) => ({
        properties: [newProperty, ...state.properties],
      }));

      return newProperty;
    } catch (error) {
      console.error('Error adding property:', error);
      throw error;
    }
  },

  updateProperty: async (id, updates) => {
    try {
      const oldProperty = get().properties.find(p => p.id === id);
      const updatedProperty = await propertyService.update(id, updates);

      // Log audit
      await auditLogService.create({
        user_id: get().currentUserId || '',
        action: 'property_updated',
        entity_type: 'property',
        entity_id: id,
        old_value: oldProperty ? { title: oldProperty.title, price: oldProperty.price, status: oldProperty.status } : undefined,
        new_value: updates,
      });

      set((state) => ({
        properties: state.properties.map((p) => (p.id === id ? updatedProperty : p)),
      }));

      return updatedProperty;
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  },

  deleteProperty: async (id) => {
    try {
      const property = get().properties.find(p => p.id === id);
      await propertyService.delete(id);

      // Log audit
      await auditLogService.create({
        user_id: get().currentUserId || '',
        action: 'property_deleted',
        entity_type: 'property',
        entity_id: id,
        old_value: property ? { title: property.title, price: property.price } : undefined,
      });

      set((state) => ({
        properties: state.properties.filter((p) => p.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  },

  archiveProperty: async (id) => {
    try {
      const property = get().properties.find(p => p.id === id);
      const archivedProperty = await propertyService.archive(id);

      // Log activity
      await activityService.create({
        user_id: get().currentUserId || '',
        action: 'property_archived',
        entity_type: 'property',
        entity_id: id,
        entity_name: property?.title || 'Property',
      });

      // Log audit
      await auditLogService.create({
        user_id: get().currentUserId || '',
        action: 'property_archived',
        entity_type: 'property',
        entity_id: id,
        old_value: { status: property?.status },
        new_value: { status: 'archived' },
      });

      set((state) => ({
        properties: state.properties.map((p) => (p.id === id ? archivedProperty : p)),
      }));

      return archivedProperty;
    } catch (error) {
      console.error('Error archiving property:', error);
      throw error;
    }
  },

  // Lead Actions
  setLeads: (leads) => set({ leads }),

  addLead: async (lead) => {
    try {
      const newLead = await leadService.create(lead);

      // Log activity
      await activityService.create({
        user_id: lead.created_by,
        action: 'lead_added',
        entity_type: 'lead',
        entity_id: newLead.id,
        entity_name: newLead.name,
      });

      // Log audit
      await auditLogService.create({
        user_id: lead.created_by,
        action: 'lead_added',
        entity_type: 'lead',
        entity_id: newLead.id,
        new_value: { name: newLead.name, status: newLead.status, source: newLead.source },
      });

      set((state) => ({
        leads: [newLead, ...state.leads],
      }));

      return newLead;
    } catch (error) {
      console.error('Error adding lead:', error);
      throw error;
    }
  },

  updateLead: async (id, updates) => {
    try {
      const oldLead = get().leads.find(l => l.id === id);
      const updatedLead = await leadService.update(id, updates);

      // Log audit
      await auditLogService.create({
        user_id: get().currentUserId || '',
        action: 'lead_updated',
        entity_type: 'lead',
        entity_id: id,
        old_value: oldLead ? { name: oldLead.name, status: oldLead.status } : undefined,
        new_value: updates,
      });

      set((state) => ({
        leads: state.leads.map((l) => (l.id === id ? updatedLead : l)),
      }));

      return updatedLead;
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  },

  deleteLead: async (id) => {
    try {
      const lead = get().leads.find(l => l.id === id);
      await leadService.delete(id);

      // Log audit
      await auditLogService.create({
        user_id: get().currentUserId || '',
        action: 'lead_deleted',
        entity_type: 'lead',
        entity_id: id,
        old_value: lead ? { name: lead.name, status: lead.status } : undefined,
      });

      set((state) => ({
        leads: state.leads.filter((l) => l.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  },

  archiveLead: async (id) => {
    try {
      const lead = get().leads.find(l => l.id === id);
      const archivedLead = await leadService.archive(id);

      // Log activity
      await activityService.create({
        user_id: get().currentUserId || '',
        action: 'lead_archived',
        entity_type: 'lead',
        entity_id: id,
        entity_name: lead?.name || 'Lead',
      });

      // Log audit
      await auditLogService.create({
        user_id: get().currentUserId || '',
        action: 'lead_archived',
        entity_type: 'lead',
        entity_id: id,
        old_value: { status: lead?.status },
        new_value: { status: 'archived' },
      });

      set((state) => ({
        leads: state.leads.map((l) => (l.id === id ? archivedLead : l)),
      }));

      return archivedLead;
    } catch (error) {
      console.error('Error archiving lead:', error);
      throw error;
    }
  },

  // Deal Actions
  setDeals: (deals) => set({ deals }),

  addDeal: async (deal) => {
    try {
      const newDeal = await dealService.create(deal);

      // Log activity
      await activityService.create({
        user_id: deal.created_by || deal.closer_id,
        action: 'deal_created',
        entity_type: 'deal',
        entity_id: newDeal.id,
        entity_name: newDeal.property?.title || 'New Deal',
      });

      // Log audit
      await auditLogService.create({
        user_id: deal.created_by || deal.closer_id,
        action: 'deal_created',
        entity_type: 'deal',
        entity_id: newDeal.id,
        new_value: { property: newDeal.property?.title, value: newDeal.deal_value, status: newDeal.status },
      });

      set((state) => ({
        deals: [newDeal, ...state.deals],
      }));

      return newDeal;
    } catch (error) {
      console.error('Error adding deal:', error);
      throw error;
    }
  },

  updateDeal: async (id, updates) => {
    try {
      const oldDeal = get().deals.find(d => d.id === id);
      const updatedDeal = await dealService.update(id, updates);

      // Log audit
      await auditLogService.create({
        user_id: get().currentUserId || '',
        action: updates.status === 'closed' ? 'deal_closed' : 'deal_updated',
        entity_type: 'deal',
        entity_id: id,
        old_value: oldDeal ? { status: oldDeal.status, value: oldDeal.deal_value } : undefined,
        new_value: updates,
      });

      set((state) => ({
        deals: state.deals.map((d) => (d.id === id ? updatedDeal : d)),
      }));

      return updatedDeal;
    } catch (error) {
      console.error('Error updating deal:', error);
      throw error;
    }
  },

  deleteDeal: async (id) => {
    try {
      const deal = get().deals.find(d => d.id === id);
      await dealService.delete(id);

      // Log audit
      await auditLogService.create({
        user_id: get().currentUserId || '',
        action: 'deal_deleted',
        entity_type: 'deal',
        entity_id: id,
        old_value: deal ? { property: deal.property?.title, value: deal.deal_value, status: deal.status } : undefined,
      });

      set((state) => ({
        deals: state.deals.filter((d) => d.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting deal:', error);
      throw error;
    }
  },

  // Activity Actions
  setActivities: (activities) => set({ activities }),

  addActivity: async (activity) => {
    try {
      const newActivity = await activityService.create(activity);
      set((state) => ({
        activities: [newActivity, ...state.activities].slice(0, 100),
      }));
      return newActivity;
    } catch (error) {
      console.error('Error adding activity:', error);
      throw error;
    }
  },

  // User Actions
  setUsers: (users) => set({ users }),

  loadUsers: async () => {
    try {
      const users = await userService.getAll();
      set({ users });
    } catch (error) {
      console.error('Error loading users:', error);
    }
  },

  addUser: async (user) => {
    try {
      const newUser = await userService.create(user);

      // Log activity
      await activityService.create({
        user_id: get().currentUserId || '',
        action: 'user_created',
        entity_type: 'user',
        entity_id: newUser.id,
        entity_name: newUser.full_name,
      });

      // Log audit
      await auditLogService.create({
        user_id: get().currentUserId || '',
        action: 'user_created',
        entity_type: 'user',
        entity_id: newUser.id,
        new_value: { full_name: newUser.full_name, email: newUser.email, role: newUser.role },
      });

      set((state) => ({
        users: [...state.users, newUser],
      }));

      return newUser;
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  },

  updateUser: async (id, updates) => {
    try {
      const oldUser = get().users.find(u => u.id === id);
      const updatedUser = await userService.update(id, updates);

      // Log audit
      await auditLogService.create({
        user_id: get().currentUserId || '',
        action: 'user_updated',
        entity_type: 'user',
        entity_id: id,
        old_value: oldUser ? { full_name: oldUser.full_name, role: oldUser.role, status: oldUser.status } : undefined,
        new_value: updates,
      });

      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updatedUser : u)),
      }));

      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      const user = get().users.find(u => u.id === id);
      await userService.delete(id);

      // Log audit
      await auditLogService.create({
        user_id: get().currentUserId || '',
        action: 'user_deleted',
        entity_type: 'user',
        entity_id: id,
        old_value: user ? { full_name: user.full_name, email: user.email } : undefined,
      });

      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  toggleUserStatus: async (id) => {
    try {
      const user = get().users.find(u => u.id === id);
      const newStatus = user?.status === 'active' ? 'inactive' : 'active';
      const updatedUser = await userService.toggleStatus(id, newStatus);

      // Log audit
      await auditLogService.create({
        user_id: get().currentUserId || '',
        action: 'user_status_changed',
        entity_type: 'user',
        entity_id: id,
        old_value: { status: user?.status },
        new_value: { status: newStatus },
      });

      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updatedUser : u)),
      }));

      return updatedUser;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  },

  changeUserPassword: async (id, newPassword) => {
    try {
      const user = get().users.find(u => u.id === id);
      await userService.changePassword(id, newPassword);

      // Log audit
      await auditLogService.create({
        user_id: get().currentUserId || '',
        action: 'password_changed',
        entity_type: 'user',
        entity_id: id,
        new_value: { user_name: user?.full_name, changed_by: 'admin' },
      });
    } catch (error) {
      console.error('Error changing user password:', error);
      throw error;
    }
  },

  sendPasswordResetEmail: async (email) => {
    try {
      await userService.sendPasswordResetEmail(email);

      // Log audit
      await auditLogService.create({
        user_id: get().currentUserId || '',
        action: 'password_reset_requested',
        entity_type: 'user',
        entity_id: '',
        new_value: { email, requested_by: 'admin' },
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  },

  // Audit Log Actions
  addAuditLog: async (log) => {
    try {
      const newLog = await auditLogService.create(log);
      set((state) => ({
        auditLogs: [newLog, ...state.auditLogs].slice(0, 500),
      }));
      return newLog;
    } catch (error) {
      console.error('Error adding audit log:', error);
      throw error;
    }
  },

  loadAuditLogs: async (filters) => {
    try {
      const logs = await auditLogService.getAll(filters);
      set({ auditLogs: logs });
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  },

  // Notification Actions
  loadNotifications: async (userId) => {
    try {
      const notifications = await notificationService.getForUser(userId);
      set({ notifications });
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  },

  addNotification: async (notification) => {
    try {
      const newNotification = await notificationService.create(notification);
      set((state) => ({
        notifications: [newNotification, ...state.notifications].slice(0, 100),
      }));
      return newNotification;
    } catch (error) {
      console.error('Error adding notification:', error);
      throw error;
    }
  },

  markNotificationRead: async (id) => {
    try {
      await notificationService.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ),
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllNotificationsRead: async (userId) => {
    try {
      await notificationService.markAllAsRead(userId);
      set((state) => ({
        notifications: state.notifications.map(n =>
          n.recipient_id === userId ? { ...n, read: true } : n
        ),
      }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  deleteNotification: async (id) => {
    try {
      await notificationService.delete(id);
      set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  },

  getNotificationsForUser: (userId) => {
    return get().notifications.filter(n => n.recipient_id === userId);
  },

  getUnreadCountForUser: (userId) => {
    return get().notifications.filter(n => n.recipient_id === userId && !n.read).length;
  },

  // Announcement Actions
  loadAnnouncements: async () => {
    try {
      const announcements = await announcementService.getActive();
      set({ announcements });
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  },

  addAnnouncement: async (announcement) => {
    try {
      const newAnnouncement = await announcementService.create(announcement);
      set((state) => ({
        announcements: [newAnnouncement, ...state.announcements],
      }));
      return newAnnouncement;
    } catch (error) {
      console.error('Error adding announcement:', error);
      throw error;
    }
  },

  deleteAnnouncement: async (id) => {
    try {
      await announcementService.delete(id);
      set((state) => ({
        announcements: state.announcements.filter(a => a.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  },

  getActiveAnnouncements: () => {
    const now = new Date();
    return get().announcements.filter(a =>
      !a.expires_at || new Date(a.expires_at) > now
    );
  },

  // UI Actions
  setSearchQuery: (query) => set({ searchQuery: query }),
  setError: (error) => set({ error }),

  // Computed stats
  getStats: async (userId, isAdmin) => {
    try {
      return await statsService.getDashboardStats(userId, isAdmin);
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        total_properties: 0,
        properties_sold: 0,
        team_size: 0,
        active_leads: 0,
        total_value: 0,
        available_properties: 0,
      };
    }
  },

  getPropertyById: (id) => get().properties.find(p => p.id === id),
  getLeadById: (id) => get().leads.find(l => l.id === id),
  getUserById: (id) => get().users.find(u => u.id === id),

  // Data access with isolation (from cache)
  // All users can view all properties (CRM agents need visibility into all listings)
  getPropertiesForUser: (_userId, _isAdmin) => {
    const state = get();
    // All users can see all properties - this is a CRM where agents need full visibility
    return state.properties;
  },

  getLeadsForUser: (userId, isAdmin) => {
    const state = get();
    if (isAdmin) return state.leads;
    return state.leads.filter(l => l.created_by === userId || l.assigned_to === userId);
  },

  getDealsForUser: (_userId, _isAdmin) => {
    const state = get();
    // All users can see all deals - this is a CRM where agents need full visibility
    // into all deals to understand property status and client relationships
    return state.deals;
  },

  getActivitiesForUser: (userId, isAdmin) => {
    const state = get();
    if (isAdmin) return state.activities;
    return state.activities.filter(a => a.user_id === userId);
  },

  // Admin functions
  getUserActivitySummary: (userId) => {
    const state = get();
    return {
      leads: state.leads.filter(l => l.created_by === userId).length,
      properties: state.properties.filter(p => p.created_by === userId).length,
      deals: state.deals.filter(d => d.created_by === userId || d.closer_id === userId).length,
    };
  },

  getAuditLogs: (filters) => {
    let logs = get().auditLogs;

    if (filters?.userId) {
      logs = logs.filter(l => l.user_id === filters.userId);
    }
    if (filters?.entityType) {
      logs = logs.filter(l => l.entity_type === filters.entityType);
    }
    if (filters?.action) {
      logs = logs.filter(l => l.action.includes(filters.action as string));
    }

    return logs;
  },
}));
