import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/lib/store';

export function DashboardLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { setCurrentUser } = useAppStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync current user to the store for data isolation
  useEffect(() => {
    if (user) {
      setCurrentUser(user.id);
    } else {
      setCurrentUser(null);
    }
  }, [user, setCurrentUser]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, []);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            <div className="absolute inset-0 flex items-center justify-center">
              <img src="/images/nebriix-logo-gold.png" alt="Nebriix Homes" className="h-10 w-10 rounded-full object-cover" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="font-heading text-xl font-semibold text-foreground">Nebriix Homes</h2>
            <p className="text-sm text-muted-foreground mt-1">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Desktop Sidebar - hidden on mobile */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Mobile Navigation */}
      <MobileNav isOpen={mobileMenuOpen} onToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

      {/* Main Content */}
      <main className={`
        transition-all duration-300 min-h-screen overflow-y-auto
        pt-14 md:pt-0
        px-0
        md:pl-[70px] lg:pl-64
        ${sidebarCollapsed ? 'md:pl-[70px]' : 'md:pl-64 lg:pl-64'}
      `}>
        <Outlet />
      </main>
    </div>
  );
}
