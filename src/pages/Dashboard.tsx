import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Activity, DashboardStats } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Building2,
  CheckCircle,
  Users,
  UserCheck,
  Clock,
  Calculator,
  Settings,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  ArrowRight,
  Phone,
  Mail,
  DollarSign,
  Loader2,
  Users2,
  ArrowUpRight,
} from 'lucide-react';
import { formatRelativeTime, getInitials, formatCurrency } from '@/lib/utils';
import type { ReferralSummary } from '@/types';

// SVG Sparkline component
function Sparkline({ data, color, height = 32, width = 80 }: { data: number[]; color: string; height?: number; width?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const gradientId = `sparkline-${color.replace(/[^a-z0-9]/g, '')}`;
  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradientId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" className="sparkline" />
    </svg>
  );
}

const statusColors: Record<string, string> = {
  available: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  under_offer: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  sold: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  rented: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

const statusLabels: Record<string, string> = {
  available: 'Available',
  under_offer: 'Under Offer',
  sold: 'Sold',
  rented: 'Rented',
};

const leadStatusColors: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  contacted: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  qualified: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  viewing_scheduled: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  negotiating: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  won: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  lost: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const leadStatusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  viewing_scheduled: 'Viewing',
  negotiating: 'Negotiating',
  won: 'Won',
  lost: 'Lost',
};

export function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const {
    loadInitialData,
    getStats,
    properties,
    leads,
    deals,
    activities,
    isLoading,
    error,
    setCurrentUser,
    getReferralSummary,
  } = useAppStore();

  const [stats, setStats] = useState<DashboardStats>({
    total_properties: 0,
    properties_sold: 0,
    team_size: 0,
    active_leads: 0,
    total_value: 0,
    available_properties: 0,
  });

  const [referralSummary, setReferralSummary] = useState<ReferralSummary | null>(null);

  useEffect(() => {
    if (user) {
      setCurrentUser(user.id);
      loadInitialData(user.id, isAdmin);

      getStats(user.id, isAdmin)
        .then(setStats)
        .catch((err) => {
          console.error('Failed to load dashboard stats:', err);
        });

      getReferralSummary(user.id)
        .then(setReferralSummary)
        .catch((err) => {
          console.error('Failed to load referral summary:', err);
        });
    }
  }, [user, isAdmin, loadInitialData, setCurrentUser, getStats, getReferralSummary]);

  const filteredActivities: Activity[] = isAdmin
    ? activities
    : activities.filter(activity => {
        if (activity.user_id === user?.id) return true;
        if (activity.entity_type === 'property' && ['property_added', 'property_sold'].includes(activity.action)) return true;
        if (activity.entity_type === 'deal') {
          const deal = deals.find(d => d.id === activity.entity_id);
          if (deal && (deal.closer_id === user?.id || deal.created_by === user?.id)) return true;
        }
        if (activity.entity_type === 'lead') {
          const lead = leads.find(l => l.id === activity.entity_id);
          if (lead) return true;
        }
        if (['user_created', 'user_updated', 'user_deleted', 'login'].includes(activity.action)) return false;
        return false;
      });

  const [salePrice, setSalePrice] = useState<string>('1000000');
  const [commissionRate, setCommissionRate] = useState<string>('2');
  const calculatedCommission = (parseFloat(salePrice) || 0) * ((parseFloat(commissionRate) || 0) / 100);

  const recentProperties = properties.slice(0, 4);
  const recentActivities = filteredActivities.slice(0, 6);
  const recentLeads = leads.filter(l => !['won', 'lost', 'archived'].includes(l.status)).slice(0, 4);

  // Mock sparkline data — different per card to feel organic
  const sparkData = {
    properties: [3, 5, 4, 7, 6, 8, 7, 9, 8, 10],
    sold: [1, 2, 1, 3, 2, 4, 3, 5, 4, 6],
    team: [4, 4, 5, 5, 6, 6, 7, 7, 8, 8],
    leads: [2, 4, 3, 6, 5, 8, 7, 9, 8, 10],
  };

  const statCards = [
    {
      title: 'Total Properties',
      value: stats.total_properties,
      icon: Building2,
      trend: isAdmin ? '+12%' : '',
      color: '#FBBF33',
      iconBg: 'bg-primary/8',
      iconColor: 'text-primary',
      sparkData: sparkData.properties,
    },
    {
      title: 'Properties Sold',
      value: stats.properties_sold,
      icon: CheckCircle,
      trend: isAdmin ? '+8%' : '',
      color: '#10b981',
      iconBg: 'bg-emerald-500/8',
      iconColor: 'text-emerald-500',
      sparkData: sparkData.sold,
    },
    {
      title: isAdmin ? 'Team Size' : 'My Deals',
      value: isAdmin ? stats.team_size : deals.length,
      icon: Users,
      trend: isAdmin ? '+2' : '',
      color: '#3b82f6',
      iconBg: 'bg-blue-500/8',
      iconColor: 'text-blue-500',
      sparkData: sparkData.team,
    },
    {
      title: isAdmin ? 'Active Leads' : 'My Leads',
      value: stats.active_leads,
      icon: UserCheck,
      trend: isAdmin ? '+15%' : '',
      color: '#FF7433',
      iconBg: 'bg-orange-500/8',
      iconColor: 'text-orange-500',
      sparkData: sparkData.leads,
    },
  ];

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `AED ${(price / 1000000).toFixed(1)}M`;
    }
    return `AED ${price.toLocaleString()}`;
  };

  const getActivityDescription = (activity: typeof filteredActivities[0]) => {
    switch (activity.action) {
      case 'property_added':
        return `added new property "${activity.entity_name}"`;
      case 'property_sold':
        return `sold property "${activity.entity_name}"`;
      case 'lead_added':
        return `added new lead "${activity.entity_name}"`;
      case 'lead_converted':
        return `converted lead "${activity.entity_name}"`;
      case 'deal_closed':
        return `closed a deal on "${activity.entity_name}"`;
      case 'login':
        return 'logged in';
      case 'user_created':
        return `was added to the team`;
      default:
        return activity.action;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          </div>
          <p className="text-muted-foreground text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => user && loadInitialData(user.id, isAdmin)}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title={`Welcome back, ${user?.full_name?.split(' ')[0] || 'Guest'}`}
        subtitle="Here's an overview of your real estate portfolio"
      />

      <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className="stat-card overflow-hidden animate-fade-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <CardContent className="p-3 sm:p-5">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${stat.iconBg}`}>
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.iconColor}`} />
                    </div>
                    <div className="hidden sm:block">
                      <Sparkline data={stat.sparkData} color={stat.color} />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-heading font-bold">{stat.value}</p>
                  <div className="flex items-center justify-between mt-0.5 sm:mt-1">
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-tight">{stat.title}</p>
                    {stat.trend && (
                      <span className="text-[10px] sm:text-[11px] font-medium text-emerald-500 hidden sm:flex items-center gap-0.5">
                        <ArrowUpRight className="h-3 w-3" />
                        {stat.trend}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Middle Row: Recent Properties & Recent Activity */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Recent Properties */}
          <Card className="overflow-hidden animate-fade-up" style={{ animationDelay: '320ms' }}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Recent Properties
              </CardTitle>
              <Link to="/dashboard/properties">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 gap-1 text-xs h-8">
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentProperties.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No properties yet</p>
                    <Link to="/dashboard/properties">
                      <Button variant="outline" size="sm" className="mt-3 text-xs">
                        Add Property
                      </Button>
                    </Link>
                  </div>
                ) : (
                  recentProperties.map((property) => (
                    <div
                      key={property.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-primary/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{property.title}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {property.location}
                            </div>
                          </div>
                          <Badge className={`shrink-0 text-[10px] ${statusColors[property.status]}`}>
                            {statusLabels[property.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {property.bedrooms && (
                              <span className="flex items-center gap-0.5">
                                <Bed className="h-3 w-3" /> {property.bedrooms}
                              </span>
                            )}
                            {property.bathrooms && (
                              <span className="flex items-center gap-0.5">
                                <Bath className="h-3 w-3" /> {property.bathrooms}
                              </span>
                            )}
                            <span className="flex items-center gap-0.5">
                              <Maximize2 className="h-3 w-3" /> {property.area_sqft?.toLocaleString() || 0} sqft
                            </span>
                          </div>
                          <p className="text-xs font-bold text-primary">
                            {formatPrice(property.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="overflow-hidden animate-fade-up" style={{ animationDelay: '400ms' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                ) : (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-primary/8 text-primary text-[11px] font-semibold">
                          {activity.user ? getInitials(activity.user.full_name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] leading-snug">
                          <span className="font-semibold">{activity.user?.full_name}</span>{' '}
                          <span className="text-muted-foreground">{getActivityDescription(activity)}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatRelativeTime(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads */}
        <Card className="overflow-hidden animate-fade-up" style={{ animationDelay: '480ms' }}>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              Recent Leads
            </CardTitle>
            <Link to="/dashboard/leads">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 gap-1 text-xs h-8">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No active leads</p>
                <Link to="/dashboard/leads">
                  <Button variant="outline" size="sm" className="mt-3 text-xs">
                    Add Lead
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-4 rounded-xl bg-muted/20 hover:bg-muted/40 transition-all duration-200 border border-border/30 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/8 text-primary text-xs font-semibold">
                          {getInitials(lead.name)}
                        </AvatarFallback>
                      </Avatar>
                      <Badge className={`shrink-0 text-[10px] ${leadStatusColors[lead.status] || 'bg-gray-500/10 text-gray-400'}`}>
                        {leadStatusLabels[lead.status] || lead.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{lead.name}</p>
                    <div className="space-y-1 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 shrink-0" />
                        {lead.phone}
                      </div>
                      {(lead.budget_min || lead.budget_max) && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 shrink-0" />
                          {lead.budget_min && lead.budget_max
                            ? `${formatPrice(lead.budget_min)} - ${formatPrice(lead.budget_max)}`
                            : lead.budget_max
                            ? `Up to ${formatPrice(lead.budget_max)}`
                            : `From ${formatPrice(lead.budget_min!)}`}
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {formatRelativeTime(lead.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Row: Commission Calculator, Referral Earnings & Account Settings */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Commission Calculator */}
          <Card className="overflow-hidden animate-fade-up" style={{ animationDelay: '560ms' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                Commission Calculator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="salePrice" className="text-xs font-medium">Sale Price (AED)</Label>
                    <Input
                      id="salePrice"
                      type="number"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder="Enter sale price"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="commissionRate" className="text-xs font-medium">Commission Rate (%)</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      step="0.1"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      placeholder="Enter rate"
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15">
                  <p className="text-xs text-muted-foreground font-medium">Estimated Commission</p>
                  <p className="text-2xl font-heading font-bold text-primary mt-1">
                    AED {calculatedCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Based on {commissionRate}% of AED {parseFloat(salePrice).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referral Earnings Widget */}
          <Card className="overflow-hidden animate-fade-up" style={{ animationDelay: '640ms' }}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Users2 className="h-4 w-4 text-emerald-500" />
                Referral Earnings
              </CardTitle>
              <Link to="/dashboard/referrals">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 gap-1 text-xs h-8">
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/15">
                  <p className="text-xs text-muted-foreground font-medium">Lifetime Earnings</p>
                  <p className="text-2xl font-heading font-bold text-emerald-600 mt-1">
                    {formatCurrency(referralSummary?.total_earnings_lifetime || 0)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                    <p className="text-[11px] text-muted-foreground">This Month</p>
                    <p className="text-base font-bold mt-0.5">
                      {formatCurrency(referralSummary?.total_earnings_this_month || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                    <p className="text-[11px] text-muted-foreground">Referrals</p>
                    <p className="text-base font-bold mt-0.5">
                      {referralSummary?.total_referrals || 0} agents
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Earn 10% of signup fees from referred agents
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="overflow-hidden animate-fade-up" style={{ animationDelay: '720ms' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/30">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-base font-bold">
                      {user ? getInitials(user.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{user?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <Badge className="mt-1.5 bg-primary/10 text-primary border-primary/20 capitalize text-[10px]">
                      {user?.role}
                    </Badge>
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Link to="/dashboard/settings">
                    <Button variant="outline" className="w-full justify-start h-9 text-xs hover:border-primary/30 hover:bg-primary/5 transition-colors">
                      <Settings className="h-3.5 w-3.5 mr-2 text-primary" />
                      Edit Profile
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start h-9 text-xs hover:border-primary/30 hover:bg-primary/5 transition-colors">
                    <Clock className="h-3.5 w-3.5 mr-2 text-primary" />
                    Notification Preferences
                  </Button>
                  <Link to="/dashboard/settings">
                    <Button variant="outline" className="w-full justify-start h-9 text-xs hover:border-primary/30 hover:bg-primary/5 transition-colors">
                      <Users className="h-3.5 w-3.5 mr-2 text-primary" />
                      Security Settings
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
