import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users2,
  Search,
  Plus,
  Phone,
  Mail,
  DollarSign,
  Building2,
  MapPin,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Archive,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import type { LeadStatus, PropertyType, Lead } from '@/types';

const pipelineStages: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'bg-blue-500' },
  { value: 'contacted', label: 'Contacted', color: 'bg-cyan-500' },
  { value: 'qualified', label: 'Qualified', color: 'bg-purple-500' },
  { value: 'viewing_scheduled', label: 'Viewing', color: 'bg-amber-500' },
  { value: 'negotiating', label: 'Negotiating', color: 'bg-orange-500' },
  { value: 'won', label: 'Won', color: 'bg-emerald-500' },
  { value: 'lost', label: 'Lost', color: 'bg-red-500' },
];

const statusColors: Record<LeadStatus, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  contacted: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  qualified: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  viewing_scheduled: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  negotiating: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  won: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  lost: 'bg-red-500/20 text-red-400 border-red-500/30',
  archived: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const statusLabels: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  viewing_scheduled: 'Viewing Scheduled',
  negotiating: 'Negotiating',
  won: 'Won',
  lost: 'Lost',
  archived: 'Archived',
};

const typeLabels: Record<string, string> = {
  apartment: 'Apartment',
  villa: 'Villa',
  townhouse: 'Townhouse',
  penthouse: 'Penthouse',
  office: 'Office',
  retail: 'Retail',
  land: 'Land',
};

const propertyTypes: PropertyType[] = ['apartment', 'villa', 'townhouse', 'penthouse', 'office', 'retail', 'land'];
const leadSources = ['Website', 'Referral', 'Property Finder', 'Bayut', 'Instagram', 'Facebook', 'Walk-in', 'Other'];

export function LeadsPage() {
  const { user, isAdmin } = useAuth();
  const { addLead, updateLead, deleteLead, archiveLead, getLeadsForUser, getUserById } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('pipeline');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [_addToStage, setAddToStage] = useState<LeadStatus>('new');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'Website',
    status: 'new' as LeadStatus,
    budget_min: '',
    budget_max: '',
    preferred_type: '' as PropertyType | '',
    preferred_location: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      source: 'Website',
      status: 'new',
      budget_min: '',
      budget_max: '',
      preferred_type: '',
      preferred_location: '',
      notes: '',
    });
  };

  const handleAddLead = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      return;
    }

    try {
      await addLead({
        name: formData.name,
        email: formData.email || '',
        phone: formData.phone || '',
        source: formData.source,
        status: formData.status,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : undefined,
        preferred_type: formData.preferred_type || undefined,
        preferred_location: formData.preferred_location || undefined,
        notes: formData.notes || undefined,
        assigned_to: undefined,
        created_by: user?.id || '',
      });
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to add lead:', error);
    }
  };

  const handleEditLead = async () => {
    if (!editingLead || !formData.name || !formData.email || !formData.phone) {
      return;
    }

    try {
      await updateLead(editingLead.id, {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        source: formData.source,
        status: formData.status,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : undefined,
        preferred_type: formData.preferred_type || undefined,
        preferred_location: formData.preferred_location || undefined,
        notes: formData.notes || undefined,
      });
      resetForm();
      setEditingLead(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  };

  const openEditDialog = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      status: lead.status,
      budget_min: lead.budget_min?.toString() || '',
      budget_max: lead.budget_max?.toString() || '',
      preferred_type: lead.preferred_type || '',
      preferred_location: lead.preferred_location || '',
      notes: lead.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const openAddDialogForStage = (stage: LeadStatus) => {
    resetForm();
    setFormData(prev => ({ ...prev, status: stage }));
    setAddToStage(stage);
    setIsAddDialogOpen(true);
  };

  const handleDeleteLead = (id: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      deleteLead(id);
    }
  };

  const handleArchiveLead = (id: string) => {
    if (confirm('Are you sure you want to archive this lead?')) {
      archiveLead(id);
    }
  };

  // Get leads based on user role - users only see their own data
  const userLeads = user ? getLeadsForUser(user.id, isAdmin) : [];

  const filteredLeads = userLeads.filter((lead) => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery);
    return matchesSearch;
  });

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified';
    const formatNum = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
      return num.toString();
    };
    if (min && max) return `AED ${formatNum(min)} - ${formatNum(max)}`;
    if (min) return `AED ${formatNum(min)}+`;
    if (max) return `Up to AED ${formatNum(max)}`;
    return 'Not specified';
  };

  const getLeadsByStage = (status: LeadStatus) => {
    return filteredLeads.filter(lead => lead.status === status);
  };

  // Stats - based on user's accessible leads
  const activeLeads = userLeads.filter(l => !['won', 'lost'].includes(l.status)).length;
  const wonLeads = userLeads.filter(l => l.status === 'won').length;
  const conversionRate = userLeads.length > 0 ? ((wonLeads / userLeads.length) * 100).toFixed(1) : 0;

  // Form content - inlined to prevent re-renders that cause focus loss
  const renderLeadForm = (onSubmit: () => void, submitLabel: string) => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="John Smith"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">Lead Source *</Label>
          <Select value={formData.source} onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {leadSources.map((source) => (
                <SelectItem key={source} value={source}>{source}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="john@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+971 50 123 4567"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="budget_min">Min Budget (AED)</Label>
          <Input
            id="budget_min"
            type="number"
            value={formData.budget_min}
            onChange={(e) => setFormData(prev => ({ ...prev, budget_min: e.target.value }))}
            placeholder="e.g., 2000000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget_max">Max Budget (AED)</Label>
          <Input
            id="budget_max"
            type="number"
            value={formData.budget_max}
            onChange={(e) => setFormData(prev => ({ ...prev, budget_max: e.target.value }))}
            placeholder="e.g., 5000000"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="preferred_type">Preferred Property Type</Label>
          <Select
            value={formData.preferred_type}
            onValueChange={(value: PropertyType) => setFormData(prev => ({ ...prev, preferred_type: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any type" />
            </SelectTrigger>
            <SelectContent>
              {propertyTypes.map((type) => (
                <SelectItem key={type} value={type}>{typeLabels[type]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferred_location">Preferred Location</Label>
          <Input
            id="preferred_location"
            value={formData.preferred_location}
            onChange={(e) => setFormData(prev => ({ ...prev, preferred_location: e.target.value }))}
            placeholder="e.g., Dubai Marina"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value: LeadStatus) => setFormData(prev => ({ ...prev, status: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pipelineStages.map((stage) => (
              <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes about the lead..."
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button type="submit" onClick={onSubmit} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );

  return (
    <div className="min-h-screen overflow-y-auto">
      <Header
        title="Leads"
        subtitle="Manage your sales pipeline and leads"
      />

      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Leads</p>
              <p className="text-2xl font-bold">{userLeads.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active Leads</p>
              <p className="text-2xl font-bold text-amber-400">{activeLeads}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Won</p>
              <p className="text-2xl font-bold text-emerald-400">{wonLeads}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-2xl font-bold text-accent">{conversionRate}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'pipeline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('pipeline')}
              className={viewMode === 'pipeline' ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}
            >
              Pipeline View
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}
            >
              List View
            </Button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => { resetForm(); setAddToStage('new'); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Lead</DialogTitle>
                  <DialogDescription>
                    Enter the lead's contact information and preferences.
                  </DialogDescription>
                </DialogHeader>
                {renderLeadForm(handleAddLead, "Add Lead")}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Lead</DialogTitle>
              <DialogDescription>
                Update the lead's information.
              </DialogDescription>
            </DialogHeader>
            {renderLeadForm(handleEditLead, "Save Changes")}
          </DialogContent>
        </Dialog>

        {/* Pipeline View */}
        {viewMode === 'pipeline' ? (
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-0">
            {pipelineStages.map((stage) => {
              const stageLeads = getLeadsByStage(stage.value);
              return (
                <div key={stage.value} className="flex-shrink-0 w-72">
                  <Card className="bg-card border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                          {stage.label}
                        </div>
                        <Badge variant="outline">{stageLeads.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                      {stageLeads.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm border-2 border-dashed border-muted rounded-lg">
                          No leads
                        </div>
                      ) : (
                        stageLeads.map((lead) => (
                          <Card key={lead.id} className="bg-muted/50 border-border hover:border-accent/50 transition-colors cursor-pointer">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs bg-accent/20 text-accent">
                                      {getInitials(lead.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">{lead.name}</p>
                                    <p className="text-xs text-muted-foreground">{lead.source}</p>
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openEditDialog(lead)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleArchiveLead(lead.id)}>
                                      <Archive className="h-4 w-4 mr-2" />
                                      Archive
                                    </DropdownMenuItem>
                                    {isAdmin && (
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => handleDeleteLead(lead.id)}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                <p className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {formatBudget(lead.budget_min, lead.budget_max)}
                                </p>
                                {lead.preferred_type && (
                                  <p className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {typeLabels[lead.preferred_type]}
                                  </p>
                                )}
                                {isAdmin && lead.created_by && (
                                  <p className="flex items-center gap-1 mt-1 pt-1 border-t border-border/50">
                                    <Calendar className="h-3 w-3" />
                                    {getUserById(lead.created_by)?.full_name || 'Unknown'} • {formatRelativeTime(lead.created_at)}
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full border-2 border-dashed border-muted hover:border-accent/50"
                        onClick={() => openAddDialogForStage(stage.value)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Lead
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {filteredLeads.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <Users2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No leads found matching your criteria</p>
                </CardContent>
              </Card>
            ) : (
              filteredLeads.map((lead) => (
                <Card key={lead.id} className="bg-card border-border hover:border-accent/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Lead Info */}
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-accent/20 text-accent">
                            {getInitials(lead.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold">{lead.name}</p>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {lead.email}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {lead.phone}
                                </span>
                              </div>
                            </div>
                            <Badge className={statusColors[lead.status]}>
                              {statusLabels[lead.status]}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Lead Details */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:w-auto">
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> Budget
                          </p>
                          <p className="font-medium text-sm">{formatBudget(lead.budget_min, lead.budget_max)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> Type
                          </p>
                          <p className="font-medium text-sm">{lead.preferred_type ? typeLabels[lead.preferred_type] : 'Any'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Location
                          </p>
                          <p className="font-medium text-sm">{lead.preferred_location || 'Any'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Source
                          </p>
                          <p className="font-medium text-sm">{lead.source}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(lead)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchiveLead(lead.id)}>
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          {isAdmin && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteLead(lead.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {/* Created By Info & Notes */}
                    <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      {isAdmin && lead.created_by && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[10px] bg-accent/20 text-accent">
                              {getUserById(lead.created_by) ? getInitials(getUserById(lead.created_by)!.full_name) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            Created by {getUserById(lead.created_by)?.full_name || 'Unknown'}
                            <span className="mx-1">•</span>
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {formatRelativeTime(lead.created_at)}
                          </span>
                        </div>
                      )}
                      {lead.notes && (
                        <p className="text-sm text-muted-foreground">
                          {lead.notes}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
