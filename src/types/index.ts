export type UserRole = 'admin' | 'user';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string;
  phone?: string;
  password_hash?: string; // For demo mode only
  last_login?: string;
  created_at: string;
  updated_at: string;
}

// Property Types
export type PropertyStatus = 'draft' | 'available' | 'under_offer' | 'sold' | 'rented' | 'archived';
export type PropertyType = 'apartment' | 'villa' | 'townhouse' | 'penthouse' | 'office' | 'retail' | 'land';

export interface PropertyMedia {
  id: string;
  type: 'image' | 'video' | 'pdf';
  url: string;
  name: string;
  size: number;
  uploaded_at: string;
}

export interface Property {
  id: string;
  title: string;
  description?: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  location: string;
  area_sqft: number;
  bedrooms?: number;
  bathrooms?: number;
  images: string[];
  videos?: PropertyMedia[];
  documents?: PropertyMedia[];
  media?: PropertyMedia[];
  features: string[];
  is_offplan?: boolean;
  owner_name?: string;
  owner_phone?: string;
  created_by: string;
  creator?: User;
  created_at: string;
  updated_at: string;
}

// Lead Types
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'viewing_scheduled' | 'negotiating' | 'won' | 'lost' | 'archived';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  budget_min?: number;
  budget_max?: number;
  preferred_type?: PropertyType;
  preferred_location?: string;
  notes?: string;
  assigned_to?: string;
  assignee?: User;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Deal Types
export type DealStatus = 'pending' | 'in_progress' | 'closed' | 'cancelled';

export interface DealAttachment {
  id: string;
  url: string;
  name: string;
  size: number;
  uploaded_at: string;
}

export interface Deal {
  id: string;
  property_id: string;
  property?: Property;
  lead_id?: string;
  lead?: Lead;
  deal_value: number;
  commission_rate: number;
  commission_amount: number;
  status: DealStatus;
  closer_id: string;
  closer?: User;
  closed_at?: string;
  notes?: string;
  attachments?: DealAttachment[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Activity Types
export type ActivityAction =
  | 'property_added'
  | 'property_updated'
  | 'property_sold'
  | 'property_archived'
  | 'lead_added'
  | 'lead_updated'
  | 'lead_converted'
  | 'lead_archived'
  | 'deal_created'
  | 'deal_updated'
  | 'deal_closed'
  | 'login'
  | 'logout'
  | 'user_created'
  | 'user_updated'
  | 'password_changed'
  | 'profile_updated';

export interface Activity {
  id: string;
  user_id: string;
  user?: User;
  action: ActivityAction;
  entity_type: 'property' | 'lead' | 'deal' | 'user';
  entity_id: string;
  entity_name: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Dashboard Stats
export interface DashboardStats {
  total_properties: number;
  properties_sold: number;
  team_size: number;
  active_leads: number;
  total_value: number;
  available_properties: number;
}

// Audit Log
export interface AuditLog {
  id: string;
  user_id: string;
  user?: User;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

// Notification Types
export type NotificationType =
  | 'property_added'
  | 'property_updated'
  | 'deal_created'
  | 'deal_updated'
  | 'deal_closed'
  | 'lead_added'
  | 'lead_assigned'
  | 'lead_import'
  | 'announcement'
  | 'password_changed'
  | 'profile_updated'
  | 'user_created'
  | 'approval_request';

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  recipient_id: string; // User ID who should see this notification
  sender_id?: string; // User ID who triggered the notification
  sender?: User;
  entity_type?: 'property' | 'lead' | 'deal' | 'user' | 'import';
  entity_id?: string;
  read: boolean;
  created_at: string;
}

// Announcement (Admin broadcasts to all users)
export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  created_by: string;
  creator?: User;
  created_at: string;
  expires_at?: string;
}

// Referral Earnings Types
export type ReferralEarningType = 'signup_fee' | 'commission_share';

export interface ReferralEarning {
  id: string;
  referrer_id: string;
  referrer?: User;
  referred_agent_id: string;
  referred_agent?: User;
  deal_id?: string;
  deal?: Deal;
  earning_type: ReferralEarningType;
  earning_amount: number;
  description?: string;
  created_at: string;
}

export interface ReferredAgent {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  status: UserStatus;
  deals_closed: number;
  total_earnings_generated: number;
  joined_at: string;
}

export interface ReferralSummary {
  total_referrals: number;
  total_earnings_lifetime: number;
  total_earnings_this_month: number;
  referred_agents: ReferredAgent[];
}

// Rewards Types
export type RewardCategory = 'cash_bonus' | 'gift_voucher' | 'experience' | 'recognition_badge';
export type RewardCriteriaType = 'points' | 'deals_closed' | 'revenue_earned' | 'leads_converted' | 'manual';
export type UserRewardStatus = 'locked' | 'available' | 'earned' | 'fulfilled';

export interface Reward {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  points_required: number;
  category: RewardCategory;
  criteria_type?: RewardCriteriaType;
  criteria_value?: number;
  is_active: boolean;
  sort_order: number;
  created_by?: string;
  creator?: User;
  created_at: string;
  updated_at: string;
}

export interface UserReward {
  id: string;
  user_id: string;
  user?: User;
  reward_id: string;
  reward?: Reward;
  status: UserRewardStatus;
  progress: number;
  earned_at?: string;
  fulfilled_at?: string;
  fulfilled_by?: string;
  fulfiller?: User;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRewardWithDetails extends UserReward {
  reward: Reward;
}
