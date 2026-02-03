import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
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
  Building2,
  Search,
  Plus,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  MoreVertical,
  Eye,
  Edit,
  Archive,
  Trash2,
  Calendar,
  Upload,
  Image,
  Video,
  FileText,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import type { PropertyStatus, PropertyType, Property, PropertyMedia } from '@/types';

const statusFilters: { value: PropertyStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Properties' },
  { value: 'available', label: 'Available' },
  { value: 'under_offer', label: 'Under Offer' },
  { value: 'sold', label: 'Sold' },
  { value: 'rented', label: 'Rented' },
];

const statusColors: Record<PropertyStatus, string> = {
  draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  available: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  under_offer: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  sold: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  rented: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  archived: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusLabels: Record<PropertyStatus, string> = {
  draft: 'Draft',
  available: 'Available',
  under_offer: 'Under Offer',
  sold: 'Sold',
  rented: 'Rented',
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

export function PropertiesPage() {
  const { user, isAdmin } = useAuth();
  const { addProperty, deleteProperty, updateProperty, archiveProperty, getPropertiesForUser, getUserById } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'apartment' as PropertyType,
    status: 'available' as PropertyStatus,
    price: '',
    location: '',
    area_sqft: '',
    bedrooms: '',
    bathrooms: '',
    owner_name: '',
    owner_phone: '',
  });

  // Media upload state
  const [uploadedImages, setUploadedImages] = useState<PropertyMedia[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<PropertyMedia[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<PropertyMedia[]>([]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'apartment',
      status: 'available',
      price: '',
      location: '',
      area_sqft: '',
      bedrooms: '',
      bathrooms: '',
      owner_name: '',
      owner_phone: '',
    });
    setUploadedImages([]);
    setUploadedVideos([]);
    setUploadedDocuments([]);
  };

  // File upload handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'pdf') => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const media: PropertyMedia = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        uploaded_at: new Date().toISOString(),
      };

      if (type === 'image') {
        setUploadedImages(prev => [...prev, media]);
      } else if (type === 'video') {
        setUploadedVideos(prev => [...prev, media]);
      } else {
        setUploadedDocuments(prev => [...prev, media]);
      }
    });

    // Reset input
    e.target.value = '';
  };

  const removeMedia = (id: string, type: 'image' | 'video' | 'pdf') => {
    if (type === 'image') {
      setUploadedImages(prev => prev.filter(m => m.id !== id));
    } else if (type === 'video') {
      setUploadedVideos(prev => prev.filter(m => m.id !== id));
    } else {
      setUploadedDocuments(prev => prev.filter(m => m.id !== id));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleAddProperty = () => {
    if (!formData.title || !formData.price || !formData.location || !formData.area_sqft) {
      return;
    }

    const newProperty: Property = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      type: formData.type,
      status: formData.status,
      price: parseFloat(formData.price),
      location: formData.location,
      area_sqft: parseFloat(formData.area_sqft),
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
      images: uploadedImages.map(m => m.url),
      videos: uploadedVideos,
      documents: uploadedDocuments,
      media: [...uploadedImages, ...uploadedVideos, ...uploadedDocuments],
      features: [],
      owner_name: formData.owner_name || undefined,
      owner_phone: formData.owner_phone || undefined,
      created_by: user?.id || '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addProperty(newProperty);
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditProperty = () => {
    if (!editingProperty || !formData.title || !formData.price || !formData.location) {
      return;
    }

    updateProperty(editingProperty.id, {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      status: formData.status,
      price: parseFloat(formData.price),
      location: formData.location,
      area_sqft: parseFloat(formData.area_sqft),
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
      owner_name: formData.owner_name || undefined,
      owner_phone: formData.owner_phone || undefined,
      updated_at: new Date().toISOString(),
    });

    resetForm();
    setEditingProperty(null);
    setIsEditDialogOpen(false);
  };

  const openEditDialog = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      title: property.title,
      description: property.description || '',
      type: property.type,
      status: property.status,
      price: property.price.toString(),
      location: property.location,
      area_sqft: property.area_sqft.toString(),
      bedrooms: property.bedrooms?.toString() || '',
      bathrooms: property.bathrooms?.toString() || '',
      owner_name: property.owner_name || '',
      owner_phone: property.owner_phone || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteProperty = (id: string) => {
    if (confirm('Are you sure you want to delete this property?')) {
      deleteProperty(id);
    }
  };

  const handleArchiveProperty = (id: string) => {
    if (confirm('Are you sure you want to archive this property?')) {
      archiveProperty(id);
    }
  };

  // Get properties based on user role - users only see their own data
  const userProperties = user ? getPropertiesForUser(user.id, isAdmin) : [];

  const filteredProperties = userProperties.filter((property) => {
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `AED ${(price / 1000000).toFixed(1)}M`;
    }
    return `AED ${price.toLocaleString()}`;
  };

  // Stats - based on user's accessible properties
  const totalProperties = userProperties.length;
  const availableCount = userProperties.filter(p => p.status === 'available').length;
  const underOfferCount = userProperties.filter(p => p.status === 'under_offer').length;
  const soldCount = userProperties.filter(p => p.status === 'sold').length;

  // Form content - inlined to prevent re-renders that cause focus loss
  const renderPropertyForm = (onSubmit: () => void, submitLabel: string) => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Property Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Dubai Marina Penthouse"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Property Type *</Label>
          <Select value={formData.type} onValueChange={(value: PropertyType) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {propertyTypes.map((type) => (
                <SelectItem key={type} value={type}>{typeLabels[type]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Property description..."
          rows={3}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Price (AED) *</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            placeholder="e.g., 5000000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="e.g., Dubai Marina"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="area">Area (sqft) *</Label>
          <Input
            id="area"
            type="number"
            value={formData.area_sqft}
            onChange={(e) => setFormData(prev => ({ ...prev, area_sqft: e.target.value }))}
            placeholder="e.g., 2500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input
            id="bedrooms"
            type="number"
            value={formData.bedrooms}
            onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
            placeholder="e.g., 3"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input
            id="bathrooms"
            type="number"
            value={formData.bathrooms}
            onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
            placeholder="e.g., 2"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value: PropertyStatus) => setFormData(prev => ({ ...prev, status: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="under_offer">Under Offer</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="rented">Rented</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="owner_name">Owner Name</Label>
          <Input
            id="owner_name"
            value={formData.owner_name}
            onChange={(e) => setFormData(prev => ({ ...prev, owner_name: e.target.value }))}
            placeholder="Property owner name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="owner_phone">Owner Phone</Label>
          <Input
            id="owner_phone"
            value={formData.owner_phone}
            onChange={(e) => setFormData(prev => ({ ...prev, owner_phone: e.target.value }))}
            placeholder="+971 50 123 4567"
          />
        </div>
      </div>

      {/* Media Upload Section */}
      <div className="space-y-4 pt-4 border-t border-border">
        <Label className="text-base font-semibold">Property Media</Label>

        {/* Image Upload */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 text-accent" />
            <Label className="text-sm">Images</Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {uploadedImages.map((img) => (
              <div key={img.id} className="relative group">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => removeMedia(img.id, 'image')}
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-accent/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground mt-1">Add</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'image')}
              />
            </label>
          </div>
        </div>

        {/* Video Upload */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-blue-400" />
            <Label className="text-sm">Videos</Label>
          </div>
          <div className="space-y-2">
            {uploadedVideos.map((vid) => (
              <div key={vid.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 group">
                <Video className="h-5 w-5 text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{vid.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(vid.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeMedia(vid.id, 'video')}
                  className="h-6 w-6 rounded-full hover:bg-destructive/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4 text-destructive" />
                </button>
              </div>
            ))}
            <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-dashed border-border hover:border-blue-400/50 cursor-pointer transition-colors">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Upload video files</span>
              <input
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'video')}
              />
            </label>
          </div>
        </div>

        {/* PDF/Document Upload */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-red-400" />
            <Label className="text-sm">Documents (PDF)</Label>
          </div>
          <div className="space-y-2">
            {uploadedDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 group">
                <FileText className="h-5 w-5 text-red-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(doc.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeMedia(doc.id, 'pdf')}
                  className="h-6 w-6 rounded-full hover:bg-destructive/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4 text-destructive" />
                </button>
              </div>
            ))}
            <label className="flex items-center gap-2 p-3 rounded-lg border-2 border-dashed border-border hover:border-red-400/50 cursor-pointer transition-colors">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Upload PDF documents</span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'pdf')}
              />
            </label>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" onClick={onSubmit} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Header
        title="Properties"
        subtitle="Browse and manage your property listings"
      />

      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Properties</p>
              <p className="text-2xl font-bold">{totalProperties}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-2xl font-bold text-emerald-400">{availableCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Under Offer</p>
              <p className="text-2xl font-bold text-amber-400">{underOfferCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Sold</p>
              <p className="text-2xl font-bold text-blue-400">{soldCount}</p>
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
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {isAdmin && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => resetForm()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Property</DialogTitle>
                  <DialogDescription>
                    Enter the details of the new property listing.
                  </DialogDescription>
                </DialogHeader>
                {renderPropertyForm(handleAddProperty, "Add Property")}
              </DialogContent>
            </Dialog>
            )}
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Property</DialogTitle>
              <DialogDescription>
                Update the property details.
              </DialogDescription>
            </DialogHeader>
            {renderPropertyForm(handleEditProperty, "Save Changes")}
          </DialogContent>
        </Dialog>

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No properties found matching your criteria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProperties.map((property) => (
              <Card key={property.id} className="bg-card border-border overflow-hidden hover:border-accent/50 transition-colors group">
                {/* Property Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center relative">
                  <Building2 className="h-16 w-16 text-accent/40" />
                  <Badge className={`absolute top-3 left-3 ${statusColors[property.status]}`}>
                    {statusLabels[property.status]}
                  </Badge>
                  <Badge variant="outline" className="absolute top-3 right-3 bg-background/80">
                    {typeLabels[property.type]}
                  </Badge>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{property.title}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {property.location}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(property)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleArchiveProperty(property.id)}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteProperty(property.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {property.description}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    {property.bedrooms && (
                      <span className="flex items-center gap-1">
                        <Bed className="h-4 w-4" /> {property.bedrooms} Beds
                      </span>
                    )}
                    {property.bathrooms && (
                      <span className="flex items-center gap-1">
                        <Bath className="h-4 w-4" /> {property.bathrooms} Baths
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Maximize2 className="h-4 w-4" /> {property.area_sqft.toLocaleString()} sqft
                    </span>
                  </div>

                  {/* Created By Info */}
                  {isAdmin && property.created_by && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      {(() => {
                        const creator = getUserById(property.created_by);
                        return (
                          <>
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[10px] bg-accent/20 text-accent">
                                {creator ? getInitials(creator.full_name) : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span>
                              {creator?.full_name || 'Unknown'}
                              <span className="mx-1">•</span>
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {formatRelativeTime(property.created_at)}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <p className="text-xl font-bold text-accent">{formatPrice(property.price)}</p>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
