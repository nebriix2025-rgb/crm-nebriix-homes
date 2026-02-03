import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ScrollText,
  Search,
  Filter,
  User,
  Building2,
  Users2,
  Handshake,
  Clock,
  ArrowRight,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatRelativeTime, getInitials } from '@/lib/utils';

const actionColors: Record<string, string> = {
  added: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  created: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  updated: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  changed: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  deleted: 'bg-red-500/20 text-red-500 border-red-500/30',
  archived: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  closed: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  login: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30',
  logout: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const entityIcons: Record<string, typeof Building2> = {
  property: Building2,
  lead: Users2,
  deal: Handshake,
  user: User,
};

function getActionColor(action: string): string {
  for (const [key, color] of Object.entries(actionColors)) {
    if (action.includes(key)) return color;
  }
  return 'bg-muted text-muted-foreground';
}

function formatActionLabel(action: string): string {
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function AuditLogPage() {
  const { auditLogs, users } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const filteredLogs = useMemo(() => {
    let logs = auditLogs;

    if (selectedUser !== 'all') {
      logs = logs.filter(l => l.user_id === selectedUser);
    }
    if (selectedEntity !== 'all') {
      logs = logs.filter(l => l.entity_type === selectedEntity);
    }
    if (selectedAction !== 'all') {
      logs = logs.filter(l => l.action.includes(selectedAction));
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      logs = logs.filter(l =>
        l.action.toLowerCase().includes(query) ||
        l.entity_type.toLowerCase().includes(query) ||
        l.user?.full_name.toLowerCase().includes(query) ||
        JSON.stringify(l.new_value || {}).toLowerCase().includes(query) ||
        JSON.stringify(l.old_value || {}).toLowerCase().includes(query)
      );
    }

    return logs.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [auditLogs, selectedUser, selectedEntity, selectedAction, searchQuery]);


  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedLogs(newExpanded);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedUser('all');
    setSelectedEntity('all');
    setSelectedAction('all');
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Details'];
    const rows = filteredLogs.map(log => [
      new Date(log.created_at).toISOString(),
      log.user?.full_name || 'Unknown',
      log.action,
      log.entity_type,
      log.entity_id,
      JSON.stringify(log.new_value || log.old_value || {}),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Audit Log"
        subtitle="Track all system activities and changes"
      />

      <div className="p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <ScrollText className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Logs</p>
                  <p className="text-2xl font-bold">{auditLogs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Building2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Property Actions</p>
                  <p className="text-2xl font-bold">
                    {auditLogs.filter(l => l.entity_type === 'property').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lead Actions</p>
                  <p className="text-2xl font-bold">
                    {auditLogs.filter(l => l.entity_type === 'lead').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <User className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User Actions</p>
                  <p className="text-2xl font-bold">
                    {auditLogs.filter(l => l.entity_type === 'user').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5 text-accent" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="property">Property</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="deal">Deal</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Action</Label>
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="added">Added/Created</SelectItem>
                    <SelectItem value="updated">Updated</SelectItem>
                    <SelectItem value="deleted">Deleted</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearFilters} className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                  <Button variant="outline" onClick={exportToCSV}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Card className="bg-card border-border gold-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent/10">
                <ScrollText className="h-5 w-5 text-accent" />
              </div>
              Activity Log
              <Badge variant="outline" className="ml-2">
                {filteredLogs.length} entries
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ScrollText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No audit logs found</p>
                  <p className="text-sm mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const EntityIcon = entityIcons[log.entity_type] || ScrollText;
                  const isExpanded = expandedLogs.has(log.id);
                  const hasDetails = log.old_value || log.new_value;

                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 border border-transparent hover:border-accent/20"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10 shrink-0 border-2 border-accent/20">
                          <AvatarFallback className="bg-gradient-to-br from-accent/20 to-accent/5 text-accent text-sm font-semibold">
                            {log.user ? getInitials(log.user.full_name) : 'S'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{log.user?.full_name || 'System'}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <Badge className={getActionColor(log.action)}>
                              {formatActionLabel(log.action)}
                            </Badge>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <EntityIcon className="h-4 w-4" />
                              <span className="text-sm capitalize">{log.entity_type}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(log.created_at)}
                            </span>
                            <span className="text-xs">
                              ID: {log.entity_id}
                            </span>
                          </div>

                          {/* Expandable Details */}
                          {hasDetails && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpand(log.id)}
                                className="mt-2 h-7 text-xs text-accent hover:text-accent/80"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="h-3 w-3 mr-1" />
                                    Hide Details
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                    Show Details
                                  </>
                                )}
                              </Button>
                              {isExpanded && (
                                <div className="mt-3 p-3 rounded-lg bg-background/50 text-xs font-mono space-y-2">
                                  {log.old_value && (
                                    <div>
                                      <span className="text-red-400">- Old:</span>
                                      <pre className="mt-1 text-muted-foreground overflow-x-auto">
                                        {JSON.stringify(log.old_value, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  {log.new_value && (
                                    <div>
                                      <span className="text-emerald-400">+ New:</span>
                                      <pre className="mt-1 text-muted-foreground overflow-x-auto">
                                        {JSON.stringify(log.new_value, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
