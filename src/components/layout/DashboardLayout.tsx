import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/lib/store';

export function DashboardLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { setCurrentUser } = useAppStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sync current user to the store for data isolation
  useEffect(() => {
    if (user) {
      setCurrentUser(user.id);
    } else {
      setCurrentUser(null);
    }
  }, [user, setCurrentUser]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-accent">N</span>
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
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main className={`transition-all duration-300 min-h-screen overflow-y-auto ${sidebarCollapsed ? 'pl-[70px]' : 'pl-64'}`}>
        <Outlet />
      </main>
    </div>
  );
}
