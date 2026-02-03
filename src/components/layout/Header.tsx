import { Bell, Search, Moon, Sun, Building2, Users2, Handshake, Command, Check, CheckCheck, Trash2, BellRing, Home, FileText, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/lib/store';
import { formatRelativeTime, getInitials, cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { NotificationType } from '@/types';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

// Helper function to get notification icon based on type
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'property_added':
    case 'property_updated':
      return <Home className="h-4 w-4 text-blue-500" />;
    case 'deal_created':
    case 'deal_updated':
    case 'deal_closed':
      return <Handshake className="h-4 w-4 text-green-500" />;
    case 'lead_added':
    case 'lead_assigned':
    case 'lead_import':
      return <Users2 className="h-4 w-4 text-purple-500" />;
    case 'announcement':
      return <BellRing className="h-4 w-4 text-accent" />;
    case 'user_created':
      return <UserPlus className="h-4 w-4 text-teal-500" />;
    case 'password_changed':
    case 'profile_updated':
      return <FileText className="h-4 w-4 text-orange-500" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

// Helper function to get priority badge color
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'medium':
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    default:
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  }
};

export function Header({ title, subtitle }: HeaderProps) {
  const { properties, leads, users, notifications, markNotificationRead, markAllNotificationsRead, deleteNotification, getUnreadCountForUser } = useAppStore();
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  // Get notifications for current user
  const userNotifications = user ? notifications.filter(n => n.recipient_id === user.id) : [];
  const unreadCount = user ? getUnreadCountForUser(user.id) : 0;

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
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h4 className="font-semibold">Notifications</h4>
                  <p className="text-xs text-muted-foreground">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                  </p>
                </div>
                {unreadCount > 0 && user && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => markAllNotificationsRead(user.id)}
                  >
                    <CheckCheck className="h-3.5 w-3.5 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>

              <ScrollArea className="max-h-[400px]">
                {userNotifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                      <Bell className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You'll be notified when something important happens
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {userNotifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 hover:bg-muted/50 transition-colors cursor-pointer relative",
                          !notification.read && "bg-accent/5"
                        )}
                        onClick={() => {
                          markNotificationRead(notification.id);
                          // Navigate based on entity type
                          if (notification.entity_type === 'property') {
                            navigate('/dashboard/properties');
                          } else if (notification.entity_type === 'deal') {
                            navigate('/dashboard/deals');
                          } else if (notification.entity_type === 'lead') {
                            navigate('/dashboard/leads');
                          }
                        }}
                      >
                        {!notification.read && (
                          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent" />
                        )}
                        <div className="flex gap-3 pl-2">
                          <div className="shrink-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn(
                                "text-sm leading-tight",
                                !notification.read && "font-semibold"
                              )}>
                                {notification.title}
                              </p>
                              <Badge
                                variant="outline"
                                className={cn("text-[10px] px-1.5 py-0 shrink-0", getPriorityColor(notification.priority))}
                              >
                                {notification.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-muted-foreground">
                                {notification.sender?.full_name && `From ${notification.sender.full_name} • `}
                                {formatRelativeTime(notification.created_at)}
                              </span>
                              <div className="flex gap-1">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markNotificationRead(notification.id);
                                    }}
                                    title="Mark as read"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  title="Delete"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {userNotifications.length > 10 && (
                <div className="p-3 border-t text-center">
                  <Button variant="ghost" size="sm" className="text-xs w-full">
                    View all {userNotifications.length} notifications
                  </Button>
                </div>
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
