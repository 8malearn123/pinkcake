import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMyRoles, AppRole } from './useMyRoles';

// Define role-based landing pages (staff go to dashboards, customers stay on store)
const ROLE_LANDING_PAGES: Record<AppRole, string> = {
  admin: '/live',
  call_center: '/live',
  kitchen: '/kitchen',
  branch: '/branch-orders',
  customer: '/store',
  driver: '/driver',
};

// Define which routes each role can access. Call centre now covers customer
// support too, so the support screens (submissions, custom & event orders) are
// part of its surface.
const ROLE_ALLOWED_ROUTES: Record<AppRole, string[]> = {
  admin: ['*'], // Admin can access all routes
  call_center: [
    '/', '/orders', '/orders/new', '/orders/new-event', '/orders/:id', '/live', '/products',
    '/submissions', '/custom-orders',
  ],
  kitchen: ['/kitchen', '/orders/:id', '/live'],
  branch: ['/branch-orders', '/branch-live', '/branch-pickup', '/orders/:id', '/orders/new', '/orders/new-event', '/custom-orders'],
  customer: ['/store', '/my-orders', '/my-orders/:id', '/my-profile'],
  driver: ['/driver', '/orders/:id'],
};

// Admin-only routes that should be blocked for branch/kitchen
const ADMIN_ONLY_ROUTES = [
  '/settings',
  '/users',
  '/branches',
  '/reports',
  '/products',
  '/loyalty',
];

export function useRoleRedirect() {
  const { data: roles = [], isLoading } = useMyRoles();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the appropriate landing page for the user's primary role
  const getLandingPage = (): string => {
    if (roles.includes('admin')) return '/live';
    if (roles.includes('call_center')) return '/live';
    if (roles.includes('kitchen')) return '/kitchen';
    if (roles.includes('branch')) return '/branch-orders';
    if (roles.includes('driver')) return '/driver';
    if (roles.includes('customer')) return '/my-orders';
    return '/store'; // Default: guest store
  };

  // Check if user can access a specific route based on their roles
  const canAccessRoute = (path: string): boolean => {
    // Admin can access everything
    if (roles.includes('admin')) return true;

    // Check if the route is admin-only
    const isAdminOnlyRoute = ADMIN_ONLY_ROUTES.some(route => 
      path === route || path.startsWith(`${route}/`)
    );

    if (isAdminOnlyRoute) {
      return false;
    }

    // For call_center (which now also covers customer support), allow the
    // dashboard, orders, live, products and the support screens.
    if (roles.includes('call_center')) {
      const allowedPaths = ['/dashboard', '/orders', '/live', '/products', '/submissions', '/custom-orders'];
      return allowedPaths.some(p => path === p || path.startsWith('/orders'));
    }

    // For kitchen, only allow kitchen page and order details
    if (roles.includes('kitchen')) {
      return path === '/kitchen' || path === '/live' || path.startsWith('/orders/');
    }

    // For branch, allow its own screens, order details and the three order
    // creation flows (regular / custom / event) it now runs over the counter.
    if (roles.includes('branch')) {
      return (
        path === '/branch-orders' || path === '/branch-live' || path === '/branch-pickup' ||
        path === '/custom-orders' || path.startsWith('/orders/')
      );
    }

    // For driver, allow driver page and order details
    if (roles.includes('driver')) {
      return path === '/driver' || path.startsWith('/orders/');
    }

    return false;
  };

  return {
    roles,
    isLoading,
    getLandingPage,
    canAccessRoute,
    isAdmin: roles.includes('admin'),
    isCallCenter: roles.includes('call_center'),
    isKitchen: roles.includes('kitchen'),
    isBranch: roles.includes('branch'),
    isCustomer: roles.includes('customer'),
    isDriver: roles.includes('driver'),
  };
}

// Hook to redirect user to their role-appropriate landing page
export function useRedirectToRoleLandingPage() {
  const { getLandingPage, isLoading } = useRoleRedirect();
  const navigate = useNavigate();

  const redirectToLandingPage = () => {
    if (!isLoading) {
      const landingPage = getLandingPage();
      navigate(landingPage, { replace: true });
    }
  };

  return { redirectToLandingPage, isLoading };
}
