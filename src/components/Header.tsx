import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Menu, X, Mic } from "lucide-react";
import { getCart } from "../utils/cart";
import { vendorAuthStateListener, logoutVendor, getAllVendors } from "../services/vendorAuth";
import { getAllProducts } from "../services/products";
import { getSearchSuggestions } from "../services/ranking";
import { Vendor, Product } from "../types";
import { SearchSuggestions } from "./SearchSuggestions";


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
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState({ products: [], vendors: [], categories: [] });
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

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

  // Fetch data for suggestions
  useEffect(() => {
    const fetchData = async () => {
      const [p, v] = await Promise.all([getAllProducts(), getAllVendors()]);
      setAllProducts(p);
      setAllVendors(v);
    };
    fetchData();
  }, []);

  // Keyboard Shortcuts (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('header-search')?.focus();
      }

      if (isSearchFocused) {
        if (e.key === 'ArrowDown') {
          setSelectedIndex(prev => Math.min(prev + 1, suggestions.products.length + suggestions.vendors.length + suggestions.categories.length - 1));
        } else if (e.key === 'ArrowUp') {
          setSelectedIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Escape') {
          setIsSearchFocused(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchFocused, suggestions]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);

    if (query.length > 0) {
      const results = getSearchSuggestions(query, allProducts, allVendors, categories);
      setSuggestions(results as any);
      setIsSearchFocused(true);
    } else {
      setSuggestions({ products: [], vendors: [], categories: [] });
    }
  };

  return (
    <header className="glass-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo_icon.png" alt="LAUTECH Market Icon" className="w-8 h-8 object-contain transition-transform group-hover:scale-110" />
            <img src="/logo_text.png" alt="LAUTECH Market" className="h-6 object-contain dark:invert transition-opacity group-hover:opacity-80" />
          </Link>

          <div className="hidden md:flex flex-1 max-w-2xl mx-8 relative">
            <div className={`relative w-full group transition-all duration-300 ${isSearchFocused ? 'scale-[1.02] z-[101]' : ''}`}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-600 transition-colors group-focus-within:text-emerald-500" />
              <input
                id="header-search"
                type="text"
                placeholder="Search products and vendors... (Ctrl+K)"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-10 pr-12 py-2.5 border-2 border-emerald-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-100/50 dark:focus:ring-emerald-900/30 focus:border-emerald-600 transition-all shadow-sm placeholder:text-gray-400 bg-white dark:bg-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  const recognition = new (window as any).webkitSpeechRecognition();
                  recognition.onresult = (event: any) => {
                    const speechToText = event.results[0][0].transcript;
                    setSearchQuery(speechToText);
                    onSearch?.(speechToText);
                  };
                  recognition.start();
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-full text-emerald-600 transition-colors"
                title="Voice Search"
              >
                <Mic className="w-5 h-5" />
              </button>
              <SearchSuggestions
                suggestions={suggestions}
                onSearch={(q) => { setSearchQuery(q); onSearch?.(q); }}
                onClose={() => setIsSearchFocused(false)}
                isVisible={isSearchFocused}
                selectedIndex={selectedIndex}
              />
            </div>

            {/* Spotlight Overlay */}
            {isSearchFocused && (
              <div
                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[100] transition-all duration-300"
                onClick={() => setIsSearchFocused(false)}
              />
            )}
          </div>

          <nav className="hidden md:flex items-center space-x-6">

            <Link to="/contact" className="text-gray-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Contact Support
            </Link>

            <Link to="/faq" className="text-gray-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              FAQ
            </Link>

            {/* Dynamic Vendor Links */}
            {currentVendor ? (
              // Logged in as vendor
              isOnDashboard ? (
                // On dashboard - show Logout
                <button
                  onClick={handleLogout}
                  className="text-gray-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  Logout
                </button>
              ) : (
                // On other pages - show My Store
                <Link
                  to="/vendor/dashboard"
                  className="text-gray-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  My Store
                </Link>
              )
            ) : (
              // Not logged in - show Sell Now and Vendor Login
              <>
                <Link
                  to="/vendor/register"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md"
                >
                  Sell Now
                </Link>
                <Link
                  to="/vendor/login"
                  className="text-gray-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  Vendor Login
                </Link>
              </>
            )}


            <Link to="/cart" className="relative">
              <ShoppingCart className="w-6 h-6 text-gray-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" />
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

        <div className="md:hidden pb-4 relative z-[101]">
          <div className={`relative w-full group transition-all duration-300 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-600 transition-colors group-focus-within:text-emerald-500" />
            <input
              id="mobile-header-search"
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full pl-10 pr-12 py-2.5 border-2 border-emerald-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-100/50 dark:focus:ring-emerald-900/30 focus:border-emerald-600 transition-all shadow-sm placeholder:text-gray-400 bg-white dark:bg-slate-800 dark:text-white"
            />
            <button
              type="button"
              onClick={() => {
                const recognition = new (window as any).webkitSpeechRecognition();
                recognition.onresult = (event: any) => {
                  const speechToText = event.results[0][0].transcript;
                  setSearchQuery(speechToText);
                  onSearch?.(speechToText);
                };
                recognition.start();
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-full text-emerald-600 transition-colors"
              title="Voice Search"
            >
              <Mic className="w-5 h-5" />
            </button>
            <SearchSuggestions
              suggestions={suggestions}
              onSearch={(q) => { setSearchQuery(q); onSearch?.(q); }}
              onClose={() => setIsSearchFocused(false)}
              isVisible={isSearchFocused}
              selectedIndex={selectedIndex}
            />
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 py-2 space-y-4">
            <Link to="/contact"
              className="block py-2 text-gray-700 hover:text-emerald-600"
              onClick={() => setMobileMenuOpen(false)}>
              Contact Support
            </Link>

            <Link to="/faq"
              className="block py-2 text-gray-700 hover:text-emerald-600"
              onClick={() => setMobileMenuOpen(false)}>
              FAQ
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
