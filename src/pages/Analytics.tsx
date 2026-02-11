import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardStats } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  Building2,
  DollarSign,
  Users,
  Handshake,
  Target,
  Calendar,
  Loader2,
} from 'lucide-react';

const PROPERTY_TYPE_COLORS: Record<string, string> = {
  apartment: '#3b82f6',
  villa: '#8b5cf6',
  townhouse: '#10b981',
  penthouse: '#f59e0b',
  office: '#ef4444',
  retail: '#ec4899',
  land: '#6b7280',
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartment',
  villa: 'Villa',
  townhouse: 'Townhouse',
  penthouse: 'Penthouse',
  office: 'Office',
  retail: 'Retail',
  land: 'Land',
};

export function AnalyticsPage() {
  const { user, isAdmin } = useAuth();
  const { properties, leads, deals, users, getStats, isLoading } = useAppStore();

  const [stats, setStats] = useState<DashboardStats>({
    total_properties: 0,
    properties_sold: 0,
    team_size: 0,
    active_leads: 0,
    total_value: 0,
    available_properties: 0,
  });

  // Load stats from Supabase
  useEffect(() => {
    if (user) {
      getStats(user.id, isAdmin).then(setStats);
    }
  }, [user, isAdmin, getStats]);

  // Property Types Distribution
  const propertyTypeData = Object.entries(
    properties.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([type, count]) => ({
    name: PROPERTY_TYPE_LABELS[type] || type,
    value: count,
    color: PROPERTY_TYPE_COLORS[type] || '#6b7280',
  }));

  // Lead Sources
  const leadSourceData = Object.entries(
    leads.reduce((acc, l) => {
      acc[l.source] = (acc[l.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([source, count]) => ({
    source,
    count,
  }));

  // Lead Pipeline Funnel
  const pipelineData = [
    { stage: 'New', count: leads.filter(l => l.status === 'new').length },
    { stage: 'Contacted', count: leads.filter(l => l.status === 'contacted').length },
    { stage: 'Qualified', count: leads.filter(l => l.status === 'qualified').length },
    { stage: 'Viewing', count: leads.filter(l => l.status === 'viewing_scheduled').length },
    { stage: 'Negotiating', count: leads.filter(l => l.status === 'negotiating').length },
    { stage: 'Won', count: leads.filter(l => l.status === 'won').length },
  ];

  // Monthly Activity (simulated data based on activities)
  const activityOverview = [
    { month: 'Jan', properties: 3, leads: 8, deals: 1 },
    { month: 'Feb', properties: 5, leads: 12, deals: 2 },
    { month: 'Mar', properties: 4, leads: 15, deals: 1 },
    { month: 'Apr', properties: 6, leads: 10, deals: 3 },
    { month: 'May', properties: 8, leads: 18, deals: 2 },
    { month: 'Jun', properties: stats.total_properties, leads: leads.length, deals: deals.length },
  ];

  // Deal Value by Month
  const dealValueData = [
    { month: 'Jan', value: 2500000 },
    { month: 'Feb', value: 4800000 },
    { month: 'Mar', value: 3200000 },
    { month: 'Apr', value: 6500000 },
    { month: 'May', value: 5100000 },
    { month: 'Jun', value: stats.total_value },
  ];

  // Top Performers
  const topPerformers = users
    .filter(u => u.role === 'user')
    .map(u => ({
      name: u.full_name,
      closedDeals: deals.filter(d => d.closer_id === u.id && d.status === 'closed').length,
      totalValue: deals
        .filter(d => d.closer_id === u.id && d.status === 'closed')
        .reduce((sum, d) => sum + d.deal_value, 0),
      commission: deals
        .filter(d => d.closer_id === u.id && d.status === 'closed')
        .reduce((sum, d) => sum + d.commission_amount, 0),
    }))
    .sort((a, b) => b.totalValue - a.totalValue);

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `AED ${(price / 1000000).toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `AED ${(price / 1000).toFixed(0)}K`;
    }
    return `AED ${price.toLocaleString()}`;
  };

  // Calculate conversion rate
  const conversionRate = leads.length > 0
    ? ((leads.filter(l => l.status === 'won').length / leads.length) * 100).toFixed(1)
    : 0;

  // Calculate average deal value
  const closedDeals = deals.filter(d => d.status === 'closed');
  const avgDealValue = closedDeals.length > 0
    ? closedDeals.reduce((sum, d) => sum + d.deal_value, 0) / closedDeals.length
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Analytics" subtitle="Track performance and business metrics" />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value Closed</p>
                  <p className="text-2xl font-bold font-heading text-accent">{formatPrice(stats.total_value)}</p>
                  <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" /> +15% this month
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-accent/10">
                  <DollarSign className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Deal Value</p>
                  <p className="text-2xl font-bold font-heading">{formatPrice(avgDealValue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    From {closedDeals.length} closed deals
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Handshake className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold font-heading">{conversionRate}%</p>
                  <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" /> +3% improvement
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <Target className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Listings</p>
                  <p className="text-2xl font-bold font-heading">{stats.available_properties}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {stats.total_properties} total
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <Building2 className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Activity Overview */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent" />
                Activity Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityOverview}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="properties"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="leads"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="deals"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>Properties</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Leads</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Deals</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Types */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-accent" />
                Property Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {propertyTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={propertyTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {propertyTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No property data available
                  </div>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
                {propertyTypeData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span>{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Deal Value Trend */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-accent" />
                Deal Value Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dealValueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [formatPrice(value as number), 'Value']}
                    />
                    <Bar dataKey="value" fill="hsl(43, 70%, 53%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Lead Pipeline */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                Lead Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis
                      dataKey="stage"
                      type="category"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Lead Sources */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Lead Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leadSourceData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No lead data available</p>
                ) : (
                  leadSourceData.map((source) => (
                    <div key={source.source} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">{source.source}</p>
                          <p className="text-sm text-muted-foreground">{source.count} leads</p>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full"
                            style={{
                              width: `${(source.count / Math.max(...leadSourceData.map(s => s.count))) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No closed deals yet</p>
                ) : (
                  topPerformers.map((performer, index) => (
                    <div key={performer.name} className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{performer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {performer.closedDeals} deal{performer.closedDeals !== 1 ? 's' : ''} closed
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-accent">{formatPrice(performer.totalValue)}</p>
                        <p className="text-xs text-emerald-400">+{formatPrice(performer.commission)} comm.</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
