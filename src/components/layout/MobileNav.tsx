import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Handshake,
  Building2,
  Users2,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
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

interface MobileNavProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function MobileNav({ isOpen, onToggle }: MobileNavProps) {
  const { user, signOut, hasRole } = useAuth();
  const location = useLocation();

  const filteredNavItems = navItems.filter((item) =>
    item.roles.some((role) => hasRole(role as 'admin' | 'user'))
  );

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar text-sidebar-foreground border-b border-sidebar-border md:hidden">
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-9 w-9 text-sidebar-foreground hover:bg-sidebar-border"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <img src="/images/nebriix-logo.svg" alt="N&H Homes" className="h-8 w-auto" />
          </div>

          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border border-primary/30">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {user ? getInitials(user.full_name) : 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={cn(
          'fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-72 bg-sidebar text-sidebar-foreground transform transition-transform duration-300 ease-in-out md:hidden overflow-y-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              Main Menu
            </p>
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href ||
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onToggle}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary shadow-sm border border-primary/20'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-border/50 hover:text-sidebar-foreground'
                  )}
                >
                  <Icon className={cn(
                    'h-5 w-5 shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'group-hover:text-primary'
                  )} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/30 ring-2 ring-primary/10">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                  {user ? getInitials(user.full_name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.full_name}</p>
                <p className="text-xs text-primary capitalize">{user?.role}</p>
              </div>
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
      </div>
    </>
  );
}
