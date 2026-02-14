import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Trophy,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Gift,
  Award,
  Sparkles,
  Gem,
  Users,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Reward, RewardCategory, RewardCriteriaType, UserReward } from '@/types';
import { userRewardService } from '@/lib/database';

const categoryOptions: { value: RewardCategory; label: string; icon: React.ElementType }[] = [
  { value: 'cash_bonus', label: 'Cash Bonus', icon: Gem },
  { value: 'gift_voucher', label: 'Gift Voucher', icon: Gift },
  { value: 'experience', label: 'Experience', icon: Sparkles },
  { value: 'recognition_badge', label: 'Recognition Badge', icon: Award },
];

const criteriaOptions: { value: RewardCriteriaType; label: string }[] = [
  { value: 'points', label: 'Points Threshold' },
  { value: 'deals_closed', label: 'Deals Closed' },
  { value: 'revenue_earned', label: 'Revenue Earned' },
  { value: 'leads_converted', label: 'Leads Converted' },
  { value: 'manual', label: 'Manual Award' },
];

const categoryColors: Record<RewardCategory, string> = {
  cash_bonus: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  gift_voucher: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  experience: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  recognition_badge: 'bg-primary/10 text-primary border-primary/20',
};

interface RewardFormData {
  title: string;
  description: string;
  image_url: string;
  points_required: number;
  category: RewardCategory;
  criteria_type: RewardCriteriaType;
  criteria_value: number;
  is_active: boolean;
  sort_order: number;
}

const defaultFormData: RewardFormData = {
  title: '',
  description: '',
  image_url: '',
  points_required: 0,
  category: 'cash_bonus',
  criteria_type: 'points',
  criteria_value: 0,
  is_active: true,
  sort_order: 0,
};

export default function RewardsAdmin() {
  const { user } = useAuth();
  const {
    rewards,
    loadRewards,
    addReward,
    updateReward,
    deleteReward,
    toggleRewardActive,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [deletingReward, setDeletingReward] = useState<Reward | null>(null);
  const [formData, setFormData] = useState<RewardFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [redemptionHistory, setRedemptionHistory] = useState<UserReward[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await loadRewards(true);
      } catch (error) {
        console.error('Error loading rewards:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [loadRewards]);

  const handleOpenDialog = (reward?: Reward) => {
    if (reward) {
      setEditingReward(reward);
      setFormData({
        title: reward.title,
        description: reward.description || '',
        image_url: reward.image_url || '',
        points_required: reward.points_required,
        category: reward.category,
        criteria_type: reward.criteria_type || 'points',
        criteria_value: reward.criteria_value || 0,
        is_active: reward.is_active,
        sort_order: reward.sort_order,
      });
    } else {
      setEditingReward(null);
      setFormData(defaultFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingReward(null);
    setFormData(defaultFormData);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return;

    setIsSaving(true);
    try {
      if (editingReward) {
        await updateReward(editingReward.id, formData);
      } else {
        await addReward({
          ...formData,
          created_by: user?.id,
        });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving reward:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingReward) return;
    try {
      await deleteReward(deletingReward.id);
      setIsDeleteDialogOpen(false);
      setDeletingReward(null);
    } catch (error) {
      console.error('Error deleting reward:', error);
    }
  };

  const handleToggleActive = async (reward: Reward) => {
    try {
      await toggleRewardActive(reward.id, !reward.is_active);
    } catch (error) {
      console.error('Error toggling reward:', error);
    }
  };

  const handleViewHistory = async () => {
    setIsHistoryDialogOpen(true);
    setIsLoadingHistory(true);
    try {
      const history = await userRewardService.getAll();
      setRedemptionHistory(history);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const getCategoryIcon = (category: RewardCategory) => {
    const cat = categoryOptions.find(c => c.value === category);
    return cat ? cat.icon : Gift;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Rewards Management
          </h1>
          <p className="text-muted-foreground">
            Create and manage rewards for your team
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleViewHistory} className="rounded-xl">
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button onClick={() => handleOpenDialog()} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Reward
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl stat-card animate-fade-up" style={{ animationDelay: '80ms' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Rewards</p>
                <p className="text-2xl font-heading font-bold">{rewards.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl stat-card animate-fade-up" style={{ animationDelay: '160ms' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10">
                <Eye className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active</p>
                <p className="text-2xl font-heading font-bold">{rewards.filter(r => r.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl stat-card animate-fade-up" style={{ animationDelay: '240ms' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/10">
                <EyeOff className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Inactive</p>
                <p className="text-2xl font-heading font-bold">{rewards.filter(r => !r.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl stat-card animate-fade-up" style={{ animationDelay: '320ms' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Categories</p>
                <p className="text-2xl font-heading font-bold">{new Set(rewards.map(r => r.category)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rewards Table */}
      <Card className="rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '400ms' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading">All Rewards</CardTitle>
          <CardDescription>Manage your rewards catalog</CardDescription>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-heading font-medium mb-2">No Rewards Yet</h3>
              <p className="text-muted-foreground mb-4">Create your first reward to get started</p>
              <Button onClick={() => handleOpenDialog()} className="rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Add Reward
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reward</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Criteria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards.map((reward) => {
                  const CategoryIcon = getCategoryIcon(reward.category);
                  return (
                    <TableRow key={reward.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {reward.image_url ? (
                            <img
                              src={reward.image_url}
                              alt={reward.title}
                              className="w-10 h-10 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                              <CategoryIcon className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{reward.title}</p>
                            {reward.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {reward.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[10px]', categoryColors[reward.category])}>
                          {categoryOptions.find(c => c.value === reward.category)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-heading font-medium">{reward.points_required.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {criteriaOptions.find(c => c.value === reward.criteria_type)?.label || 'Points'}
                          {(reward.criteria_value ?? 0) > 0 && ` (${reward.criteria_value})`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={reward.is_active}
                          onCheckedChange={() => handleToggleActive(reward)}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => handleOpenDialog(reward)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(reward)}>
                              {reward.is_active ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setDeletingReward(reward);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingReward ? 'Edit Reward' : 'Add New Reward'}</DialogTitle>
            <DialogDescription>
              {editingReward ? 'Update the reward details' : 'Create a new reward for your team'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Top Performer Bonus"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the reward..."
                rows={3}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as RewardCategory })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="points_required">Points Required</Label>
                <Input
                  id="points_required"
                  type="number"
                  min="0"
                  value={formData.points_required}
                  onChange={(e) => setFormData({ ...formData, points_required: parseInt(e.target.value) || 0 })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="criteria_type">Criteria Type</Label>
                <Select
                  value={formData.criteria_type}
                  onValueChange={(value) => setFormData({ ...formData, criteria_type: value as RewardCriteriaType })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {criteriaOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="criteria_value">Criteria Value</Label>
                <Input
                  id="criteria_value"
                  type="number"
                  min="0"
                  value={formData.criteria_value}
                  onChange={(e) => setFormData({ ...formData, criteria_value: parseInt(e.target.value) || 0 })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                min="0"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                className="rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border">
              <div>
                <Label htmlFor="is_active">Active</Label>
                <p className="text-sm text-muted-foreground">Make this reward visible to users</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={handleCloseDialog} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.title.trim()} className="rounded-xl">
              {isSaving ? 'Saving...' : editingReward ? 'Save Changes' : 'Create Reward'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Delete Reward</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingReward?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Redemption History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Redemption History</DialogTitle>
            <DialogDescription>View all reward redemptions</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto">
            {isLoadingHistory ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : redemptionHistory.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No redemption history yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Reward</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Earned</TableHead>
                    <TableHead>Fulfilled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redemptionHistory.map((ur) => (
                    <TableRow key={ur.id}>
                      <TableCell className="text-sm">{(ur as any).user?.full_name || 'Unknown'}</TableCell>
                      <TableCell className="text-sm">{(ur as any).reward?.title || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={ur.status === 'fulfilled' ? 'default' : 'secondary'}
                          className={cn(
                            'text-[10px]',
                            ur.status === 'fulfilled' && 'bg-emerald-500 text-white',
                            ur.status === 'earned' && 'bg-primary text-primary-foreground'
                          )}
                        >
                          {ur.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {ur.earned_at ? new Date(ur.earned_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {ur.fulfilled_at ? new Date(ur.fulfilled_at).toLocaleDateString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
