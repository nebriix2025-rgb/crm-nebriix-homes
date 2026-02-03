import { Bell, Search, Moon, Sun, Building2, Users2, Handshake, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/lib/store';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { activities, properties, leads, users } = useAppStore();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  const recentActivities = activities.slice(0, 5);

  // Keyboard shortcut for search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen(open => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Filter search results
  const searchResults = useCallback(() => {
    if (!localSearch.trim()) return { properties: [], leads: [], users: [] };
    const query = localSearch.toLowerCase();

    return {
      properties: properties.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.location.toLowerCase().includes(query) ||
        p.type.toLowerCase().includes(query)
      ).slice(0, 5),
      leads: leads.filter(l =>
        l.name.toLowerCase().includes(query) ||
        l.email.toLowerCase().includes(query) ||
        l.phone.includes(query)
      ).slice(0, 5),
      users: isAdmin ? users.filter(u =>
        u.full_name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      ).slice(0, 3) : [],
    };
  }, [localSearch, properties, leads, users, isAdmin]);

  const results = searchResults();
  const hasResults = results.properties.length > 0 || results.leads.length > 0 || results.users.length > 0;

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  const getActivityDescription = (activity: typeof activities[0]) => {
    switch (activity.action) {
      case 'property_added':
        return `Added property: ${activity.entity_name}`;
      case 'property_sold':
        return `Sold property: ${activity.entity_name}`;
      case 'lead_added':
        return `Added lead: ${activity.entity_name}`;
      case 'lead_converted':
        return `Converted lead: ${activity.entity_name}`;
      case 'deal_created':
        return `Created deal: ${activity.entity_name}`;
      case 'deal_closed':
        return `Closed deal: ${activity.entity_name}`;
      case 'login':
        return 'Logged in';
      case 'user_created':
        return `New user: ${activity.entity_name}`;
      default:
        return activity.action;
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Title */}
        <div>
          <h1 className="text-xl font-heading font-semibold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Search Button */}
          <Button
            variant="outline"
            className="relative hidden md:flex w-64 justify-start text-muted-foreground"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-4 w-4 mr-2" />
            <span>Search...</span>
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <Command className="h-3 w-3" />K
            </kbd>
          </Button>

          {/* Dark Mode Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {recentActivities.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                    {recentActivities.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Recent Activity</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {recentActivities.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No recent activity
                </div>
              ) : (
                recentActivities.map((activity) => (
                  <DropdownMenuItem key={activity.id} className="flex flex-col items-start gap-1 p-3">
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-medium">{activity.user?.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.created_at)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {getActivityDescription(activity)}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Global Search Dialog */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <div className="flex items-center border-b px-4 py-3">
            <Search className="h-5 w-5 text-muted-foreground mr-3" />
            <input
              autoFocus
              placeholder="Search properties, leads, users..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-base"
            />
            {localSearch && (
              <Button variant="ghost" size="sm" onClick={() => setLocalSearch('')}>
                Clear
              </Button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto p-2">
            {!localSearch ? (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Start typing to search across properties, leads, and users</p>
                <p className="text-xs mt-2">Press <kbd className="px-1 py-0.5 rounded bg-muted">Enter</kbd> to select, <kbd className="px-1 py-0.5 rounded bg-muted">Esc</kbd> to close</p>
              </div>
            ) : !hasResults ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No results found for "{localSearch}"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Properties */}
                {results.properties.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground px-2 py-1 flex items-center gap-2">
                      <Building2 className="h-3 w-3" />
                      Properties ({results.properties.length})
                    </p>
                    {results.properties.map((property) => (
                      <button
                        key={property.id}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                        onClick={() => {
                          navigate('/dashboard/properties');
                          setIsSearchOpen(false);
                          setLocalSearch('');
                        }}
                      >
                        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{property.title}</p>
                          <p className="text-sm text-muted-foreground">{property.location} • {property.type}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0">{property.status}</Badge>
                      </button>
                    ))}
                  </div>
                )}

                {/* Leads */}
                {results.leads.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground px-2 py-1 flex items-center gap-2">
                      <Users2 className="h-3 w-3" />
                      Leads ({results.leads.length})
                    </p>
                    {results.leads.map((lead) => (
                      <button
                        key={lead.id}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                        onClick={() => {
                          navigate('/dashboard/leads');
                          setIsSearchOpen(false);
                          setLocalSearch('');
                        }}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-accent/20 text-accent">
                            {getInitials(lead.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{lead.name}</p>
                          <p className="text-sm text-muted-foreground">{lead.email} • {lead.source}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0">{lead.status}</Badge>
                      </button>
                    ))}
                  </div>
                )}

                {/* Users (Admin only) */}
                {isAdmin && results.users.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground px-2 py-1 flex items-center gap-2">
                      <Handshake className="h-3 w-3" />
                      Users ({results.users.length})
                    </p>
                    {results.users.map((user) => (
                      <button
                        key={user.id}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                        onClick={() => {
                          navigate('/dashboard/users');
                          setIsSearchOpen(false);
                          setLocalSearch('');
                        }}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-accent/20 text-accent">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant="outline" className="capitalize shrink-0">{user.role}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
