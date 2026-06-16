import { lazy, Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { SettingsProvider } from "./contexts/SettingsContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ImpersonationProvider } from "./contexts/ImpersonationContext";
import { StoreCartProvider } from "./contexts/StoreCartContext";
import { StoreWishlistProvider } from "./contexts/StoreWishlistContext";
import { ImpersonationBanner } from "./components/admin/ImpersonationBanner";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { DemoModeBadge } from "./components/demo/DemoModeBadge";
import { LOZA_ENABLED } from "./lib/featureFlags";

// Route components are code-split: each page ships in its own lazy chunk so the
// initial bundle stays small and heavy routes (Reports, Store, customizers) load
// on demand.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Orders = lazy(() => import("./pages/Orders"));
const NewOrder = lazy(() => import("./pages/NewOrder"));
const OrderDetails = lazy(() => import("./pages/OrderDetails"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const Kitchen = lazy(() => import("./pages/Kitchen"));
const BranchOrders = lazy(() => import("./pages/BranchOrders"));
const Reports = lazy(() => import("./pages/Reports"));
const LiveDashboard = lazy(() => import("./pages/LiveDashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const Products = lazy(() => import("./pages/Products"));
const Branches = lazy(() => import("./pages/Branches"));
const Users = lazy(() => import("./pages/Users"));
const Login = lazy(() => import("./pages/Login"));
const Store = lazy(() => import("./pages/Store"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Shop = lazy(() => import("./pages/Shop"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const MyOrderDetails = lazy(() => import("./pages/MyOrderDetails"));
const CustomerProfile = lazy(() => import("./pages/CustomerProfile"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ContactSubmissions = lazy(() => import("./pages/ContactSubmissions"));
const BranchPickupScanner = lazy(() => import("./pages/BranchPickupScanner"));
const BranchLive = lazy(() => import("./pages/BranchLive"));
const Driver = lazy(() => import("./pages/Driver"));
const CustomOrders = lazy(() => import("./pages/CustomOrders"));
const CakeCustomizer = lazy(() => import("./pages/CakeCustomizer"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const DesignSystem = lazy(() => import("./pages/DesignSystem"));
const LozaHome = lazy(() => import("./pages/loza/LozaHome"));
const LozaCustomizer = lazy(() => import("./pages/loza/LozaCustomizer"));
const LozaCakeDetails = lazy(() => import("./pages/loza/LozaCakeDetails"));
const LozaCart = lazy(() => import("./pages/loza/LozaCart"));
const LozaCheckout = lazy(() => import("./pages/loza/LozaCheckout"));
const LozaOrders = lazy(() => import("./pages/loza/LozaOrders"));
const LozaOrderDetails = lazy(() => import("./pages/loza/LozaOrderDetails"));
const LozaProfile = lazy(() => import("./pages/loza/LozaProfile"));
const LozaSearch = lazy(() => import("./pages/loza/LozaSearch"));
const LozaVendor = lazy(() => import("./pages/loza/LozaVendor"));
const LozaWishlist = lazy(() => import("./pages/loza/LozaWishlist"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30s — avoid immediate refetches on remount
      gcTime: 5 * 60_000, // keep cache 5 min after unused
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

// Public storefront layout — provides the shared cart to the landing page and the
// product details route so "add to cart" stays in sync across them.
function StorefrontLayout() {
  return (
    <StoreCartProvider>
      <StoreWishlistProvider>
        <Outlet />
      </StoreWishlistProvider>
    </StoreCartProvider>
  );
}

// Reset scroll to the top on every route change — React Router preserves the
// previous scroll position otherwise (e.g. clicking an occasion near the bottom
// of the home page would land you near the bottom of /shop).
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
      <AuthProvider>
        <ImpersonationProvider>
          <TooltipProvider>
            <Toaster />
            <DemoModeBadge />
            <ImpersonationBanner />
            <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public storefront — shares a cart context across landing, details + customizer */}
              <Route element={<StorefrontLayout />}>
                <Route path="/" element={<Store />} />
                <Route path="/store" element={<Store />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/customize" element={<CakeCustomizer />} />
              </Route>

              {/* Customer info pages */}
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />

              {/* Loza — Dessert Marketplace (flag-gated; off in prod by default) */}
              {LOZA_ENABLED && (
                <>
                  <Route path="/loza" element={<LozaHome />} />
                  <Route path="/loza/search" element={<LozaSearch />} />
                  <Route path="/loza/customize" element={<LozaCustomizer />} />
                  <Route path="/loza/cake/:id" element={<LozaCakeDetails />} />
                  <Route path="/loza/vendor/:id" element={<LozaVendor />} />
                  <Route path="/loza/cart" element={<LozaCart />} />
                  <Route path="/loza/checkout" element={<LozaCheckout />} />
                  <Route path="/loza/orders" element={<LozaOrders />} />
                  <Route path="/loza/orders/:id" element={<LozaOrderDetails />} />
                  <Route path="/loza/profile" element={<LozaProfile />} />
                  <Route path="/loza/wishlist" element={<LozaWishlist />} />
                </>
              )}
              
              {/* Unified Login */}
              <Route path="/login" element={<Login />} />
              
              {/* Legacy auth routes - redirect to unified login */}
              <Route path="/auth" element={<Navigate to="/login" replace />} />
              <Route path="/customer-auth" element={<Navigate to="/login" replace />} />
              
              {/* Password Recovery */}
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Public Order Tracking */}
              <Route path="/track" element={<TrackOrder />} />
              
              {/* Customer Pages (require login) */}
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/my-orders/:id" element={<MyOrderDetails />} />
              <Route path="/my-profile" element={<CustomerProfile />} />
              
              {/* Staff Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRoles={['admin', 'call_center']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute requiredRoles={['admin', 'call_center']}>
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/new"
                element={
                  <ProtectedRoute requiredRoles={['admin', 'call_center']}>
                    <NewOrder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute>
                    <OrderDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/kitchen"
                element={
                  <ProtectedRoute requiredRoles={['admin', 'kitchen']}>
                    <Kitchen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/branch-orders"
                element={
                  <ProtectedRoute requiredRoles={['admin', 'branch']}>
                    <BranchOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/branch-pickup"
                element={
                  <ProtectedRoute requiredRoles={['branch']}>
                    <BranchPickupScanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/branch-live"
                element={
                  <ProtectedRoute requiredRoles={['admin', 'branch']}>
                    <BranchLive />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/driver"
                element={
                  <ProtectedRoute requiredRoles={['admin', 'driver']}>
                    <Driver />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/live"
                element={
                  <ProtectedRoute requiredRoles={['admin', 'call_center', 'kitchen']}>
                    <LiveDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <Products />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/branches"
                element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <Branches />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/submissions"
                element={
                  <ProtectedRoute requiredRoles={['admin', 'customer_support', 'call_center']}>
                    <ContactSubmissions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/custom-orders"
                element={
                  <ProtectedRoute requiredRoles={['admin', 'customer_support']}>
                    <CustomOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/design-system"
                element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <DesignSystem />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ImpersonationProvider>
    </AuthProvider>
  </SettingsProvider>
</QueryClientProvider>
);

export default App;
