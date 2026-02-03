import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { formatRelativeTime, getInitials } from '@/lib/utils';

const statusColors: Record<string, string> = {
  available: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  under_offer: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  sold: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  rented: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
};

const statusLabels: Record<string, string> = {
  available: 'Available',
  under_offer: 'Under Offer',
  sold: 'Sold',
  rented: 'Rented',
};

export function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const { getStats, getPropertiesForUser, getActivitiesForUser } = useAppStore();
  const stats = getStats(isAdmin);

  // Get data based on user role - users only see their own data
  const properties = user ? getPropertiesForUser(user.id, isAdmin) : [];
  const activities = user ? getActivitiesForUser(user.id, isAdmin) : [];

  // Commission Calculator state
  const [salePrice, setSalePrice] = useState<string>('1000000');
  const [commissionRate, setCommissionRate] = useState<string>('2');
  const calculatedCommission = (parseFloat(salePrice) || 0) * ((parseFloat(commissionRate) || 0) / 100);

  const recentProperties = properties.slice(0, 4);
  const recentActivities = activities.slice(0, 6);

  const statCards = [
    {
      title: 'Total Properties',
      value: stats.total_properties,
      icon: Building2,
      trend: '+12%',
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
    {
      title: 'Properties Sold',
      value: stats.properties_sold,
      icon: CheckCircle,
      trend: '+8%',
      color: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
    },
    {
      title: 'Team Size',
      value: stats.team_size,
      icon: Users,
      trend: '+2',
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
    },
    {
      title: 'Active Leads',
      value: stats.active_leads,
      icon: UserCheck,
      trend: '+15%',
      color: 'from-accent to-accent/80',
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
    },
  ];

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `AED ${(price / 1000000).toFixed(1)}M`;
    }
    return `AED ${price.toLocaleString()}`;
  };

  const getActivityDescription = (activity: typeof activities[0]) => {
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

  return (
    <div className="min-h-screen">
      <Header
        title={`Welcome back, ${user?.full_name?.split(' ')[0] || 'Guest'}`}
        subtitle="Here's an overview of your real estate portfolio"
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className="stat-card overflow-hidden group hover:scale-[1.02] transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-5 rounded-bl-full"
                    style={{ background: `linear-gradient(135deg, ${stat.color.split(' ')[0].replace('from-', '')} 0%, transparent 100%)` }}
                  />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                      <p className="text-3xl font-bold font-heading mt-1">{stat.value}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                        <span className="text-xs text-emerald-500 font-medium">{stat.trend}</span>
                        <span className="text-xs text-muted-foreground">vs last month</span>
                      </div>
                    </div>
                    <div className={`p-4 rounded-2xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Middle Row: Recent Properties & Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Properties */}
          <Card className="bg-card border-border gold-border overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Building2 className="h-5 w-5 text-accent" />
                </div>
                Recent Properties
              </CardTitle>
              <Link to="/dashboard/properties">
                <Button variant="ghost" size="sm" className="text-accent hover:text-accent/80 gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentProperties.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No properties yet</p>
                  </div>
                ) : (
                  recentProperties.map((property) => (
                    <div
                      key={property.id}
                      className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 border border-transparent hover:border-accent/20 cursor-pointer group"
                    >
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shrink-0 group-hover:from-accent/30 group-hover:to-accent/10 transition-all">
                        <Building2 className="h-8 w-8 text-accent/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold truncate group-hover:text-accent transition-colors">{property.title}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" />
                              {property.location}
                            </div>
                          </div>
                          <Badge className={`shrink-0 ${statusColors[property.status]}`}>
                            {statusLabels[property.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {property.bedrooms && (
                            <span className="flex items-center gap-1">
                              <Bed className="h-3 w-3" /> {property.bedrooms}
                            </span>
                          )}
                          {property.bathrooms && (
                            <span className="flex items-center gap-1">
                              <Bath className="h-3 w-3" /> {property.bathrooms}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Maximize2 className="h-3 w-3" /> {property.area_sqft.toLocaleString()} sqft
                          </span>
                        </div>
                        <p className="text-sm font-bold text-accent mt-2">
                          {formatPrice(property.price)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-card border-border gold-border overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No recent activity</p>
                  </div>
                ) : (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                      <Avatar className="h-9 w-9 shrink-0 border-2 border-accent/20">
                        <AvatarFallback className="bg-gradient-to-br from-accent/20 to-accent/5 text-accent text-xs font-semibold">
                          {activity.user ? getInitials(activity.user.full_name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-semibold">{activity.user?.full_name}</span>{' '}
                          <span className="text-muted-foreground">{getActivityDescription(activity)}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
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

        {/* Bottom Row: Commission Calculator & Account Settings */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Commission Calculator */}
          <Card className="bg-card border-border gold-border overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Calculator className="h-5 w-5 text-accent" />
                </div>
                Commission Calculator
                <Sparkles className="h-4 w-4 text-accent ml-auto" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="salePrice" className="text-sm font-medium">Sale Price (AED)</Label>
                    <Input
                      id="salePrice"
                      type="number"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder="Enter sale price"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commissionRate" className="text-sm font-medium">Commission Rate (%)</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      step="0.1"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      placeholder="Enter rate"
                      className="h-11"
                    />
                  </div>
                </div>
                <div className="p-5 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/30">
                  <p className="text-sm text-muted-foreground font-medium">Estimated Commission</p>
                  <p className="text-3xl font-bold text-accent mt-1 font-heading">
                    AED {calculatedCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Based on {commissionRate}% of AED {parseFloat(salePrice).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="bg-card border-border gold-border overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Settings className="h-5 w-5 text-accent" />
                </div>
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border">
                  <Avatar className="h-16 w-16 border-3 border-accent/30 ring-4 ring-accent/10">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-accent/30 to-accent/10 text-accent text-xl font-bold">
                      {user ? getInitials(user.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-lg">{user?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Badge className="mt-2 bg-accent/20 text-accent border-accent/30 capitalize">
                      {user?.role}
                    </Badge>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Link to="/dashboard/settings">
                    <Button variant="outline" className="w-full justify-start h-11 hover:border-accent/50 hover:bg-accent/5 transition-colors">
                      <Settings className="h-4 w-4 mr-2 text-accent" />
                      Edit Profile
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start h-11 hover:border-accent/50 hover:bg-accent/5 transition-colors">
                    <Clock className="h-4 w-4 mr-2 text-accent" />
                    Notification Preferences
                  </Button>
                  <Link to="/dashboard/settings">
                    <Button variant="outline" className="w-full justify-start h-11 hover:border-accent/50 hover:bg-accent/5 transition-colors">
                      <Users className="h-4 w-4 mr-2 text-accent" />
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
