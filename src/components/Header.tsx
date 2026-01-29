import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Menu, X, ChevronDown } from "lucide-react";
import { getCart } from "../utils/cart";
import { vendorAuthStateListener, logoutVendor } from "../services/vendorAuth";
import { Vendor } from "../types";
import { logSearch } from "../services/analytics";

interface HeaderProps {
  onSearch?: (query: string) => void;
  categories?: string[];
}

/**
 * Header Component
 * 
 * Main navigation header with search, categories, and cart.
 * Shows different navigation based on vendor login state.
 */
export function Header({ onSearch, categories = [] }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const isOnDashboard = location.pathname === "/vendor/dashboard";

  // Handle vendor logout
  const handleLogout = async () => {
    try {
      await logoutVendor();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Listen for vendor auth state changes
  useEffect(() => {
    const unsubscribe = vendorAuthStateListener((vendor) => {
      setCurrentVendor(vendor);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const updateCartCount = () => {
      const cart = getCart();
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    };
    updateCartCount();
    window.addEventListener("cartUpdated", updateCartCount);
    return () => window.removeEventListener("cartUpdated", updateCartCount);
  }, []);

  // Debounced search logging
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        logSearch(searchQuery);
      }
    }, 1500); // Wait 1.5 seconds after typing stops

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/both.svg" alt="LAUTECH Market" className="w-40" />
          </Link>

          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products and vendors..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <div className="relative">
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="flex items-center space-x-1 text-gray-700 hover:text-emerald-600 transition-colors"
              >
                <span>Categories</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {categoriesOpen && (
                <div className="absolute top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  {categories.map((category) => (
                    <Link
                      key={category}
                      to={`/category/${category.toLowerCase()}`}
                      className="block px-4 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      onClick={() => setCategoriesOpen(false)}
                    >
                      {category}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/contact" className="text-gray-700 hover:text-emerald-600 transition-colors">
              Contact Support
            </Link>

            {/* Dynamic Vendor Links */}
            {currentVendor ? (
              // Logged in as vendor
              isOnDashboard ? (
                // On dashboard - show Logout
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-emerald-600 transition-colors"
                >
                  Logout
                </button>
              ) : (
                // On other pages - show My Store
                <Link
                  to="/vendor/dashboard"
                  className="text-gray-700 hover:text-emerald-600 transition-colors"
                >
                  My Store
                </Link>
              )
            ) : (
              // Not logged in - show Sell Now and Vendor Login
              <>
                <Link
                  to="/vendor/register"
                  className="text-gray-700 hover:text-emerald-600 transition-colors"
                >
                  Sell Now
                </Link>
                <Link
                  to="/vendor/login"
                  className="text-gray-700 hover:text-emerald-600 transition-colors"
                >
                  Vendor Login
                </Link>
              </>
            )}

            <Link to="/cart" className="relative">
              <ShoppingCart className="w-6 h-6 text-gray-700 hover:text-emerald-600 transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </nav>

          <div className="flex md:hidden items-center space-x-2">
            <Link to="/cart" className="relative p-2">
              <ShoppingCart className="w-6 h-6 text-gray-700 hover:text-emerald-600 transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        <div className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 py-2 space-y-4">
            <Link to="/contact"
              className="block py-2 text-gray-700 hover:text-emerald-600">
              Contact Support
            </Link>

            {/* Dynamic Vendor Links for Mobile */}
            {currentVendor ? (
              isOnDashboard ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block py-2 text-gray-700 hover:text-emerald-600 transition-colors w-full text-left"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/vendor/dashboard"
                  className="block py-2 text-gray-700 hover:text-emerald-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Store
                </Link>
              )
            ) : (
              <>
                <Link
                  to="/vendor/register"
                  className="block py-2 text-gray-700 hover:text-emerald-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sell Now
                </Link>
                <Link
                  to="/vendor/login"
                  className="block py-2 text-gray-700 hover:text-emerald-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Vendor Login
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
