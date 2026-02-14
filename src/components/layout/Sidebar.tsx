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
  Trophy,
  Users,
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
  { icon: Trophy, label: 'Rewards', href: '/dashboard/rewards', roles: ['admin', 'user'] },
  { icon: Users, label: 'Referrals', href: '/dashboard/referrals', roles: ['admin', 'user'] },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics', roles: ['admin'] },
  { icon: UserCog, label: 'Users', href: '/dashboard/users', roles: ['admin'] },
  { icon: Trophy, label: 'Manage Rewards', href: '/dashboard/rewards-admin', roles: ['admin'] },
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
        'fixed left-0 top-0 z-40 h-screen sidebar-glass text-sidebar-foreground transition-all duration-300 hidden md:block border-r border-sidebar-border/50',
        collapsed ? 'w-[70px]' : 'md:w-[70px] lg:w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border/40 px-4">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-sm font-bold text-white">N</span>
              </div>
              <span className="font-heading text-base font-semibold text-sidebar-foreground hidden lg:block">Nebriix</span>
            </div>
          )}
          {collapsed && (
            <div className="flex items-center justify-center mx-auto">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-sm font-bold text-white">N</span>
              </div>
            </div>
          )}
          {onToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className={cn(
                'h-7 w-7 text-sidebar-foreground/50 hover:bg-sidebar-border/50 hover:text-sidebar-foreground rounded-lg',
                collapsed && 'absolute -right-3.5 top-6 rounded-full bg-card border border-border shadow-md text-foreground hover:bg-card'
              )}
            >
              {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto scrollbar-thin">
          {!collapsed && (
            <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/30">
              Navigation
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
                  'group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-border/30 hover:text-sidebar-foreground',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn(
                  'h-[18px] w-[18px] shrink-0 transition-all duration-200',
                  isActive ? 'text-primary' : 'group-hover:text-sidebar-accent'
                )} />
                {!collapsed && <span className="hidden lg:block">{item.label}</span>}
                {isActive && !collapsed && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary hidden lg:block" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t border-sidebar-border/40 p-3">
          <div className={cn('flex items-center gap-3', collapsed && 'flex-col')}>
            <Avatar className="h-9 w-9 border border-sidebar-border/60">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {user ? getInitials(user.full_name) : 'U'}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0 hidden lg:block">
                <p className="text-[13px] font-medium truncate text-sidebar-foreground">{user?.full_name}</p>
                <p className="text-[11px] text-primary capitalize font-medium">{user?.role}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="h-8 w-8 text-sidebar-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-colors rounded-lg"
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
