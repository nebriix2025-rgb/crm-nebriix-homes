import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, DollarSign, TrendingUp, Calendar, Briefcase, Award } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { ReferralSummary } from '@/types';

export default function Referrals() {
  const { user } = useAuth();
  const { getReferralSummary } = useAppStore();
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (user?.id) {
        setIsLoading(true);
        try {
          const data = await getReferralSummary(user.id);
          setSummary(data);
        } catch (error) {
          console.error('Error loading referral data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadData();
  }, [user?.id, getReferralSummary]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Referral Earnings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Track your earnings from agents you've referred
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3">
        {/* Total Referrals */}
        <Card className="rounded-2xl overflow-hidden border-border/40 stat-card animate-fade-up" style={{ animationDelay: '80ms' }}>
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-blue-500/8">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              </div>
              <Badge variant="outline" className="text-[10px] text-blue-500 border-blue-500/20 hidden sm:inline-flex">Agents</Badge>
            </div>
            <p className="text-xl sm:text-2xl font-heading font-bold">{summary?.total_referrals || 0}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 font-medium">Total Referrals</p>
          </CardContent>
        </Card>

        {/* This Month Earnings */}
        <Card className="rounded-2xl overflow-hidden border-border/40 stat-card animate-fade-up" style={{ animationDelay: '160ms' }}>
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-500/8">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
              </div>
              <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/20 hidden sm:inline-flex">Monthly</Badge>
            </div>
            <p className="text-xl sm:text-2xl font-heading font-bold">{formatCurrency(summary?.total_earnings_this_month || 0)}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 font-medium">This Month</p>
          </CardContent>
        </Card>

        {/* Lifetime Earnings */}
        <Card className="navy-gradient text-white rounded-2xl overflow-hidden border-0 shadow-lg shadow-navy/20 animate-fade-up col-span-2 md:col-span-1" style={{ animationDelay: '240ms' }}>
          <CardContent className="p-5 relative">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-primary/10 blur-2xl" />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="p-2.5 rounded-xl bg-primary/15">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <Badge className="text-[10px] bg-primary/20 text-primary border-0">Lifetime</Badge>
            </div>
            <p className="text-2xl font-heading font-bold text-primary relative z-10">{formatCurrency(summary?.total_earnings_lifetime || 0)}</p>
            <p className="text-xs text-white/50 mt-1 font-medium relative z-10">Lifetime Earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Referred Agents List */}
      <Card className="rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '320ms' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Your Referred Agents
          </CardTitle>
          <CardDescription>
            Agents who joined through your referral and their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!summary?.referred_agents || summary.referred_agents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-heading font-medium text-foreground mb-2">
                No Referrals Yet
              </h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                When you refer new agents to join the company, they'll appear here along with the earnings you've generated from their deals.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {summary.referred_agents.map((agent, i) => (
                <div
                  key={agent.id}
                  className="p-3 sm:p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/30 transition-all duration-200 animate-fade-up"
                  style={{ animationDelay: `${400 + i * 60}ms` }}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Avatar className="h-10 w-10 sm:h-11 sm:w-11 border-2 border-primary/15 shrink-0">
                      <AvatarImage src={agent.avatar_url} alt={agent.full_name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs sm:text-sm">
                        {getInitials(agent.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm truncate">{agent.full_name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{agent.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={agent.status === 'active' ? 'default' : 'secondary'}
                          className={agent.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]' : 'text-[10px]'}
                        >
                          {agent.status}
                        </Badge>
                        <span className="text-[10px] sm:text-[11px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className="hidden sm:inline">Joined</span> {formatDate(agent.joined_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 mt-3 pt-3 border-t border-border/30">
                    <div className="flex-1">
                      <div className="flex items-center gap-1 text-muted-foreground text-[10px] sm:text-xs">
                        <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        Deals
                      </div>
                      <p className="text-base sm:text-lg font-heading font-bold text-foreground">{agent.deals_closed}</p>
                    </div>
                    <div className="flex-1 border-l border-border/50 pl-4 sm:pl-6">
                      <div className="flex items-center gap-1 text-muted-foreground text-[10px] sm:text-xs">
                        <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        Earnings
                      </div>
                      <p className="text-base sm:text-lg font-heading font-bold text-emerald-600">
                        {formatCurrency(agent.total_earnings_generated)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="rounded-2xl overflow-hidden border-primary/20 animate-fade-up" style={{ animationDelay: '400ms' }}>
        <div className="navy-gradient p-4 sm:p-6 text-white">
          <h3 className="text-base sm:text-lg font-heading font-bold mb-3 sm:mb-4">How Referral Earnings Work</h3>
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-xs sm:text-sm">1</span>
              </div>
              <div>
                <h4 className="font-medium text-white text-sm sm:text-base">Signup Bonus</h4>
                <p className="text-xs sm:text-sm text-white/50">
                  Earn 10% of signup fee when your referred agent joins
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-xs sm:text-sm">2</span>
              </div>
              <div>
                <h4 className="font-medium text-white text-sm sm:text-base">Commission Share</h4>
                <p className="text-xs sm:text-sm text-white/50">
                  Receive a percentage of commissions from their closed deals
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
