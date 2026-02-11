import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Handshake,
  Building2,
  Users2,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCog,
  ScrollText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['admin', 'user'] },
  { icon: Handshake, label: 'Deals', href: '/dashboard/deals', roles: ['admin', 'user'] },
  { icon: Building2, label: 'Properties', href: '/dashboard/properties', roles: ['admin', 'user'] },
  { icon: Users2, label: 'Leads', href: '/dashboard/leads', roles: ['admin', 'user'] },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics', roles: ['admin'] },
  { icon: UserCog, label: 'Users', href: '/dashboard/users', roles: ['admin'] },
  { icon: ScrollText, label: 'Audit Log', href: '/dashboard/audit-log', roles: ['admin'] },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings', roles: ['admin', 'user'] },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const { user, signOut, hasRole } = useAuth();
  const location = useLocation();

  const filteredNavItems = navItems.filter((item) =>
    item.roles.some((role) => hasRole(role as 'admin' | 'user'))
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 hidden md:block',
        collapsed ? 'w-[70px]' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <div className="flex items-center">
              <img src="/images/nebriix-logo.svg" alt="Nebriix Homes" className="h-10 w-auto" />
            </div>
          )}
          {collapsed && (
            <div className="flex items-center justify-center mx-auto">
              <img src="/images/nebriix-logo.svg" alt="NH" className="h-8 w-auto" />
            </div>
          )}
          {onToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className={cn(
                'h-8 w-8 text-sidebar-foreground hover:bg-sidebar-border hover:text-accent',
                collapsed && 'absolute -right-4 top-6 rounded-full bg-sidebar border border-sidebar-border shadow-md'
              )}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          {!collapsed && (
            <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              Main Menu
            </p>
          )}
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href ||
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-accent/20 to-accent/10 text-accent shadow-sm border border-accent/20'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-border/50 hover:text-sidebar-foreground',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive ? 'text-accent' : 'group-hover:text-accent'
                )} />
                {!collapsed && <span>{item.label}</span>}
                {isActive && !collapsed && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-accent animate-pulse" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t border-sidebar-border p-4">
          <div className={cn('flex items-center gap-3', collapsed && 'flex-col')}>
            <Avatar className="h-10 w-10 border-2 border-accent/30 ring-2 ring-accent/10">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-accent/20 to-accent/10 text-accent font-semibold">
                {user ? getInitials(user.full_name) : 'U'}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.full_name}</p>
                <p className="text-xs text-accent capitalize">{user?.role}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="h-8 w-8 text-sidebar-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
