import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SettingsProvider } from "./contexts/SettingsContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ImpersonationProvider } from "./contexts/ImpersonationContext";
import { ImpersonationBanner } from "./components/admin/ImpersonationBanner";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { LOZA_ENABLED } from "./lib/featureFlags";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import NewOrder from "./pages/NewOrder";
import OrderDetails from "./pages/OrderDetails";
import TrackOrder from "./pages/TrackOrder";
import Kitchen from "./pages/Kitchen";
import BranchOrders from "./pages/BranchOrders";
import Reports from "./pages/Reports";
import LiveDashboard from "./pages/LiveDashboard";
import Settings from "./pages/Settings";
import Products from "./pages/Products";
import Branches from "./pages/Branches";
import Users from "./pages/Users";
import Login from "./pages/Login";
import Store from "./pages/Store";
import MyOrders from "./pages/MyOrders";
import MyOrderDetails from "./pages/MyOrderDetails";
import CustomerProfile from "./pages/CustomerProfile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ContactSubmissions from "./pages/ContactSubmissions";
import BranchPickupScanner from "./pages/BranchPickupScanner";
import BranchLive from "./pages/BranchLive";
import Driver from "./pages/Driver";
import CustomOrders from "./pages/CustomOrders";
import CakeCustomizer from "./pages/CakeCustomizer";
import DesignSystem from "./pages/DesignSystem";
import LozaHome from "./pages/loza/LozaHome";
import LozaCustomizer from "./pages/loza/LozaCustomizer";
import LozaCakeDetails from "./pages/loza/LozaCakeDetails";
import LozaCart from "./pages/loza/LozaCart";
import LozaCheckout from "./pages/loza/LozaCheckout";
import LozaOrders from "./pages/loza/LozaOrders";
import LozaOrderDetails from "./pages/loza/LozaOrderDetails";
import LozaProfile from "./pages/loza/LozaProfile";
import LozaSearch from "./pages/loza/LozaSearch";
import LozaVendor from "./pages/loza/LozaVendor";
import LozaWishlist from "./pages/loza/LozaWishlist";
import LozaPlaceholder from "./pages/loza/LozaPlaceholder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
      <AuthProvider>
        <ImpersonationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <ImpersonationBanner />
            <BrowserRouter>
            <Routes>
              {/* Public Store - Landing Page */}
              <Route path="/" element={<Store />} />
              <Route path="/store" element={<Store />} />
              <Route path="/customize" element={<CakeCustomizer />} />

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
          </BrowserRouter>
        </TooltipProvider>
      </ImpersonationProvider>
    </AuthProvider>
  </SettingsProvider>
</QueryClientProvider>
);

export default App;
