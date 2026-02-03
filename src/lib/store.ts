import { create } from 'zustand';
import type { Property, Lead, Deal, Activity, User, DashboardStats, AuditLog, ActivityAction, Notification, Announcement } from '@/types';

// Demo data for the application (Admin/User roles only)
const DEMO_USERS: User[] = [
  { id: '1', email: 'admin@nebriix.com', full_name: 'Ahmed Al-Rashid', role: 'admin', status: 'active', phone: '+971 50 123 4567', created_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z' },
  { id: '2', email: 'user@nebriix.com', full_name: 'Sarah Thompson', role: 'user', status: 'active', phone: '+971 50 234 5678', created_at: '2024-02-20T10:00:00Z', updated_at: '2024-02-20T10:00:00Z' },
  { id: '3', email: 'john@nebriix.com', full_name: 'John Smith', role: 'user', status: 'active', created_at: '2024-03-10T10:00:00Z', updated_at: '2024-03-10T10:00:00Z' },
];

const DEMO_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Dubai Marina Penthouse',
    description: 'Stunning penthouse with panoramic marina views',
    type: 'penthouse',
    status: 'available',
    price: 8500000,
    location: 'Dubai Marina',
    area_sqft: 4200,
    bedrooms: 4,
    bathrooms: 5,
    images: ['/placeholder-property.jpg'],
    features: ['Private pool', 'Smart home', 'Marina view', 'Private elevator'],
    owner_name: 'Khalid Al-Mansour',
    owner_phone: '+971501234567',
    created_by: '1',
    created_at: '2024-06-01T10:00:00Z',
    updated_at: '2024-06-01T10:00:00Z',
  },
  {
    id: '2',
    title: 'Palm Jumeirah Villa',
    description: 'Luxurious beachfront villa on the Palm',
    type: 'villa',
    status: 'under_offer',
    price: 25000000,
    location: 'Palm Jumeirah',
    area_sqft: 12000,
    bedrooms: 6,
    bathrooms: 8,
    images: ['/placeholder-property.jpg'],
    features: ['Private beach', 'Infinity pool', 'Home cinema', 'Staff quarters'],
    owner_name: 'Sultan Investment Group',
    owner_phone: '+971502345678',
    created_by: '2',
    created_at: '2024-05-15T10:00:00Z',
    updated_at: '2024-06-10T10:00:00Z',
  },
  {
    id: '3',
    title: 'Downtown Boulevard Apartment',
    description: 'Modern apartment with Burj Khalifa view',
    type: 'apartment',
    status: 'sold',
    price: 3200000,
    location: 'Downtown Dubai',
    area_sqft: 1800,
    bedrooms: 2,
    bathrooms: 3,
    images: ['/placeholder-property.jpg'],
    features: ['Burj view', 'Gym access', 'Concierge', 'Parking'],
    created_by: '3',
    created_at: '2024-04-20T10:00:00Z',
    updated_at: '2024-06-05T10:00:00Z',
  },
  {
    id: '4',
    title: 'JBR Beach Residence',
    description: 'Beachfront living at Jumeirah Beach Residence',
    type: 'apartment',
    status: 'rented',
    price: 180000,
    location: 'JBR',
    area_sqft: 2200,
    bedrooms: 3,
    bathrooms: 4,
    images: ['/placeholder-property.jpg'],
    features: ['Beach access', 'Sea view', 'Kids play area', 'BBQ area'],
    created_by: '2',
    created_at: '2024-05-01T10:00:00Z',
    updated_at: '2024-05-20T10:00:00Z',
  },
  {
    id: '5',
    title: 'Business Bay Office Tower',
    description: 'Grade A office space in Business Bay',
    type: 'office',
    status: 'available',
    price: 4500000,
    location: 'Business Bay',
    area_sqft: 5500,
    images: ['/placeholder-property.jpg'],
    features: ['Canal view', 'Meeting rooms', 'Parking', '24/7 security'],
    created_by: '1',
    created_at: '2024-06-08T10:00:00Z',
    updated_at: '2024-06-08T10:00:00Z',
  },
  {
    id: '6',
    title: 'Emirates Hills Mansion',
    description: 'Exclusive golf course mansion',
    type: 'villa',
    status: 'available',
    price: 45000000,
    location: 'Emirates Hills',
    area_sqft: 18000,
    bedrooms: 8,
    bathrooms: 10,
    images: ['/placeholder-property.jpg'],
    features: ['Golf course view', 'Private garden', 'Tennis court', 'Wine cellar'],
    owner_name: 'Private Owner',
    created_by: '1',
    created_at: '2024-06-12T10:00:00Z',
    updated_at: '2024-06-12T10:00:00Z',
  },
];

const DEMO_LEADS: Lead[] = [
  {
    id: '1',
    name: 'James Wilson',
    email: 'james.wilson@email.com',
    phone: '+971501111111',
    source: 'Website',
    status: 'new',
    budget_min: 5000000,
    budget_max: 10000000,
    preferred_type: 'penthouse',
    preferred_location: 'Dubai Marina',
    notes: 'Looking for high-floor unit with sea view',
    assigned_to: '2',
    created_by: '2',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: '2',
    name: 'Fatima Al-Sayed',
    email: 'fatima.alsayed@email.com',
    phone: '+971502222222',
    source: 'Referral',
    status: 'contacted',
    budget_min: 20000000,
    budget_max: 30000000,
    preferred_type: 'villa',
    preferred_location: 'Palm Jumeirah',
    notes: 'Cash buyer, ready to move quickly',
    assigned_to: '3',
    created_by: '1',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: '3',
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '+971503333333',
    source: 'Property Finder',
    status: 'qualified',
    budget_min: 2000000,
    budget_max: 4000000,
    preferred_type: 'apartment',
    preferred_location: 'Downtown Dubai',
    notes: 'Investment property, wants high ROI',
    assigned_to: '2',
    created_by: '2',
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: '4',
    name: 'Elena Rodriguez',
    email: 'elena.r@email.com',
    phone: '+971504444444',
    source: 'Instagram',
    status: 'viewing_scheduled',
    budget_min: 3000000,
    budget_max: 5000000,
    preferred_type: 'townhouse',
    preferred_location: 'Arabian Ranches',
    notes: 'Family with 3 kids, needs good schools nearby',
    assigned_to: '3',
    created_by: '3',
    created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: '5',
    name: 'Ahmed Khalil',
    email: 'ahmed.k@email.com',
    phone: '+971505555555',
    source: 'Walk-in',
    status: 'negotiating',
    budget_min: 8000000,
    budget_max: 12000000,
    preferred_type: 'penthouse',
    preferred_location: 'Dubai Marina',
    notes: 'Negotiating on unit 1, interested in marina penthouse',
    assigned_to: '2',
    created_by: '2',
    created_at: new Date(Date.now() - 96 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
];

const DEMO_DEALS: Deal[] = [
  {
    id: '1',
    property_id: '3',
    lead_id: '6',
    deal_value: 3200000,
    commission_rate: 2,
    commission_amount: 64000,
    status: 'closed',
    closer_id: '2',
    created_by: '2',
    closed_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    notes: 'Smooth transaction, client very happy',
    created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
  {
    id: '2',
    property_id: '2',
    lead_id: '2',
    deal_value: 25000000,
    commission_rate: 1.5,
    commission_amount: 375000,
    status: 'in_progress',
    closer_id: '3',
    created_by: '3',
    notes: 'Under negotiation, client reviewing contract',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: '3',
    property_id: '1',
    lead_id: '5',
    deal_value: 8500000,
    commission_rate: 2,
    commission_amount: 170000,
    status: 'pending',
    closer_id: '2',
    created_by: '2',
    notes: 'Initial offer submitted, awaiting response',
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
];

const DEMO_ACTIVITIES: Activity[] = [
  { id: '1', user_id: '2', action: 'lead_added', entity_type: 'lead', entity_id: '1', entity_name: 'James Wilson', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: '2', user_id: '2', action: 'deal_closed', entity_type: 'deal', entity_id: '1', entity_name: 'Downtown Boulevard Apartment', metadata: { value: 3200000 }, created_at: new Date(Date.now() - 48 * 3600000).toISOString() },
  { id: '3', user_id: '1', action: 'property_added', entity_type: 'property', entity_id: '6', entity_name: 'Emirates Hills Mansion', created_at: new Date(Date.now() - 72 * 3600000).toISOString() },
  { id: '4', user_id: '3', action: 'lead_added', entity_type: 'lead', entity_id: '4', entity_name: 'Elena Rodriguez', created_at: new Date(Date.now() - 72 * 3600000).toISOString() },
  { id: '5', user_id: '2', action: 'login', entity_type: 'user', entity_id: '2', entity_name: 'Sarah Thompson', created_at: new Date(Date.now() - 4 * 3600000).toISOString() },
];

// Initial audit log entries
const DEMO_AUDIT_LOGS: AuditLog[] = [
  { id: '1', user_id: '1', action: 'user_created', entity_type: 'user', entity_id: '2', new_value: { full_name: 'Sarah Thompson', email: 'user@nebriix.com', role: 'user' }, created_at: '2024-02-20T10:00:00Z' },
  { id: '2', user_id: '1', action: 'user_created', entity_type: 'user', entity_id: '3', new_value: { full_name: 'John Smith', email: 'john@nebriix.com', role: 'user' }, created_at: '2024-03-10T10:00:00Z' },
  { id: '3', user_id: '1', action: 'property_added', entity_type: 'property', entity_id: '1', new_value: { title: 'Dubai Marina Penthouse', price: 8500000 }, created_at: '2024-06-01T10:00:00Z' },
  { id: '4', user_id: '2', action: 'property_added', entity_type: 'property', entity_id: '2', new_value: { title: 'Palm Jumeirah Villa', price: 25000000 }, created_at: '2024-05-15T10:00:00Z' },
  { id: '5', user_id: '2', action: 'lead_added', entity_type: 'lead', entity_id: '1', new_value: { name: 'James Wilson', status: 'new' }, created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: '6', user_id: '1', action: 'lead_added', entity_type: 'lead', entity_id: '2', new_value: { name: 'Fatima Al-Sayed', status: 'contacted' }, created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: '7', user_id: '2', action: 'deal_created', entity_type: 'deal', entity_id: '1', new_value: { property: 'Downtown Boulevard Apartment', value: 3200000 }, created_at: new Date(Date.now() - 72 * 3600000).toISOString() },
  { id: '8', user_id: '2', action: 'deal_closed', entity_type: 'deal', entity_id: '1', old_value: { status: 'pending' }, new_value: { status: 'closed', commission: 64000 }, created_at: new Date(Date.now() - 48 * 3600000).toISOString() },
  { id: '9', user_id: '2', action: 'login', entity_type: 'user', entity_id: '2', created_at: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: '10', user_id: '1', action: 'login', entity_type: 'user', entity_id: '1', created_at: new Date(Date.now() - 1 * 3600000).toISOString() },
];

interface AppState {
  // Data
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
  currentUserId: string | null;

  // Set current user (for data isolation)
  setCurrentUser: (userId: string | null) => void;

  // Property Actions
  setProperties: (properties: Property[]) => void;
  addProperty: (property: Property) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  archiveProperty: (id: string) => void;

  // Lead Actions
  setLeads: (leads: Lead[]) => void;
  addLead: (lead: Lead) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  archiveLead: (id: string) => void;

  // Deal Actions
  setDeals: (deals: Deal[]) => void;
  addDeal: (deal: Deal) => void;
  updateDeal: (id: string, updates: Partial<Deal>) => void;

  // Activity Actions
  setActivities: (activities: Activity[]) => void;
  addActivity: (activity: Activity) => void;

  // User Actions
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  toggleUserStatus: (id: string) => void;

  // Audit Log Actions
  addAuditLog: (log: Omit<AuditLog, 'id' | 'created_at'>) => void;

  // Notification Actions
  addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  deleteNotification: (id: string) => void;
  getNotificationsForUser: (userId: string) => Notification[];
  getUnreadCountForUser: (userId: string) => number;

  // Announcement Actions
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'created_at'>) => void;
  deleteAnnouncement: (id: string) => void;
  getActiveAnnouncements: () => Announcement[];

  // UI Actions
  setSearchQuery: (query: string) => void;

  // Computed (with data isolation)
  getStats: (isAdmin?: boolean) => DashboardStats;
  getPropertyById: (id: string) => Property | undefined;
  getLeadById: (id: string) => Lead | undefined;
  getUserById: (id: string) => User | undefined;

  // Data Access (with isolation)
  getPropertiesForUser: (userId: string, isAdmin: boolean) => Property[];
  getLeadsForUser: (userId: string, isAdmin: boolean) => Lead[];
  getDealsForUser: (userId: string, isAdmin: boolean) => Deal[];
  getActivitiesForUser: (userId: string, isAdmin: boolean) => Activity[];

  // Admin functions
  getUserActivitySummary: (userId: string) => { leads: number; properties: number; deals: number };
  getAuditLogs: (filters?: { userId?: string; entityType?: string; action?: string }) => AuditLog[];
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initialize with demo data
  properties: DEMO_PROPERTIES.map(p => ({ ...p, creator: DEMO_USERS.find(u => u.id === p.created_by) })),
  leads: DEMO_LEADS.map(l => ({ ...l, assignee: DEMO_USERS.find(u => u.id === l.assigned_to) })),
  deals: DEMO_DEALS.map(d => ({
    ...d,
    property: DEMO_PROPERTIES.find(p => p.id === d.property_id),
    lead: DEMO_LEADS.find(l => l.id === d.lead_id),
    closer: DEMO_USERS.find(u => u.id === d.closer_id),
  })),
  activities: DEMO_ACTIVITIES.map(a => ({ ...a, user: DEMO_USERS.find(u => u.id === a.user_id) })),
  users: DEMO_USERS,
  auditLogs: DEMO_AUDIT_LOGS.map(log => ({ ...log, user: DEMO_USERS.find(u => u.id === log.user_id) })),
  notifications: [],
  announcements: [],
  searchQuery: '',
  isLoading: false,
  currentUserId: null,

  setCurrentUser: (userId) => set({ currentUserId: userId }),

  // Property Actions
  setProperties: (properties) => set({ properties }),

  addProperty: (property) => set((state) => {
    const creator = state.users.find(u => u.id === property.created_by);
    const allUsers = state.users.filter(u => u.role === 'user' && u.status === 'active');

    // Create notifications for all users when admin adds a property
    const userNotifications = creator?.role === 'admin' ? allUsers.map(user => ({
      id: `${Date.now()}-${user.id}`,
      type: 'property_added' as const,
      title: 'New Property Listed',
      message: `New property available: ${property.title} in ${property.location}`,
      priority: 'medium' as const,
      recipient_id: user.id,
      sender_id: property.created_by,
      sender: creator,
      entity_type: 'property' as const,
      entity_id: property.id,
      read: false,
      created_at: new Date().toISOString(),
    })) : [];

    return {
      properties: [property, ...state.properties],
      activities: [{
        id: Date.now().toString(),
        user_id: property.created_by,
        user: creator,
        action: 'property_added' as ActivityAction,
        entity_type: 'property',
        entity_id: property.id,
        entity_name: property.title,
        created_at: new Date().toISOString(),
      }, ...state.activities],
      auditLogs: [{
        id: Date.now().toString(),
        user_id: property.created_by,
        user: creator,
        action: 'property_added',
        entity_type: 'property',
        entity_id: property.id,
        new_value: { title: property.title, price: property.price, location: property.location, status: property.status },
        created_at: new Date().toISOString(),
      }, ...state.auditLogs],
      notifications: [...userNotifications, ...state.notifications],
    };
  }),

  updateProperty: (id, updates) => set((state) => {
    const property = state.properties.find(p => p.id === id);
    return {
      properties: state.properties.map((p) => (p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p)),
      auditLogs: [{
        id: Date.now().toString(),
        user_id: state.currentUserId || '1',
        user: state.users.find(u => u.id === (state.currentUserId || '1')),
        action: 'property_updated',
        entity_type: 'property',
        entity_id: id,
        old_value: property ? { title: property.title, price: property.price, status: property.status } : undefined,
        new_value: updates,
        created_at: new Date().toISOString(),
      }, ...state.auditLogs],
    };
  }),

  deleteProperty: (id) => set((state) => {
    const property = state.properties.find(p => p.id === id);
    return {
      properties: state.properties.filter((p) => p.id !== id),
      auditLogs: [{
        id: Date.now().toString(),
        user_id: state.currentUserId || '1',
        user: state.users.find(u => u.id === (state.currentUserId || '1')),
        action: 'property_deleted',
        entity_type: 'property',
        entity_id: id,
        old_value: property ? { title: property.title, price: property.price } : undefined,
        created_at: new Date().toISOString(),
      }, ...state.auditLogs],
    };
  }),

  archiveProperty: (id) => set((state) => {
    const property = state.properties.find(p => p.id === id);
    return {
      properties: state.properties.map((p) =>
        p.id === id ? { ...p, status: 'archived' as const, updated_at: new Date().toISOString() } : p
      ),
      activities: [{
        id: Date.now().toString(),
        user_id: state.currentUserId || '1',
        action: 'property_archived' as ActivityAction,
        entity_type: 'property',
        entity_id: id,
        entity_name: property?.title || 'Property',
        created_at: new Date().toISOString(),
      }, ...state.activities],
      auditLogs: [{
        id: Date.now().toString(),
        user_id: state.currentUserId || '1',
        user: state.users.find(u => u.id === (state.currentUserId || '1')),
        action: 'property_archived',
        entity_type: 'property',
        entity_id: id,
        old_value: property ? { status: property.status } : undefined,
        new_value: { status: 'archived' },
        created_at: new Date().toISOString(),
      }, ...state.auditLogs],
    };
  }),

  // Lead Actions
  setLeads: (leads) => set({ leads }),

  addLead: (lead) => set((state) => {
    const creator = state.users.find(u => u.id === lead.created_by);
    const admins = state.users.filter(u => u.role === 'admin' && u.id !== lead.created_by);

    // Create notifications for all admins when a non-admin user adds a lead
    const adminNotifications = creator?.role !== 'admin' ? admins.map(admin => ({
      id: `${Date.now()}-${admin.id}`,
      type: 'lead_added' as const,
      title: 'New Lead Added',
      message: `${creator?.full_name || 'A user'} added a new lead: ${lead.name}`,
      priority: 'medium' as const,
      recipient_id: admin.id,
      sender_id: lead.created_by,
      sender: creator,
      entity_type: 'lead' as const,
      entity_id: lead.id,
      read: false,
      created_at: new Date().toISOString(),
    })) : [];

    return {
      leads: [lead, ...state.leads],
      activities: [{
        id: Date.now().toString(),
        user_id: lead.created_by,
        user: creator,
        action: 'lead_added' as ActivityAction,
        entity_type: 'lead',
        entity_id: lead.id,
        entity_name: lead.name,
        created_at: new Date().toISOString(),
      }, ...state.activities],
      auditLogs: [{
        id: Date.now().toString(),
        user_id: lead.created_by,
        user: creator,
        action: 'lead_added',
        entity_type: 'lead',
        entity_id: lead.id,
        new_value: { name: lead.name, status: lead.status, source: lead.source },
        created_at: new Date().toISOString(),
      }, ...state.auditLogs],
      notifications: [...adminNotifications, ...state.notifications],
    };
  }),

  updateLead: (id, updates) => set((state) => {
    const lead = state.leads.find(l => l.id === id);
    return {
      leads: state.leads.map((l) => (l.id === id ? { ...l, ...updates, updated_at: new Date().toISOString() } : l)),
      auditLogs: [{
        id: Date.now().toString(),
        user_id: state.currentUserId || '1',
        user: state.users.find(u => u.id === (state.currentUserId || '1')),
        action: 'lead_updated',
        entity_type: 'lead',
        entity_id: id,
        old_value: lead ? { name: lead.name, status: lead.status } : undefined,
        new_value: updates,
        created_at: new Date().toISOString(),
      }, ...state.auditLogs],
    };
  }),

  deleteLead: (id) => set((state) => {
    const lead = state.leads.find(l => l.id === id);
    return {
      leads: state.leads.filter((l) => l.id !== id),
      auditLogs: [{
        id: Date.now().toString(),
        user_id: state.currentUserId || '1',
        user: state.users.find(u => u.id === (state.currentUserId || '1')),
        action: 'lead_deleted',
        entity_type: 'lead',
        entity_id: id,
        old_value: lead ? { name: lead.name, status: lead.status } : undefined,
        created_at: new Date().toISOString(),
      }, ...state.auditLogs],
    };
  }),

  archiveLead: (id) => set((state) => {
    const lead = state.leads.find(l => l.id === id);
    return {
      leads: state.leads.map((l) =>
        l.id === id ? { ...l, status: 'archived' as const, updated_at: new Date().toISOString() } : l
      ),
      activities: [{
        id: Date.now().toString(),
        user_id: state.currentUserId || '1',
        action: 'lead_archived' as ActivityAction,
        entity_type: 'lead',
        entity_id: id,
        entity_name: lead?.name || 'Lead',
        created_at: new Date().toISOString(),
      }, ...state.activities],
      auditLogs: [{
        id: Date.now().toString(),
        user_id: state.currentUserId || '1',
        user: state.users.find(u => u.id === (state.currentUserId || '1')),
        action: 'lead_archived',
        entity_type: 'lead',
        entity_id: id,
        old_value: lead ? { status: lead.status } : undefined,
        new_value: { status: 'archived' },
        created_at: new Date().toISOString(),
      }, ...state.auditLogs],
    };
  }),

  // Deal Actions
  setDeals: (deals) => set({ deals }),

  addDeal: (deal) => set((state) => {
    const creator = state.users.find(u => u.id === (deal.created_by || deal.closer_id));
    const closer = state.users.find(u => u.id === deal.closer_id);
    const allUsers = state.users.filter(u => u.role === 'user' && u.status === 'active');

    // Notify all users when admin creates a deal
    const userNotifications = creator?.role === 'admin' ? allUsers.map(user => ({
      id: `${Date.now()}-${user.id}`,
      type: 'deal_created' as const,
      title: 'New Deal Created',
      message: `New deal created for ${deal.property?.title || 'a property'} - Value: AED ${deal.deal_value.toLocaleString()}`,
      priority: 'medium' as const,
      recipient_id: user.id,
      sender_id: deal.created_by || deal.closer_id,
      sender: creator,
      entity_type: 'deal' as const,
      entity_id: deal.id,
      read: false,
      created_at: new Date().toISOString(),
    })) : [];

    // Notify the closer if they are different from creator
    const closerNotification = closer && closer.id !== (deal.created_by || deal.closer_id) ? [{
      id: `${Date.now()}-closer-${closer.id}`,
      type: 'deal_created' as const,
      title: 'Deal Assigned to You',
      message: `You have been assigned as closer for ${deal.property?.title || 'a property'}`,
      priority: 'high' as const,
      recipient_id: closer.id,
      sender_id: deal.created_by || deal.closer_id,
      sender: creator,
      entity_type: 'deal' as const,
      entity_id: deal.id,
      read: false,
      created_at: new Date().toISOString(),
    }] : [];

    return {
      deals: [deal, ...state.deals],
      activities: [{
        id: Date.now().toString(),
        user_id: deal.created_by || deal.closer_id,
        user: creator,
        action: 'deal_created' as ActivityAction,
        entity_type: 'deal',
        entity_id: deal.id,
        entity_name: deal.property?.title || 'New Deal',
        created_at: new Date().toISOString(),
      }, ...state.activities],
      auditLogs: [{
        id: Date.now().toString(),
        user_id: deal.created_by || deal.closer_id,
        user: creator,
        action: 'deal_created',
        entity_type: 'deal',
        entity_id: deal.id,
        new_value: { property: deal.property?.title, value: deal.deal_value, status: deal.status },
        created_at: new Date().toISOString(),
      }, ...state.auditLogs],
      notifications: [...userNotifications, ...closerNotification, ...state.notifications],
    };
  }),

  updateDeal: (id, updates) => set((state) => {
    const deal = state.deals.find(d => d.id === id);
    return {
      deals: state.deals.map((d) => (d.id === id ? { ...d, ...updates, updated_at: new Date().toISOString() } : d)),
      auditLogs: [{
        id: Date.now().toString(),
        user_id: state.currentUserId || '1',
        user: state.users.find(u => u.id === (state.currentUserId || '1')),
        action: updates.status === 'closed' ? 'deal_closed' : 'deal_updated',
        entity_type: 'deal',
        entity_id: id,
        old_value: deal ? { status: deal.status, value: deal.deal_value } : undefined,
        new_value: updates,
        created_at: new Date().toISOString(),
      }, ...state.auditLogs],
    };
  }),

  // Activity Actions
  setActivities: (activities) => set({ activities }),

  addActivity: (activity) => set((state) => ({
    activities: [activity, ...state.activities].slice(0, 100),
  })),

  // User Actions
  setUsers: (users) => set({ users }),

  addUser: (user) => set((state) => ({
    users: [...state.users, user],
    activities: [{
      id: Date.now().toString(),
      user_id: state.currentUserId || '1',
      user: state.users.find(u => u.id === (state.currentUserId || '1')),
      action: 'user_created' as ActivityAction,
      entity_type: 'user',
      entity_id: user.id,
      entity_name: user.full_name,
      created_at: new Date().toISOString(),
    }, ...state.activities],
    auditLogs: [{
      id: Date.now().toString(),
      user_id: state.currentUserId || '1',
      user: state.users.find(u => u.id === (state.currentUserId || '1')),
      action: 'user_created',
      entity_type: 'user',
      entity_id: user.id,
      new_value: { full_name: user.full_name, email: user.email, role: user.role },
      created_at: new Date().toISOString(),
    }, ...state.auditLogs],
  })),

  updateUser: (id, updates) => set((state) => {
    const user = state.users.find(u => u.id === id);
    return {
      users: state.users.map((u) => (u.id === id ? { ...u, ...updates, updated_at: new Date().toISOString() } : u)),
      auditLogs: [{
        id: Date.now().toString(),
        user_id: state.currentUserId || '1',
        user: state.users.find(u => u.id === (state.currentUserId || '1')),
        action: 'user_updated',
        entity_type: 'user',
        entity_id: id,
        old_value: user ? { full_name: user.full_name, role: user.role, status: user.status } : undefined,
        new_value: updates,
        created_at: new Date().toISOString(),
      }, ...state.auditLogs],
    };
  }),

  deleteUser: (id) => set((state) => {
    const user = state.users.find(u => u.id === id);
    return {
      users: state.users.filter((u) => u.id !== id),
      auditLogs: [{
        id: Date.now().toString(),
        user_id: state.currentUserId || '1',
        user: state.users.find(u => u.id === (state.currentUserId || '1')),
        action: 'user_deleted',
        entity_type: 'user',
        entity_id: id,
        old_value: user ? { full_name: user.full_name, email: user.email } : undefined,
        created_at: new Date().toISOString(),
      }, ...state.auditLogs],
    };
  }),

  toggleUserStatus: (id) => set((state) => {
    const user = state.users.find(u => u.id === id);
    const newStatus = user?.status === 'active' ? 'inactive' : 'active';
    return {
      users: state.users.map((u) =>
        u.id === id
          ? { ...u, status: newStatus, updated_at: new Date().toISOString() }
          : u
      ),
      auditLogs: [{
        id: Date.now().toString(),
        user_id: state.currentUserId || '1',
        user: state.users.find(u => u.id === (state.currentUserId || '1')),
        action: 'user_status_changed',
        entity_type: 'user',
        entity_id: id,
        old_value: { status: user?.status },
        new_value: { status: newStatus },
        created_at: new Date().toISOString(),
      }, ...state.auditLogs],
    };
  }),

  // Audit Log Actions
  addAuditLog: (log) => set((state) => ({
    auditLogs: [{
      ...log,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      user: state.users.find(u => u.id === log.user_id),
    }, ...state.auditLogs].slice(0, 500)
  })),

  // UI Actions
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Computed (with optional data isolation)
  getStats: (isAdmin = false) => {
    const state = get();
    const userId = state.currentUserId;

    // Filter data based on role
    const properties = isAdmin
      ? state.properties
      : state.properties.filter(p => p.created_by === userId);

    const leads = isAdmin
      ? state.leads
      : state.leads.filter(l => l.created_by === userId || l.assigned_to === userId);

    const deals = isAdmin
      ? state.deals
      : state.deals.filter(d => d.created_by === userId || d.closer_id === userId);

    const totalProperties = properties.length;
    const propertiesSold = properties.filter(p => p.status === 'sold').length;
    const availableProperties = properties.filter(p => p.status === 'available').length;
    const activeLeads = leads.filter(l => !['won', 'lost'].includes(l.status)).length;
    const totalValue = deals.filter(d => d.status === 'closed').reduce((sum, d) => sum + d.deal_value, 0);

    return {
      total_properties: totalProperties,
      properties_sold: propertiesSold,
      team_size: state.users.length,
      active_leads: activeLeads,
      total_value: totalValue,
      available_properties: availableProperties,
    };
  },

  getPropertyById: (id) => get().properties.find(p => p.id === id),
  getLeadById: (id) => get().leads.find(l => l.id === id),
  getUserById: (id) => get().users.find(u => u.id === id),

  // Data access with isolation
  getPropertiesForUser: (userId, isAdmin) => {
    const state = get();
    if (isAdmin) return state.properties;
    return state.properties.filter(p => p.created_by === userId);
  },

  getLeadsForUser: (userId, isAdmin) => {
    const state = get();
    if (isAdmin) return state.leads;
    return state.leads.filter(l => l.created_by === userId || l.assigned_to === userId);
  },

  getDealsForUser: (userId, isAdmin) => {
    const state = get();
    if (isAdmin) return state.deals;
    return state.deals.filter(d => d.created_by === userId || d.closer_id === userId);
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
    const state = get();
    let logs = state.auditLogs;

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

  // Notification Actions
  addNotification: (notification) => set((state) => ({
    notifications: [{
      ...notification,
      id: Date.now().toString(),
      read: false,
      created_at: new Date().toISOString(),
      sender: notification.sender_id ? state.users.find(u => u.id === notification.sender_id) : undefined,
    }, ...state.notifications].slice(0, 100), // Keep last 100 notifications
  })),

  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ),
  })),

  markAllNotificationsRead: (userId) => set((state) => ({
    notifications: state.notifications.map(n =>
      n.recipient_id === userId ? { ...n, read: true } : n
    ),
  })),

  deleteNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id),
  })),

  getNotificationsForUser: (userId) => {
    const state = get();
    return state.notifications.filter(n => n.recipient_id === userId);
  },

  getUnreadCountForUser: (userId) => {
    const state = get();
    return state.notifications.filter(n => n.recipient_id === userId && !n.read).length;
  },

  // Announcement Actions
  addAnnouncement: (announcement) => set((state) => ({
    announcements: [{
      ...announcement,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      creator: state.users.find(u => u.id === announcement.created_by),
    }, ...state.announcements],
  })),

  deleteAnnouncement: (id) => set((state) => ({
    announcements: state.announcements.filter(a => a.id !== id),
  })),

  getActiveAnnouncements: () => {
    const state = get();
    const now = new Date();
    return state.announcements.filter(a =>
      !a.expires_at || new Date(a.expires_at) > now
    );
  },
}));
