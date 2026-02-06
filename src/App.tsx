import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Home } from "./pages/Home";
import { Cart } from "./pages/Cart";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ProductDetail } from "./pages/ProductDetail";
import { Contact } from "./pages/Contact";
import { FAQ } from "./pages/FAQ";
import { VendorRegister } from "./pages/vendor/VendorRegister";
import { VendorLogin } from "./pages/vendor/VendorLogin";
import { VendorDashboard } from "./pages/vendor/VendorDashboard";
import { VendorStore } from "./pages/vendor/VendorStore";
import { VerifyEmail } from "./pages/vendor/VerifyEmail";
import { authStateListener, isAdmin } from "./services/auth";
import { vendorAuthStateListener } from "./services/vendorAuth";
import { trackVisit } from "./services/analytics";
import { ChatbotButton } from "./components/ChatbotButton";
import ScrollToTop from "./components/ScrollToTop";
import { auth } from "./firebase";
import { FeedbackPrompter } from "./components/FeedbackPrompter";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastContainer } from "./components/ToastContainer";



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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
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
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/category/:category" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/product/:id" element={<ProductDetail />} />

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
      </ErrorBoundary>
      <ChatbotButton />
      <FeedbackPrompter />
      <ToastContainer />
    </BrowserRouter>
  );
}

