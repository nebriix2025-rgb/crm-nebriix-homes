import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Gift,
  Star,
  Award,
  Sparkles,
  Lock,
  CheckCircle2,
  Clock,
  Gem,
  Crown,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Reward, UserRewardWithDetails, RewardCategory } from '@/types';

const categoryConfig: Record<RewardCategory, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  cash_bonus: { icon: Gem, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Cash Bonus' },
  gift_voucher: { icon: Gift, color: 'text-purple-500', bgColor: 'bg-purple-500/10', label: 'Gift Voucher' },
  experience: { icon: Sparkles, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Experience' },
  recognition_badge: { icon: Award, color: 'text-primary', bgColor: 'bg-primary/10', label: 'Badge' },
};

interface RewardCardProps {
  reward: Reward;
  userReward?: UserRewardWithDetails;
  pointsBalance: number;
  index: number;
}

function RewardCard({ reward, userReward, pointsBalance, index }: RewardCardProps) {
  const config = categoryConfig[reward.category];
  const Icon = config.icon;

  const status = userReward?.status || 'locked';
  const isLocked = status === 'locked';
  const isAvailable = status === 'available' || (!userReward && pointsBalance >= reward.points_required);
  const isEarned = status === 'earned';
  const isFulfilled = status === 'fulfilled';

  const progress = userReward?.progress || (reward.points_required > 0 ? Math.min(100, (pointsBalance / reward.points_required) * 100) : 0);

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 animate-fade-up rounded-2xl',
        'border hover:shadow-lg',
        isFulfilled && 'border-emerald-500/40 bg-emerald-500/5',
        isEarned && 'border-primary/40 bg-primary/5',
        isAvailable && 'border-primary/30 bg-primary/5 hover:border-primary/60',
        isLocked && !isAvailable && 'border-border/50 bg-muted/20 opacity-80',
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Top gradient accent */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-1',
        isFulfilled && 'bg-emerald-500',
        isEarned && 'gold-gradient',
        isAvailable && 'gold-gradient',
        isLocked && !isAvailable && 'bg-muted-foreground/20',
      )} />

      {/* Status indicator */}
      {(isEarned || isFulfilled) && (
        <div className="absolute top-4 right-4">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center shadow-sm',
            isFulfilled ? 'bg-emerald-500' : 'bg-primary'
          )}>
            <CheckCircle2 className={cn('w-5 h-5', isFulfilled ? 'text-white' : 'text-navy')} />
          </div>
        </div>
      )}
      {isLocked && !isAvailable && (
        <div className="absolute top-4 right-4">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      )}

      <CardContent className="p-6 pt-7">
        {/* Category Icon & Badge */}
        <div className="flex items-start justify-between mb-5">
          <div className={cn('p-3 rounded-xl', config.bgColor)}>
            <Icon className={cn('w-7 h-7', config.color)} />
          </div>
          <Badge variant="outline" className={cn('text-[10px] font-semibold uppercase tracking-wide', config.color)}>
            {config.label}
          </Badge>
        </div>

        {/* Reward Image */}
        {reward.image_url && (
          <div className="mb-5 rounded-xl overflow-hidden bg-muted aspect-video">
            <img
              src={reward.image_url}
              alt={reward.title}
              className={cn(
                'w-full h-full object-cover transition-transform duration-500',
                'group-hover:scale-105',
                isLocked && !isAvailable && 'grayscale'
              )}
            />
          </div>
        )}

        {/* Title & Description */}
        <h3 className={cn(
          'text-lg font-heading font-bold mb-1.5 transition-colors',
          'group-hover:text-primary',
          isLocked && !isAvailable && 'text-muted-foreground'
        )}>
          {reward.title}
        </h3>
        {reward.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
            {reward.description}
          </p>
        )}

        {/* Points Required */}
        <div className="flex items-center gap-2 mb-4">
          <Star className={cn('w-4 h-4', isAvailable || isEarned || isFulfilled ? 'text-primary fill-primary' : 'text-muted-foreground')} />
          <span className={cn(
            'font-bold text-base font-heading',
            isAvailable || isEarned || isFulfilled ? 'text-primary' : 'text-muted-foreground'
          )}>
            {reward.points_required.toLocaleString()} points
          </span>
        </div>

        {/* Progress Bar */}
        {!isEarned && !isFulfilled && reward.points_required > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  isAvailable ? 'gold-gradient' : 'bg-muted-foreground/20'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Badge */}
        {(isEarned || isFulfilled) && (
          <div className={cn(
            'mt-4 py-2 px-3 rounded-xl text-center text-sm font-medium',
            isFulfilled ? 'bg-emerald-500/15 text-emerald-600' : 'bg-primary/15 text-primary'
          )}>
            {isFulfilled ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Fulfilled
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" /> Earned — Pending Fulfillment
              </span>
            )}
          </div>
        )}

        {/* Locked / Coming Soon */}
        {isLocked && !isAvailable && (
          <div className="mt-4 py-2 px-3 rounded-xl bg-muted/50 text-center text-sm text-muted-foreground">
            <span className="flex items-center justify-center gap-2">
              <Lock className="w-3.5 h-3.5" />
              {pointsBalance < reward.points_required
                ? `${(reward.points_required - pointsBalance).toLocaleString()} more points needed`
                : 'Coming Soon'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Rewards() {
  const { user } = useAuth();
  const { rewards, userRewards, loadRewards, loadUserRewards, getUserPointsBalance } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      if (user?.id) {
        setIsLoading(true);
        try {
          await Promise.all([
            loadRewards(false),
            loadUserRewards(user.id),
          ]);
          const balance = await getUserPointsBalance(user.id);
          setPointsBalance(balance);
        } catch (error) {
          console.error('Error loading rewards:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadData();
  }, [user?.id, loadRewards, loadUserRewards, getUserPointsBalance]);

  const getUserRewardForReward = (rewardId: string) => {
    return userRewards.find(ur => ur.reward_id === rewardId);
  };

  const filteredRewards = activeCategory === 'all'
    ? rewards
    : rewards.filter(r => r.category === activeCategory);

  const earnedCount = userRewards.filter(ur => ur.status === 'earned' || ur.status === 'fulfilled').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-24 w-48 rounded-2xl" />
        </div>
        <Skeleton className="h-12 w-full max-w-lg rounded-xl" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-8">
      {/* Header with Points Balance */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="animate-fade-up">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center gap-2 sm:gap-3">
            <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            Rewards
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Earn rewards through your performance and achievements
          </p>
        </div>

        {/* Points Balance Card */}
        <Card className="navy-gradient text-white border-0 shadow-lg shadow-navy/25 rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '80ms' }}>
          <CardContent className="p-4 sm:p-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />
            <div className="flex items-center gap-3 sm:gap-4 relative z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary/20 flex items-center justify-center">
                <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <div>
                <p className="text-white/60 text-xs sm:text-sm font-medium">Your Points</p>
                <p className="text-2xl sm:text-3xl font-heading font-bold text-primary">{pointsBalance.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10 flex items-center justify-between text-xs sm:text-sm relative z-10">
              <span className="text-white/50">Rewards Earned</span>
              <span className="font-bold text-primary flex items-center gap-1">
                <Zap className="w-4 h-4" /> {earnedCount}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full animate-fade-up" style={{ animationDelay: '160ms' }}>
        <TabsList className="w-full max-w-2xl bg-muted/50 p-1 h-auto flex overflow-x-auto no-scrollbar sm:flex-wrap rounded-xl gap-0.5">
          <TabsTrigger
            value="all"
            className="flex items-center gap-2 data-[state=active]:bg-background rounded-lg"
          >
            <Star className="w-4 h-4" />
            All Rewards
          </TabsTrigger>
          {Object.entries(categoryConfig).map(([key, config]) => {
            const TabIcon = config.icon;
            return (
              <TabsTrigger
                key={key}
                value={key}
                className="flex items-center gap-2 data-[state=active]:bg-background rounded-lg"
              >
                <TabIcon className={cn('w-4 h-4', config.color)} />
                {config.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          {filteredRewards.length === 0 ? (
            <Card className="p-12 text-center rounded-2xl">
              <Gift className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-heading font-semibold text-foreground mb-2">No Rewards Available</h3>
              <p className="text-muted-foreground">
                {activeCategory === 'all'
                  ? 'Check back soon for exciting rewards!'
                  : `No ${categoryConfig[activeCategory as RewardCategory]?.label || ''} rewards available yet.`}
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRewards.map((reward, i) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  userReward={getUserRewardForReward(reward.id)}
                  pointsBalance={pointsBalance}
                  index={i}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* How to Earn Points */}
      <Card className="rounded-2xl overflow-hidden border-primary/20 animate-fade-up" style={{ animationDelay: '240ms' }}>
        <div className="navy-gradient p-6 text-white">
          <h3 className="text-lg font-heading font-bold mb-5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            How to Earn Points
          </h3>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[
              { icon: Trophy, title: 'Close Deals', desc: 'Earn points for every deal you close' },
              { icon: Star, title: 'Convert Leads', desc: 'Points for successful lead conversions' },
              { icon: Award, title: 'Top Performer', desc: 'Bonus points for monthly top performers' },
              { icon: Gift, title: 'Special Events', desc: 'Participate in company events' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-white text-sm sm:text-base">{item.title}</h4>
                  <p className="text-xs sm:text-sm text-white/50">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
