import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardPage } from './pages/Dashboard';
import { DealsPage } from './pages/Deals';
import { PropertiesPage } from './pages/Properties';
import { LeadsPage } from './pages/Leads';
import { AnalyticsPage } from './pages/Analytics';
import { SettingsPage } from './pages/Settings';
import { UsersPage } from './pages/Users';
import { AuditLogPage } from './pages/AuditLog';
import { LoginPage } from './pages/Login';
import { ResetPasswordPage } from './pages/ResetPassword';
import Rewards from './pages/Rewards';
import Referrals from './pages/Referrals';
import RewardsAdmin from './pages/RewardsAdmin';
import { useAuth } from './contexts/AuthContext';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { hasRole } = useAuth();

  if (roles && !hasRole(roles as any)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      {/* Dashboard Routes - No Auth Required */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="deals" element={<DealsPage />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="referrals" element={<Referrals />} />
        <Route
          path="rewards-admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <RewardsAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="analytics"
          element={
            <ProtectedRoute roles={['admin']}>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute roles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="audit-log"
          element={
            <ProtectedRoute roles={['admin']}>
              <AuditLogPage />
            </ProtectedRoute>
          }
        />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Login Route */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
