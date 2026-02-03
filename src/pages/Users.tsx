import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Plus,
  MoreVertical,
  Search,
  Edit,
  Trash2,
  Shield,
  Mail,
  UserCheck,
  UserX,
  Eye,
  Activity,
  Building2,
  Users as UsersIcon,
  Handshake,
  AlertTriangle,
} from 'lucide-react';
import { formatDate, getInitials, cn } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import type { User, UserRole, UserStatus } from '@/types';
import { Navigate } from 'react-router-dom';

export function UsersPage() {
  const { user: currentUser, isAdmin } = useAuth();
  const { users, addUser, updateUser, deleteUser, toggleUserStatus, getUserActivitySummary } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'user' as UserRole,
    status: 'active' as UserStatus,
    phone: '',
    password: '',
  });

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check for duplicate email
    const existingUser = users.find(
      u => u.email.toLowerCase() === formData.email.toLowerCase() && u.id !== editingUser?.id
    );
    if (existingUser) {
      toast({
        title: 'Email already exists',
        description: 'A user with this email already exists.',
        variant: 'destructive',
      });
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        phone: formData.phone,
      });
      toast({
        title: 'User updated',
        description: `${formData.full_name}'s profile has been updated.`,
        variant: 'success',
      });
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        phone: formData.phone,
        password_hash: formData.password || 'demo123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      addUser(newUser);

      // Also save to localStorage for auth
      const storedUsers = localStorage.getItem('nebriix_users');
      const existingUsers: User[] = storedUsers ? JSON.parse(storedUsers) : [];
      existingUsers.push(newUser);
      localStorage.setItem('nebriix_users', JSON.stringify(existingUsers));

      toast({
        title: 'User created',
        description: `${formData.full_name} has been added to the team.`,
        variant: 'success',
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({ full_name: '', email: '', role: 'user', status: 'active', phone: '', password: '' });
    setEditingUser(null);
    setShowAddDialog(false);
  };

  const handleEdit = (user: User) => {
    setFormData({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone || '',
      password: '',
    });
    setEditingUser(user);
    setShowAddDialog(true);
  };

  const handleDelete = () => {
    if (!deletingUser) return;

    if (deletingUser.id === currentUser?.id) {
      toast({
        title: 'Cannot delete yourself',
        description: 'You cannot delete your own account.',
        variant: 'destructive',
      });
      setDeletingUser(null);
      return;
    }

    deleteUser(deletingUser.id);

    // Also remove from localStorage
    const storedUsers = localStorage.getItem('nebriix_users');
    if (storedUsers) {
      const users: User[] = JSON.parse(storedUsers);
      const filtered = users.filter(u => u.id !== deletingUser.id);
      localStorage.setItem('nebriix_users', JSON.stringify(filtered));
    }

    toast({
      title: 'User removed',
      description: `${deletingUser.full_name} has been removed from the team.`,
    });
    setDeletingUser(null);
  };

  const handleToggleStatus = (user: User) => {
    if (user.id === currentUser?.id) {
      toast({
        title: 'Cannot deactivate yourself',
        description: 'You cannot deactivate your own account.',
        variant: 'destructive',
      });
      return;
    }

    toggleUserStatus(user.id);

    // Also update in localStorage
    const storedUsers = localStorage.getItem('nebriix_users');
    if (storedUsers) {
      const users: User[] = JSON.parse(storedUsers);
      const idx = users.findIndex(u => u.id === user.id);
      if (idx >= 0) {
        users[idx].status = users[idx].status === 'active' ? 'inactive' : 'active';
        localStorage.setItem('nebriix_users', JSON.stringify(users));
      }
    }

    toast({
      title: `User ${user.status === 'active' ? 'deactivated' : 'activated'}`,
      description: `${user.full_name}'s account has been ${user.status === 'active' ? 'deactivated' : 'activated'}.`,
    });
  };

  const getRoleColor = (role: UserRole) => {
    return role === 'admin'
      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'inactive':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'suspended':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const roleStats = {
    admin: users.filter((u) => u.role === 'admin').length,
    user: users.filter((u) => u.role === 'user').length,
    active: users.filter((u) => u.status === 'active').length,
    inactive: users.filter((u) => u.status !== 'active').length,
  };

  return (
    <div className="min-h-screen">
      <Header title="User Management" subtitle="Manage team members and permissions" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Shield className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{roleStats.admin}</p>
                  <p className="text-sm text-muted-foreground">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <UsersIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{roleStats.user}</p>
                  <p className="text-sm text-muted-foreground">Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <UserCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{roleStats.active}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-500/20">
                  <UserX className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{roleStats.inactive}</p>
                  <p className="text-sm text-muted-foreground">Inactive</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-4 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => {
              resetForm();
              setShowAddDialog(true);
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Users Table */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium">User</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Role</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Status</th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">Activity</th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">Joined</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const activity = getUserActivitySummary(user.id);
                    return (
                      <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback className="bg-accent/20 text-accent">
                                {getInitials(user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.full_name}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <Badge className={cn('capitalize', getRoleColor(user.role))}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <Badge className={cn('capitalize', getStatusColor(user.status))}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          <div className="flex gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1" title="Properties">
                              <Building2 className="h-3 w-3" /> {activity.properties}
                            </span>
                            <span className="flex items-center gap-1" title="Leads">
                              <UsersIcon className="h-3 w-3" /> {activity.leads}
                            </span>
                            <span className="flex items-center gap-1" title="Deals">
                              <Handshake className="h-3 w-3" /> {activity.deals}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 hidden lg:table-cell text-sm text-muted-foreground">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewingUser(user)}>
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(user)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                {user.status === 'active' ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" /> Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" /> Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeletingUser(user)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
              <DialogDescription>
                {editingUser
                  ? 'Update the user details below.'
                  : 'Create a new team member account.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Smith"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@nebriix.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+971 50 123 4567"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(v) => setFormData({ ...formData, role: v as UserRole })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v as UserStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Leave empty for default (demo123)"
                  />
                  <p className="text-xs text-muted-foreground">Default password: demo123</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-accent/20 text-accent text-xl">
                    {getInitials(viewingUser.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{viewingUser.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{viewingUser.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className={cn('capitalize', getRoleColor(viewingUser.role))}>
                      {viewingUser.role}
                    </Badge>
                    <Badge className={cn('capitalize', getStatusColor(viewingUser.status))}>
                      {viewingUser.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{viewingUser.phone || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Joined</p>
                  <p className="font-medium">{formatDate(viewingUser.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Login</p>
                  <p className="font-medium">
                    {viewingUser.last_login ? formatDate(viewingUser.last_login) : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatDate(viewingUser.updated_at)}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Activity Summary
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {(() => {
                    const summary = getUserActivitySummary(viewingUser.id);
                    return (
                      <>
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold">{summary.properties}</p>
                          <p className="text-xs text-muted-foreground">Properties</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold">{summary.leads}</p>
                          <p className="text-xs text-muted-foreground">Leads</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold">{summary.deals}</p>
                          <p className="text-xs text-muted-foreground">Deals</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingUser(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (viewingUser) {
                  handleEdit(viewingUser);
                  setViewingUser(null);
                }
              }}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Edit User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingUser?.full_name}? This action cannot be undone.
              All data created by this user will remain but will no longer be associated with them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingUser(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
