import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Lazy Load Pages
const Home = lazy(() => import("./pages/Home").then(module => ({ default: module.Home })));
const Cart = lazy(() => import("./pages/Cart").then(module => ({ default: module.Cart })));
const AdminLogin = lazy(() => import("./pages/AdminLogin").then(module => ({ default: module.AdminLogin })));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard").then(module => ({ default: module.AdminDashboard })));
const ProductDetail = lazy(() => import("./pages/ProductDetail").then(module => ({ default: module.ProductDetail })));
const Contact = lazy(() => import("./pages/Contact").then(module => ({ default: module.Contact })));
const FAQ = lazy(() => import("./pages/FAQ").then(module => ({ default: module.FAQ })));
const VendorRegister = lazy(() => import("./pages/vendor/VendorRegister").then(module => ({ default: module.VendorRegister })));
const VendorLogin = lazy(() => import("./pages/vendor/VendorLogin").then(module => ({ default: module.VendorLogin })));
const VendorDashboard = lazy(() => import("./pages/vendor/VendorDashboard").then(module => ({ default: module.VendorDashboard })));
const VendorStore = lazy(() => import("./pages/vendor/VendorStore").then(module => ({ default: module.VendorStore })));
const VerifyEmail = lazy(() => import("./pages/vendor/VerifyEmail").then(module => ({ default: module.VerifyEmail })));
const OjaLanding = lazy(() => import("./pages/OjaLanding").then(module => ({ default: module.OjaLanding })));
import { authStateListener, isAdmin } from "./services/auth";
import { vendorAuthStateListener } from "./services/vendorAuth";
import { trackVisit } from "./services/analytics";
import { ChatbotButton } from "./components/ChatbotButton";
import ScrollToTop from "./components/ScrollToTop";
import { auth } from "./firebase";
import { FeedbackPrompter } from "./components/FeedbackPrompter";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastContainer } from "./components/ToastContainer";
import { InstallPrompt } from "./components/InstallPrompt";
import { LoadingScreen } from "./components/LoadingScreen";



/**
 * AdminProtectedRoute Component
 * 
 * Protects admin routes by checking authentication state.
 * Redirects to login if not authenticated.
 */
function AdminProtectedRoute({ children }: { children: JSX.Element }) {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = authStateListener((user) => {
      setIsAuthorized(isAdmin(user?.email));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthorized) {
    return <Navigate to="/admin/login" />;
  }

  return children;
}

/**
 * VendorProtectedRoute Component
 * 
 * Protects vendor routes by checking authentication state and email verification.
 * Redirects to vendor login if not authenticated.
 * Redirects to verify-email if email is not verified.
 */
function VendorProtectedRoute({ children }: { children: JSX.Element }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = vendorAuthStateListener((vendor) => {
      if (vendor) {
        setIsAuthenticated(true);
        // Check Firebase auth for email verification status
        setEmailVerified(auth.currentUser?.emailVerified || false);
      } else {
        setIsAuthenticated(false);
        setEmailVerified(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/vendor/login" />;
  }

  if (!emailVerified) {
    return <Navigate to="/vendor/verify-email" />;
  }

  return children;
}

/**
 * App Component
 * 
 * Main application component with routing configuration.
 */
export default function App() {
  useEffect(() => {
    trackVisit();
  }, []);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/category/:category" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/oja" element={<OjaLanding />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              }
            />

            {/* Vendor Routes */}
            <Route path="/vendor/register" element={<VendorRegister />} />
            <Route path="/vendor/login" element={<VendorLogin />} />
            <Route path="/vendor/verify-email" element={<VerifyEmail />} />
            <Route
              path="/vendor/dashboard"
              element={
                <VendorProtectedRoute>
                  <VendorDashboard />
                </VendorProtectedRoute>
              }
            />

            {/* Public Vendor Store */}
            <Route path="/store/:vendorId" element={<VendorStore />} />

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      {/* <ChatbotButton /> */}
      <FeedbackPrompter />
      <ToastContainer />
      <InstallPrompt />
    </BrowserRouter>
  );
}

