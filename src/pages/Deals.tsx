import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Handshake,
  Search,
  Plus,
  Building2,
  User,
  Calendar,
  DollarSign,
  Percent,
  MapPin,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
} from 'lucide-react';
import type { DealStatus, Deal } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, formatRelativeTime } from '@/lib/utils';

const statusFilters: { value: DealStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Deals' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const statusColors: Record<DealStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  closed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusLabels: Record<DealStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

interface DealFormData {
  property_id: string;
  lead_id: string;
  deal_value: string;
  commission_rate: string;
  closer_id: string;
  status: DealStatus;
  notes: string;
}

const initialFormData: DealFormData = {
  property_id: '',
  lead_id: '',
  deal_value: '',
  commission_rate: '2',
  closer_id: '',
  status: 'pending',
  notes: '',
};

export function DealsPage() {
  const { user, isAdmin } = useAuth();
  const { properties, leads, users, addDeal, updateDeal, getDealsForUser, getUserById } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<DealStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [deletingDeal, setDeletingDeal] = useState<Deal | null>(null);
  const [viewingDeal, setViewingDeal] = useState<Deal | null>(null);
  const [formData, setFormData] = useState<DealFormData>(initialFormData);

  const salesUsers = users.filter(u => u.role === 'user' || u.role === 'admin');

  // Get deals based on user role - users only see their own data
  const userDeals = user ? getDealsForUser(user.id, isAdmin) : [];

  const filteredDeals = userDeals.filter((deal) => {
    const matchesStatus = statusFilter === 'all' || deal.status === statusFilter;
    const matchesSearch = deal.property?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.lead?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.closer?.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `AED ${(price / 1000000).toFixed(1)}M`;
    }
    return `AED ${price.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateCommission = (value: string, rate: string) => {
    const dealValue = parseFloat(value) || 0;
    const commissionRate = parseFloat(rate) || 0;
    return (dealValue * commissionRate) / 100;
  };

  const handleAddDeal = () => {
    const selectedProperty = properties.find(p => p.id === formData.property_id);
    const selectedLead = leads.find(l => l.id === formData.lead_id);
    const selectedCloser = users.find(u => u.id === formData.closer_id);
    const dealValue = parseFloat(formData.deal_value) || 0;
    const commissionRate = parseFloat(formData.commission_rate) || 2;

    const newDeal: Deal = {
      id: Date.now().toString(),
      property_id: formData.property_id,
      lead_id: formData.lead_id || undefined,
      deal_value: dealValue,
      commission_rate: commissionRate,
      commission_amount: calculateCommission(formData.deal_value, formData.commission_rate),
      status: formData.status,
      closer_id: formData.closer_id,
      created_by: user?.id,
      notes: formData.notes || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      property: selectedProperty,
      lead: selectedLead,
      closer: selectedCloser,
    };

    addDeal(newDeal);
    setFormData(initialFormData);
    setIsAddDialogOpen(false);
  };

  const handleEditDeal = () => {
    if (!editingDeal) return;

    const selectedProperty = properties.find(p => p.id === formData.property_id);
    const selectedLead = leads.find(l => l.id === formData.lead_id);
    const selectedCloser = users.find(u => u.id === formData.closer_id);
    const dealValue = parseFloat(formData.deal_value) || 0;
    const commissionRate = parseFloat(formData.commission_rate) || 2;

    updateDeal(editingDeal.id, {
      property_id: formData.property_id,
      lead_id: formData.lead_id || undefined,
      deal_value: dealValue,
      commission_rate: commissionRate,
      commission_amount: calculateCommission(formData.deal_value, formData.commission_rate),
      status: formData.status,
      closer_id: formData.closer_id,
      notes: formData.notes || undefined,
      closed_at: formData.status === 'closed' ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
      property: selectedProperty,
      lead: selectedLead,
      closer: selectedCloser,
    });

    setEditingDeal(null);
    setFormData(initialFormData);
    setIsEditDialogOpen(false);
  };

  const openEditDialog = (deal: Deal) => {
    setEditingDeal(deal);
    setFormData({
      property_id: deal.property_id,
      lead_id: deal.lead_id || '',
      deal_value: deal.deal_value.toString(),
      commission_rate: deal.commission_rate.toString(),
      closer_id: deal.closer_id || '',
      status: deal.status,
      notes: deal.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (deal: Deal) => {
    setDeletingDeal(deal);
    setIsDeleteDialogOpen(true);
  };

  const openViewDialog = (deal: Deal) => {
    setViewingDeal(deal);
    setIsViewDialogOpen(true);
  };

  const handleDeleteDeal = () => {
    if (!deletingDeal) return;
    // For now, mark as cancelled instead of deleting
    updateDeal(deletingDeal.id, { status: 'cancelled' });
    setDeletingDeal(null);
    setIsDeleteDialogOpen(false);
  };

  // Calculate summary stats - based on user's accessible deals
  const totalDeals = userDeals.length;
  const closedDeals = userDeals.filter(d => d.status === 'closed').length;
  const totalValue = userDeals.filter(d => d.status === 'closed').reduce((sum, d) => sum + d.deal_value, 0);
  const totalCommission = userDeals.filter(d => d.status === 'closed').reduce((sum, d) => sum + d.commission_amount, 0);

  // Form content - inlined to prevent re-renders that cause focus loss
  const renderDealForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Property *</Label>
        <Select value={formData.property_id} onValueChange={(value) => {
          const property = properties.find(p => p.id === value);
          setFormData(prev => ({
            ...prev,
            property_id: value,
            deal_value: property ? property.price.toString() : prev.deal_value
          }));
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Select property" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.title} - {formatPrice(property.price)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Lead (Client)</Label>
        <Select value={formData.lead_id || "none"} onValueChange={(value) => setFormData(prev => ({ ...prev, lead_id: value === "none" ? "" : value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select lead (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No lead selected</SelectItem>
            {leads.filter(l => l.status !== 'lost').map((lead) => (
              <SelectItem key={lead.id} value={lead.id}>
                {lead.name} - {lead.preferred_location || 'No preference'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Deal Value (AED) *</Label>
          <Input
            type="number"
            value={formData.deal_value}
            onChange={(e) => setFormData(prev => ({ ...prev, deal_value: e.target.value }))}
            placeholder="e.g., 3500000"
          />
        </div>
        <div className="space-y-2">
          <Label>Commission Rate (%) *</Label>
          <Input
            type="number"
            step="0.1"
            value={formData.commission_rate}
            onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: e.target.value }))}
            placeholder="e.g., 2"
          />
        </div>
      </div>

      {formData.deal_value && formData.commission_rate && (
        <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <p className="text-sm text-muted-foreground">Estimated Commission</p>
          <p className="text-lg font-bold text-emerald-400">
            {formatPrice(calculateCommission(formData.deal_value, formData.commission_rate))}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Closer (Agent) *</Label>
          <Select value={formData.closer_id} onValueChange={(value) => setFormData(prev => ({ ...prev, closer_id: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select closer" />
            </SelectTrigger>
            <SelectContent>
              {salesUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(value: DealStatus) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes about this deal..."
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Header
        title="Deals"
        subtitle="Track and manage your property deals"
      />

      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Deals</p>
              <p className="text-2xl font-bold">{totalDeals}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Closed Deals</p>
              <p className="text-2xl font-bold text-emerald-400">{closedDeals}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold text-accent">{formatPrice(totalValue)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Commission</p>
              <p className="text-2xl font-bold text-emerald-400">{formatPrice(totalCommission)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(filter.value)}
                className={statusFilter === filter.value ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}
              >
                {filter.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {isAdmin && (
              <Button
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => {
                  setFormData(initialFormData);
                  setIsAddDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Deal
              </Button>
            )}
          </div>
        </div>

        {/* Deals List */}
        <div className="grid gap-4">
          {filteredDeals.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No deals found matching your criteria</p>
              </CardContent>
            </Card>
          ) : (
            filteredDeals.map((deal) => (
              <Card key={deal.id} className="bg-card border-border hover:border-accent/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Property Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shrink-0">
                        <Building2 className="h-8 w-8 text-accent/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold truncate">{deal.property?.title || 'Unknown Property'}</p>
                            {deal.property?.location && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3" />
                                {deal.property.location}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={statusColors[deal.status]}>
                              {statusLabels[deal.status]}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openViewDialog(deal)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(deal)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit Deal
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(deal)}
                                  className="text-red-400"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Cancel Deal
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {deal.lead && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                            <User className="h-3 w-3" />
                            Client: {deal.lead.name}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Deal Details */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:w-auto">
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> Deal Value
                        </p>
                        <p className="font-semibold text-accent">{formatPrice(deal.deal_value)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Percent className="h-3 w-3" /> Commission
                        </p>
                        <p className="font-semibold text-emerald-400">
                          {formatPrice(deal.commission_amount)}
                          <span className="text-xs text-muted-foreground ml-1">({deal.commission_rate}%)</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" /> Closer
                        </p>
                        <p className="font-medium">{deal.closer?.full_name || 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {deal.closed_at ? 'Closed' : 'Created'}
                        </p>
                        <p className="font-medium">{formatDate(deal.closed_at || deal.created_at)}</p>
                      </div>
                    </div>
                  </div>
                  {/* Created By & Notes */}
                  <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {isAdmin && deal.created_by && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px] bg-accent/20 text-accent">
                            {getUserById(deal.created_by) ? getInitials(getUserById(deal.created_by)!.full_name) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          Created by {getUserById(deal.created_by)?.full_name || 'Unknown'}
                          <span className="mx-1">•</span>
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {formatRelativeTime(deal.created_at)}
                        </span>
                      </div>
                    )}
                    {deal.notes && (
                      <p className="text-sm text-muted-foreground">
                        {deal.notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add Deal Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-accent" />
              Create New Deal
            </DialogTitle>
          </DialogHeader>
          {renderDealForm()}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {(!formData.property_id || !formData.deal_value || !formData.closer_id) && (
              <p className="text-xs text-muted-foreground mr-auto">
                * Fill in all required fields
              </p>
            )}
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddDeal}
              disabled={!formData.property_id || !formData.deal_value || !formData.closer_id}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Create Deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Deal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-accent" />
              Edit Deal
            </DialogTitle>
          </DialogHeader>
          {renderDealForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditDeal}
              disabled={!formData.property_id || !formData.deal_value || !formData.closer_id}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-400">Cancel Deal</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to cancel the deal for "{deletingDeal?.property?.title}"?
            This will mark the deal as cancelled.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Keep Deal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDeal}
            >
              Cancel Deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Deal Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-accent" />
              Deal Details
            </DialogTitle>
          </DialogHeader>
          {viewingDeal && (
            <div className="space-y-6">
              {/* Deal Status */}
              <div className="flex items-center justify-between">
                <Badge className={`${statusColors[viewingDeal.status]} text-sm px-3 py-1`}>
                  {statusLabels[viewingDeal.status]}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Created {formatDate(viewingDeal.created_at)}
                </p>
              </div>

              {/* Property Info */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-accent" />
                  Property
                </h4>
                <div className="space-y-2">
                  <p className="text-lg font-medium">{viewingDeal.property?.title || 'Unknown Property'}</p>
                  {viewingDeal.property?.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {viewingDeal.property.location}
                    </div>
                  )}
                </div>
              </div>

              {/* Client Info */}
              {viewingDeal.lead && (
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-accent" />
                    Client
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="font-medium">{viewingDeal.lead.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{viewingDeal.lead.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{viewingDeal.lead.phone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Source</p>
                      <p className="font-medium">{viewingDeal.lead.source}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-accent" />
                    <p className="text-sm text-muted-foreground">Deal Value</p>
                  </div>
                  <p className="text-2xl font-bold text-accent">{formatPrice(viewingDeal.deal_value)}</p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Percent className="h-4 w-4 text-emerald-400" />
                    <p className="text-sm text-muted-foreground">Commission ({viewingDeal.commission_rate}%)</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">{formatPrice(viewingDeal.commission_amount)}</p>
                </div>
              </div>

              {/* Closer Info */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h4 className="font-semibold mb-3">Assigned Agent (Closer)</h4>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-accent/20 text-accent">
                      {viewingDeal.closer ? getInitials(viewingDeal.closer.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{viewingDeal.closer?.full_name || 'Unassigned'}</p>
                    <p className="text-sm text-muted-foreground">{viewingDeal.closer?.email}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingDeal.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-muted-foreground p-3 rounded-lg bg-muted/30">{viewingDeal.notes}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="pt-4 border-t border-border text-sm text-muted-foreground space-y-1">
                <p><span className="font-medium">Created:</span> {formatDate(viewingDeal.created_at)}</p>
                {viewingDeal.closed_at && (
                  <p><span className="font-medium">Closed:</span> {formatDate(viewingDeal.closed_at)}</p>
                )}
                {isAdmin && viewingDeal.created_by && (
                  <p><span className="font-medium">Created by:</span> {getUserById(viewingDeal.created_by)?.full_name || 'Unknown'}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false);
                if (viewingDeal) openEditDialog(viewingDeal);
              }}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
