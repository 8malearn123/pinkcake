import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRoles, AppRole } from '@/hooks/useMyRoles';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: AppRole[];
}

// Admin-only routes that should be blocked for branch/kitchen users
const ADMIN_ONLY_ROUTES = [
  '/settings',
  '/users',
  '/branches',
  '/reports',
  '/loyalty',
];

// Get role-based landing page for redirect with fallback
const getRoleLandingPage = (roles: AppRole[]): string => {
  if (roles.includes('admin')) return '/dashboard';
  if (roles.includes('call_center')) return '/dashboard';
  if (roles.includes('kitchen')) return '/kitchen';
  if (roles.includes('branch')) return '/branch-orders';
  if (roles.includes('driver')) return '/driver';
  // Default fallback: customer or unknown roles go to store
  return '/store';
};

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const { data: roles = [], isLoading: rolesLoading, isFetched: rolesFetched } = useMyRoles();

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Authenticated but still loading roles - show loading
  if (rolesLoading && !rolesFetched) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // Check if trying to access admin-only routes
  const isAdminOnlyRoute = ADMIN_ONLY_ROUTES.some(route => 
    location.pathname === route || location.pathname.startsWith(`${route}/`)
  );

  // Block branch and kitchen users from admin-only routes
  if (isAdminOnlyRoute && !roles.includes('admin')) {
    const landingPage = getRoleLandingPage(roles);
    return <Navigate to={landingPage} state={{ accessDenied: true }} replace />;
  }

  // Check if branch/kitchen users are trying to access the dashboard
  if (location.pathname === '/dashboard') {
    // Only admin and call_center can access the main dashboard
    if (!roles.includes('admin') && !roles.includes('call_center')) {
      const landingPage = getRoleLandingPage(roles);
      return <Navigate to={landingPage} replace />;
    }
  }

  // If specific roles are required, check if user has any of them
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => roles.includes(role));
    
    if (!hasRequiredRole) {
      // Redirect to role-appropriate landing page
      const landingPage = getRoleLandingPage(roles);
      return <Navigate to={landingPage} state={{ accessDenied: true }} replace />;
    }
  }

  // All checks passed - render children
  return <>{children}</>;
}
