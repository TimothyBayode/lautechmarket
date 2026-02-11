import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  Store,
  ArrowLeft,
  ShieldCheck,
  ShieldX,
  Menu,
  Search,
  Tag,
  Flame,
  Eye,
  ShoppingCart,
  RefreshCw,
  PieChart,
  MoveDown,
  AlertCircle,
  Trophy,
  Activity,
  TrendingUp,
  Clock
} from "lucide-react";
import {
  getDocs,
  query,
  collection,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { Product, Vendor, ExpansionResponse } from "../types";
import {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getVendorProducts,
} from "../services/products";
import { ProductForm } from "../components/ProductForm";
import { authStateListener, logoutUser, isAdmin } from "../services/auth";
import { getAllVendors, deleteVendor, updateVendorProfile } from "../services/vendorAuth";
import { AdminAnnouncements } from "../components/AdminAnnouncements";
import { AdminCategories } from "../components/AdminCategories";
import { AdminVerificationRequests } from "../components/AdminVerificationRequests";
import { db } from "../firebase";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { getAnalytics } from "../services/analytics";
import { getVisitsLeaderboard, VendorVisitData } from "../services/vendorVisits";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminCuration } from "../components/AdminCuration";
import { AdminStats } from "../components/AdminStats";
import { AdminLeaderboard } from "../components/AdminLeaderboard";
import { getProxiedImageUrl } from "../utils/imageUrl";
import { getExpansionResponses, deleteExpansionResponse } from "../services/expansion";

export function AdminDashboard() {
  const navigate = useNavigate();

  // Vendor state
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // Products state (for selected vendor)
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [authChecked, setAuthChecked] = useState(false);

  const [analytics, setAnalytics] = useState<any>(null);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<VendorVisitData[]>([]);
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");
  const [topSearches, setTopSearches] = useState<{ query: string; count: number }[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalProductViews, setTotalProductViews] = useState(0);
  const [totalCartAdditions, setTotalCartAdditions] = useState(0);

  const [demandGaps, setDemandGaps] = useState<{ query: string; count: number }[]>([]);
  const [peakTraffic, setPeakTraffic] = useState<{ hour: number; count: number }[]>([]);
  const [keywordPriceIndex, setKeywordPriceIndex] = useState<{ query: string; avgPrice: number; productCount: number }[]>([]);
  const [reliabilityRanking, setReliabilityRanking] = useState<{ vendorName: string; businessName: string; responseTime: number; trustScore: number }[]>([]);
  const [comparisonLeaderboard, setComparisonLeaderboard] = useState<{ productId: string; name: string; vendorName: string; compareCount: number; image?: string }[]>([]);
  const [categoryConversion, setCategoryConversion] = useState<{ category: string; rate: number; orders: number; views: number }[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  // Dashboard data loading - initial load
  useEffect(() => {
    const unsubscribe = authStateListener((user) => {
      if (!user) {
        navigate("/admin/login");
        return;
      }

      // Security: verify user is an authorized admin
      if (!isAdmin(user.email)) {
        console.error("[AdminDashboard] Unauthorized access attempt:", user.email);
        alert("Unauthorized: This account does not have admin privileges.");
        logoutUser();
        navigate("/admin/login");
        return;
      }

      setAuthChecked(true);
      loadDashboardData();
    });

    return () => unsubscribe();
  }, [navigate]);

  // Load vendors and all products for stats
  const loadDashboardData = async () => {
    setLoading(true);
    console.log("[AdminDashboard] Loading data...");

    // Each block is wrapped in its own try-catch or handled independently 
    // to prevent one failure from zeroing out the entire dashboard

    let vendorsData: Vendor[] = [];
    let allVendorProducts: Product[] = [];

    try {
      vendorsData = await getAllVendors();
      setVendors(vendorsData);
    } catch (err) {
      console.error("[AdminDashboard] Error loading vendors:", err);
    }

    try {
      allVendorProducts = await fetchProducts();
      setAllProducts(allVendorProducts);

      // Calculate total interaction metrics from products
      const orders = allVendorProducts.reduce((sum, p) => sum + (p.orderCount || 0), 0);
      const views = allVendorProducts.reduce((sum, p) => sum + (p.viewCount || 0), 0);
      const cart = allVendorProducts.reduce((sum, p) => sum + (p.cartCount || 0), 0);
      setTotalOrders(orders);
      setTotalProductViews(views);
      setTotalCartAdditions(cart);
    } catch (err) {
      console.error("[AdminDashboard] Error loading products:", err);
    }

    try {
      const leaderboardData = await getVisitsLeaderboard();
      setLeaderboard(leaderboardData);
    } catch (err) {
      console.error("[AdminDashboard] Error loading leaderboard:", err);
    }

    try {
      const siteAnalytics = await getAnalytics();
      if (siteAnalytics) {
        setAnalytics(siteAnalytics);
      }
    } catch (err) {
      console.error("[AdminDashboard] Error loading site analytics:", err);
    }

    try {
      // Enhanced logging
      console.log("[AdminDashboard] Fetching searches initially...");
      let searchesQuery = query(collection(db, "searches"), orderBy("timestamp", "desc"), limit(200));
      let searchesSnap;

      try {
        searchesSnap = await getDocs(searchesQuery);
      } catch (indexErr) {
        console.warn("[AdminDashboard] Initial search query failed with ordering (index missing). Falling back to unordered.");
        searchesQuery = query(collection(db, "searches"), limit(200));
        searchesSnap = await getDocs(searchesQuery);
      }

      console.log(`[AdminDashboard] Found ${searchesSnap.size} search records.`);

      const searchCounts: { [key: string]: number } = {};
      const gapCounts: { [key: string]: number } = {};
      const hourCounts: { [key: number]: number } = Array(24).fill(0).reduce((acc, _, i) => ({ ...acc, [i]: 0 }), {});

      searchesSnap.docs.forEach(doc => {
        const data = doc.data();
        const q = data.query;
        const count = data.resultsCount || 0;
        const ts = data.timestamp?.toDate ? data.timestamp.toDate() : null;

        if (q) {
          searchCounts[q] = (searchCounts[q] || 0) + 1;
          if (count === 0) {
            gapCounts[q] = (gapCounts[q] || 0) + 1;
          }
        }

        if (ts) {
          const hour = ts.getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      });

      const topSearchesData = Object.entries(searchCounts)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
      setTopSearches(topSearchesData);

      const demandGapsData = Object.entries(gapCounts)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
      setDemandGaps(demandGapsData);

      const peakTrafficData = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => a.hour - b.hour);
      setPeakTraffic(peakTrafficData);

      // --- Market Intelligence logic ---
      const intelPriceIndex = topSearchesData.map(ts => {
        const matchingProducts = allVendorProducts.filter(p =>
          p.name.toLowerCase().includes(ts.query.toLowerCase()) ||
          p.category.toLowerCase().includes(ts.query.toLowerCase())
        );
        const avg = matchingProducts.length > 0
          ? matchingProducts.reduce((sum, p) => sum + p.price, 0) / matchingProducts.length
          : 0;
        return { query: ts.query, avgPrice: avg, productCount: matchingProducts.length };
      }).filter(item => item.productCount > 0);
      setKeywordPriceIndex(intelPriceIndex);

      const intelReliability = vendorsData
        .filter(v => v.metrics)
        .map(v => ({
          vendorName: v.name,
          businessName: v.businessName,
          responseTime: v.metrics?.averageResponseMinutes || 999,
          trustScore: v.metrics?.trustScore || 0
        }))
        .sort((a, b) => {
          if (a.responseTime !== b.responseTime) return a.responseTime - b.responseTime;
          return b.trustScore - a.trustScore;
        })
        .slice(0, 10);
      setReliabilityRanking(intelReliability);

      const intelComparison = allVendorProducts
        .filter(p => (p.compareCount || 0) > 0)
        .map(p => ({
          productId: p.id,
          name: p.name,
          vendorName: p.vendorName,
          compareCount: p.compareCount || 0,
          image: p.image
        }))
        .sort((a, b) => b.compareCount - a.compareCount)
        .slice(0, 5);
      setComparisonLeaderboard(intelComparison);

      const categories = [...new Set(allVendorProducts.map(p => p.category || "Uncategorized"))];
      const intelConversion = categories.map(cat => {
        const catProds = allVendorProducts.filter(p => (p.category || "Uncategorized") === cat);
        const orders = catProds.reduce((sum, p) => sum + (p.orderCount || 0), 0);
        const views = catProds.reduce((sum, p) => sum + (p.viewCount || 0), 0);
        const rate = views > 0 ? (orders / views) * 100 : 0;
        return { category: cat, rate, orders, views };
      }).sort((a, b) => b.rate - a.rate);
      setCategoryConversion(intelConversion);


    } catch (err) {
      console.error("[AdminDashboard] Error loading searches or intelligence:", err);
    }

    setLoading(false);
  };

  // Real-time search listener
  useEffect(() => {
    if (!authChecked) return;

    console.log("[AdminDashboard] Setting up real-time search listener...");
    const searchesColl = collection(db, "searches");
    const orderedQuery = query(searchesColl, orderBy("timestamp", "desc"), limit(100));

    const processSnapshot = (snapshot: any, label: string) => {
      console.log(`[AdminDashboard] ${label} update: Processing ${snapshot.size} records...`);
      setSearchError(null);
      const searchCounts: { [key: string]: number } = {};
      const gapCounts: { [key: string]: number } = {};
      const hourCounts: { [key: number]: number } = Array(24).fill(0).reduce((acc, _, i) => ({ ...acc, [i]: 0 }), {});

      snapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        const qText = data.query;
        const count = data.resultsCount || 0;
        const ts = data.timestamp?.toDate ? data.timestamp.toDate() : null;

        if (qText) {
          searchCounts[qText] = (searchCounts[qText] || 0) + 1;
          if (count === 0) {
            gapCounts[qText] = (gapCounts[qText] || 0) + 1;
          }
        }

        if (ts) {
          const hour = ts.getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      });

      const topSearchesData = Object.entries(searchCounts)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
      setTopSearches(topSearchesData);

      const demandGapsData = Object.entries(gapCounts)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
      setDemandGaps(demandGapsData);

      const peakTrafficData = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => a.hour - b.hour);
      setPeakTraffic(peakTrafficData);
    };

    let unsubscribe: () => void;

    const startListener = () => {
      return onSnapshot(orderedQuery, (snap) => processSnapshot(snap, "Ordered Search"), (err) => {
        if (err.message?.includes("permission-denied")) {
          setSearchError("Permission Denied: Please ensure Firestore rules are deployed.");
        }

        if (err.message?.includes("index")) {
          console.warn("[AdminDashboard] Missing search index. Falling back to unordered listener.");
          const unorderedQuery = query(searchesColl, limit(100));
          unsubscribe = onSnapshot(unorderedQuery, (snap) => processSnapshot(snap, "Unordered Search"), (err2) => {
            console.error("[AdminDashboard] Fallback search listener failed:", err2);
            if (err2.message?.includes("permission-denied")) {
              setSearchError("Permission Denied: Access to 'searches' collection is blocked.");
            }
          });
        } else {
          console.error("[AdminDashboard] Search listener error:", err);
        }
      });
    };

    unsubscribe = startListener();
    return () => unsubscribe();
  }, [authChecked]);

  // Load products for selected vendor
  const loadVendorProducts = async (vendorId: string) => {
    setLoading(true);
    try {
      const vendorProducts = await getVendorProducts(vendorId);
      setProducts(vendorProducts);
    } catch (err) {
      console.error("Failed to load vendor products:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle vendor click
  const handleVendorClick = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    loadVendorProducts(vendor.id);
    setSelectedProducts(new Set());
  };

  // Go back to vendor list
  const handleBackToVendors = () => {
    setSelectedVendor(null);
    setProducts([]);
    setSelectedProducts(new Set());
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSave = async (product: Product) => {
    if (!selectedVendor) return;

    try {
      const productWithVendor = {
        ...product,
        vendorId: selectedVendor.id,
        vendorName: selectedVendor.businessName,
        whatsappNumber: selectedVendor.whatsappNumber,
      };

      if (editingProduct) {
        await updateProduct(product.id, productWithVendor);
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? productWithVendor : p))
        );
      } else {
        const newProduct = await addProduct(productWithVendor);
        setProducts((prev) => [...prev, newProduct]);
      }

      // Refresh all products for stats
      const allProds = await fetchProducts();
      setAllProducts(allProds);
    } catch (err) {
      console.error("Error saving product:", err);
      alert("Error saving product: " + (err as Error).message);
    } finally {
      setShowForm(false);
      setEditingProduct(null);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setAllProducts((prev) => prev.filter((p) => p.id !== id));
      setSelectedProducts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Error deleting product: " + (err as Error).message);
    }
  };

  const handleSelectProduct = (id: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    if (!window.confirm(`Delete ${selectedProducts.size} selected products ? `)) return;

    try {
      for (const id of selectedProducts) {
        await deleteProduct(id);
      }
      setProducts((prev) => prev.filter((p) => !selectedProducts.has(p.id)));
      setAllProducts((prev) => prev.filter((p) => !selectedProducts.has(p.id)));
      setSelectedProducts(new Set());
    } catch (err) {
      console.error("Error in bulk delete:", err);
      alert("Error in bulk delete: " + (err as Error).message);
    }
  };

  // Handle delete vendor (admin only)
  const handleDeleteVendor = async (vendor: Vendor, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    const productCount = getVendorProductCount(vendor.id);
    const confirmMessage = productCount > 0
      ? `Are you sure you want to delete "${vendor.businessName}" and their ${productCount} products ? This action cannot be undone.`
      : `Are you sure you want to delete "${vendor.businessName}" ? This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await deleteVendor(vendor.id);
      setVendors((prev) => prev.filter((v) => v.id !== vendor.id));
      setAllProducts((prev) => prev.filter((p) => p.vendorId !== vendor.id));
      alert(`Vendor "${vendor.businessName}" has been deleted.`);
    } catch (err) {
      console.error("Error deleting vendor:", err);
      alert("Error deleting vendor: " + (err as Error).message);
    }
  };

  // Get product count for a vendor
  const getVendorProductCount = (vendorId: string) => {
    return allProducts.filter((p) => p.vendorId === vendorId).length;
  };

  // Handle verify/unverify vendor
  const handleVerifyVendor = async (vendor: Vendor, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent vendor card click
    const newStatus = !vendor.isVerified;
    const action = newStatus ? "verify" : "unverify";

    if (!window.confirm(`Are you sure you want to ${action} "${vendor.businessName}" ? `)) {
      return;
    }

    try {
      const verifiedAt = newStatus ? new Date() : null;
      await updateVendorProfile(vendor.id, {
        isVerified: newStatus,
        verifiedAt: verifiedAt,
      });
      setVendors((prev) =>
        prev.map((v) => (v.id === vendor.id ? { ...v, isVerified: newStatus, verifiedAt: verifiedAt } : v))
      );
    } catch (err) {
      console.error("Error updating vendor verification:", err);
      alert("Error updating vendor: " + (err as Error).message);
    }
  };

  // Active tab state
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const ExpansionCircleView = () => {
    const [responses, setResponses] = useState<ExpansionResponse[]>([]);
    const [viewLoading, setViewLoading] = useState(true);

    useEffect(() => {
      const loadResponses = async () => {
        try {
          const data = await getExpansionResponses();
          setResponses(data);
        } catch (err) {
          console.error("Error loading expansion responses:", err);
        } finally {
          setViewLoading(false);
        }
      };
      loadResponses();
    }, []);

    if (viewLoading) {
      return (
        <div className="flex items-center justify-center p-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      );
    }

    const stats = {
      total: responses.length,
      buyers: responses.filter(r => r.usagePlan.includes('buy')).length,
      sellers: responses.filter(r => r.usagePlan.includes('sell')).length,
      highIntent: responses.filter(r => ['definitely', 'very_likely'].includes(r.intentStrength)).length,
    };

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Interests</p>
            <p className="text-3xl font-black text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Potential Buyers</p>
            <p className="text-3xl font-black text-emerald-600">{stats.buyers}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Potential Sellers</p>
            <p className="text-3xl font-black text-blue-600">{stats.sellers}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-1">High Intent</p>
            <p className="text-3xl font-black text-purple-600">{stats.highIntent}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-bold text-gray-900">Waitlist Data</h3>
            <span className="text-xs text-gray-400 font-medium">{responses.length} responses collected</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                  <th className="px-6 py-4">Name & Contact</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Intent</th>
                  <th className="px-6 py-4">Audience</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {responses.map((resp) => (
                  <tr key={resp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{resp.fullName}</p>
                      <p className="text-xs text-emerald-600 font-mono">{resp.whatsappNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{resp.city}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{resp.state}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 mb-1">
                        {resp.usagePlan.map((u: string) => (
                          <span key={u} className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-black uppercase">{u}</span>
                        ))}
                      </div>
                      <span className={`text-[10px] font-bold ${resp.intentStrength === 'definitely' ? 'text-purple-600' : 'text-gray-400'
                        }`}>
                        {resp.intentStrength.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {resp.hasAudience ? (
                        <div>
                          <p className="text-xs font-bold text-orange-600">{resp.audiencePlatform}</p>
                          <p className="text-[10px] text-gray-400 uppercase">{resp.audienceSize}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {resp.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={async () => {
                          if (window.confirm("Are you sure you want to delete this response?")) {
                            try {
                              await deleteExpansionResponse(resp.id);
                              setResponses(prev => prev.filter(r => r.id !== resp.id));
                            } catch (error) {
                              console.error("Delete failed:", error);
                            }
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Response"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {responses.length === 0 && (
              <div className="p-20 text-center text-gray-400 italic">
                No expansion data collected yet.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "expansion-circle":
        return <ExpansionCircleView />;
      case "overview":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Dashboard Headers and Refresh */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Platform Overview</h2>
                <p className="text-sm text-gray-500">Real-time performance metrics and buyer intent</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={loadDashboardData}
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  <RefreshCw className={`w - 4 h - 4 ${loading ? 'animate-spin' : ''} `} />
                  <span>{loading ? "Refreshing..." : "Refresh Metrics"}</span>
                </button>
              </div>
            </div>

            <AdminStats
              vendorsCount={vendors.length}
              productsCount={allProducts.length}
              inStockCount={allProducts.filter((p) => p.inStock).length}
              outOfStockCount={allProducts.filter((p) => !p.inStock).length}
              analytics={analytics}
            />

            {/* Interaction Analytics */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 font-display">Engagement Overview</h3>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest border border-gray-100 px-2 py-1 rounded bg-gray-50">Click to view full list</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div
                  onClick={() => setActiveTab('product-interactions')}
                  className="p-4 bg-orange-50 rounded-2xl border border-orange-100 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-orange-600 text-[10px] font-black uppercase tracking-wider">Total Clicks to Order</p>
                    <Flame className="w-4 h-4 text-orange-400 group-hover:animate-bounce" />
                  </div>
                  <p className="text-3xl font-black text-orange-900">{totalOrders.toLocaleString()}</p>
                </div>

                <div
                  onClick={() => setActiveTab('product-interactions')}
                  className="p-4 bg-blue-50 rounded-2xl border border-blue-100 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-blue-600 text-[10px] font-black uppercase tracking-wider">Total Product Views</p>
                    <Eye className="w-4 h-4 text-blue-400 group-hover:animate-bounce" />
                  </div>
                  <p className="text-3xl font-black text-blue-900">{totalProductViews.toLocaleString()}</p>
                </div>

                <div
                  onClick={() => setActiveTab('product-interactions')}
                  className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-emerald-600 text-[10px] font-black uppercase tracking-wider">Total Cart Additions</p>
                    <ShoppingCart className="w-4 h-4 text-emerald-400 group-hover:animate-bounce" />
                  </div>
                  <p className="text-3xl font-black text-emerald-900">{totalCartAdditions.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "category-stats":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-emerald-600" />
                Category Distribution
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from(new Set(allProducts.map(p => p.category)))
                  .map(category => ({
                    name: category,
                    count: allProducts.filter(p => p.category === category).length
                  }))
                  .sort((a, b) => b.count - a.count)
                  .map(({ name: category, count }) => {
                    const percentage = Math.round((count / (allProducts.length || 1)) * 100) || 0;
                    return (
                      <div key={category} className="space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="capitalize text-gray-700">{category}</span>
                          <span className="text-gray-500">{count} products ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${percentage}% ` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        );

      case "market-intelligence":
        const conversionRate = totalProductViews > 0 ? ((totalOrders / totalProductViews) * 100).toFixed(1) : "0";
        const avgPriceIndex = allProducts.length > 0
          ? allProducts.reduce((sum, p) => sum + p.price, 0) / allProducts.length
          : 0;

        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Market Intelligence Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Reliability Leaders */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center uppercase tracking-tight">
                    <Trophy className="w-4 h-4 mr-2 text-amber-500" />
                    Reliability Kings (Supply Quality)
                  </h3>
                  <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-1 rounded font-black">Top 10</span>
                </div>
                <div className="space-y-4">
                  {reliabilityRanking.map((vendor, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-xs font-bold text-amber-700">
                          #{i + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">{vendor.businessName}</p>
                          <p className="text-[10px] text-gray-400">Trust: {vendor.trustScore}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-emerald-600 italic">~{vendor.responseTime}m</p>
                        <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">Response</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparison Trends */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center uppercase tracking-tight">
                    <RefreshCw className="w-4 h-4 mr-2 text-purple-600" />
                    Comparison Leaderboard (Student Research)
                  </h3>
                  <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded font-black">Top Compared</span>
                </div>
                <div className="space-y-4">
                  {comparisonLeaderboard.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white rounded-lg overflow-hidden border border-gray-100 p-1">
                          {item.image ? (
                            <img src={getProxiedImageUrl(item.image) || undefined} className="w-full h-full object-contain" />
                          ) : (
                            <Package className="w-full h-full text-gray-200 p-1" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800 truncate max-w-[120px]">{item.name}</p>
                          <p className="text-[9px] text-gray-400">by {item.vendorName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-purple-600">{item.compareCount}</p>
                        <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">Comparisons</p>
                      </div>
                    </div>
                  ))}
                  {comparisonLeaderboard.length === 0 && (
                    <p className="text-center py-8 text-gray-400 text-sm italic">Waiting for comparison data...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Price Index Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-900 flex items-center uppercase tracking-tight">
                  <Activity className="w-4 h-4 mr-2 text-blue-600" />
                  Demand Price Index (Market Value)
                </h3>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-black">Real-time Avg</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {keywordPriceIndex.slice(0, 8).map((item, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black text-blue-600 uppercase italic">"{item.query}"</span>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-1">{item.productCount} products</p>
                    </div>
                    <p className="text-sm font-black text-gray-900 mt-2 font-mono">₦{Math.round(item.avgPrice).toLocaleString()}</p>
                  </div>
                ))}
                {keywordPriceIndex.length === 0 && (
                  <p className="text-center py-4 text-gray-400 text-xs italic">Waiting for more search data...</p>
                )}
              </div>
            </div>

            {/* Category Conversion Heatmap */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-900 flex items-center uppercase tracking-tight">
                  <TrendingUp className="w-4 h-4 mr-2 text-emerald-600" />
                  Category Conversion Heatmap (Order Intent)
                </h3>
                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-black">Sorted by Rate</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryConversion.map((item, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-black text-gray-700 capitalize">{item.category}</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${item.rate > 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                        {item.rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-400 uppercase font-bold">
                      <span>{item.orders} Orders</span>
                      <span>{item.views} Views</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, item.rate * 2)}% ` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Global Health Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Global Conv.</h3>
                </div>
                <p className="text-3xl font-black text-emerald-600">{conversionRate}%</p>
                <p className="text-[10px] text-gray-400 mt-2 font-medium">Platform-wide average</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <Tag className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Market Price</h3>
                </div>
                <p className="text-3xl font-black text-blue-600">₦{Math.round(avgPriceIndex).toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 mt-2 font-medium">Avg listing price</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Peak Activity</h3>
                </div>
                <div className="h-10 flex items-end gap-1">
                  {peakTraffic.slice(10, 22).map((pt, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-orange-100 rounded-sm hover:bg-orange-500 transition-colors cursor-help group relative"
                      style={{ height: `${Math.min(100, (pt.count / (Math.max(...peakTraffic.map(p => p.count)) || 1)) * 100)}% ` }}
                    >
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 text-white text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                        {pt.hour}:00 - {pt.count}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-2 font-medium">Daily traffic distribution</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center uppercase tracking-tight">
                  <PieChart className="w-4 h-4 mr-2 text-blue-600" />
                  Categorical Price Index
                </h3>
                <div className="space-y-4">
                  {Array.from(new Set(allProducts.map(p => p.category || "Uncategorized")))
                    .map(cat => {
                      const catProducts = allProducts.filter(p => (p.category || "Uncategorized") === cat);
                      const avg = catProducts.reduce((sum, p) => sum + p.price, 0) / (catProducts.length || 1);
                      return { name: cat, avg };
                    })
                    .sort((a, b) => b.avg - a.avg)
                    .map(item => (
                      <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-xs font-bold text-gray-700 capitalize">{item.name}</span>
                        <span className="text-xs font-black text-blue-600 font-mono">₦{Math.round(item.avg).toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center uppercase tracking-tight">
                  <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
                  Stagnant Products (L14D)
                </h3>
                <div className="space-y-4">
                  {allProducts
                    .filter(p => (p.viewCount || 0) < 5 && (p.orderCount || 0) === 0)
                    .slice(0, 5)
                    .map(product => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-red-50/30 rounded-xl border border-red-50">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            {product.image && <img src={getProxiedImageUrl(product.image) || product.image} className="w-full h-full object-cover" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-gray-900 truncate">{product.name}</p>
                            <p className="text-[9px] text-gray-400">by {product.vendorName}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[9px] font-black text-red-600 uppercase">Attention</p>
                          <p className="text-[9px] text-gray-400">{product.viewCount || 0} views</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        );


      case "demand-gap":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <MoveDown className="w-5 h-5 mr-2 text-emerald-600" />
                    Market Demand Gaps
                  </h3>
                  <p className="text-xs text-gray-500">Queries that returned 0 results</p>
                </div>
                <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  High Priority
                </div>
              </div>

              {demandGaps.length > 0 ? (
                <div className="space-y-3">
                  {demandGaps.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group">
                      <div>
                        <span className="text-sm font-semibold text-gray-700 font-display italic">"{item.query}"</span>
                        <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-wider">Unmet Student Request</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="bg-white shadow-sm border border-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-black font-mono">
                          {item.count} searches
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium font-display">No demand gaps identified yet</p>
                </div>
              )}

              <div className="mt-8 p-4 bg-emerald-600 rounded-xl text-white">
                <p className="text-xs font-bold leading-relaxed">
                  <TrendingUp className="w-4 h-4 inline-block mr-1 mb-1" />
                  Strategy: Reach out to vendors in the category of these missing products to stock up.
                </p>
              </div>
            </div>
          </div>
        );

      case "search-analytics":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <Search className="w-5 h-5 mr-2 text-emerald-600" />
                  Top Search Queries
                </h3>
                <div className={`text - [10px] font - bold uppercase tracking - widest px - 2 py - 1 rounded ${searchError ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-50 text-gray-400'} `}>
                  {searchError ? 'Access Denied' : 'Real-time Active'}
                </div>
              </div>
              {searchError ? (
                <div className="text-center py-10 bg-red-50 rounded-xl border border-red-100 px-6">
                  <ShieldX className="w-10 h-10 text-red-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-red-700">Analytics Blocked</p>
                  <p className="text-[10px] text-red-600 mt-1">{searchError}</p>
                </div>
              ) : topSearches.length > 0 ? (
                <div className="space-y-3 px-2">
                  {topSearches.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-emerald-50 hover:border-emerald-100 transition-colors">
                      <span className="text-sm font-semibold text-gray-700 font-display">"{item.query}"</span>
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-xs font-black font-mono">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium font-display">No search data yet</p>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 italic">{searchError ? 'Sync failed' : 'Syncing with Firestore...'}</span>
                <span className="text-[10px] text-gray-400 font-mono">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        );

      case "product-interactions":
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 px-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3 font-display uppercase tracking-tight">
                    <Flame className="w-8 h-8 text-orange-500" />
                    Product Hotlist (Top 20)
                  </h3>
                  <p className="text-gray-500 mt-1 text-sm font-medium">Ranked by total engagement (Orders, Views, and Cart Additions)</p>
                </div>
              </div>

              <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-emerald-600 text-white text-left">
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Product Details</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center">Score Breakdown</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {allProducts
                        .map(p => ({
                          ...p,
                          totalScore: (p.orderCount || 0) + (p.viewCount || 0) + (p.cartCount || 0)
                        }))
                        .sort((a, b) => b.totalScore - a.totalScore)
                        .slice(0, 20)
                        .map((product) => (
                          <tr key={product.id} className="hover:bg-emerald-50/30 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 rounded-2xl bg-gray-200 overflow-hidden shadow-sm border border-gray-100 flex-shrink-0">
                                  {product.image ? (
                                    <img src={getProxiedImageUrl(product.image) || product.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                  ) : (
                                    <Package className="w-full h-full p-4 text-gray-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors uppercase tracking-tight text-sm truncate">
                                    {product.name}
                                  </p>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 flex items-center">
                                    <Tag className="w-3 h-3 mr-1" />
                                    {product.category}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-8">
                                <div className="text-center">
                                  <p className="text-xs font-black text-orange-600">{(product.orderCount || 0).toLocaleString()}</p>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Orders</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs font-black text-blue-600">{(product.viewCount || 0).toLocaleString()}</p>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Views</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs font-black text-emerald-600">{(product.cartCount || 0).toLocaleString()}</p>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">In Cart</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => navigate(`/ product / ${product.id} `)}
                                className="px-4 py-2 bg-white text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95"
                              >
                                View Item
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {allProducts.length === 0 && (
                    <div className="text-center py-20 bg-white">
                      <Package className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No analytics data found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "vendors":
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {selectedVendor ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => {
                        setEditingProduct(null);
                        setShowForm(true);
                      }}
                      className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-all flex items-center space-x-2 font-semibold shadow-lg shadow-emerald-100"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Add Product</span>
                    </button>

                    {selectedProducts.size > 0 && (
                      <button
                        onClick={handleBulkDelete}
                        className="bg-red-600 text-white px-4 py-2.5 rounded-xl hover:bg-red-700 transition-all text-sm font-semibold shadow-lg shadow-red-100"
                      >
                        Delete ({selectedProducts.size})
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 font-medium">
                    {products.length} products from {selectedVendor.businessName}
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left">
                            <input
                              type="checkbox"
                              checked={selectedProducts.size === products.length && products.length > 0}
                              onChange={handleSelectAll}
                              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                            />
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {products.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedProducts.has(product.id)}
                                onChange={() => handleSelectProduct(product.id)}
                                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-4">
                                <img src={getProxiedImageUrl(product.image) || product.image} alt={product.name} className="w-12 h-12 object-cover rounded-lg shadow-sm" />
                                <div>
                                  <span className="font-semibold text-gray-900 block">{product.name}</span>
                                  <span className="text-xs text-gray-400">ID: {product.id.substring(0, 8)}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 font-medium">{product.category}</td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-900">₦{product.price.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <span className={`inline - flex px - 3 py - 1 text - xs font - bold rounded - full ${product.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"} `}>
                                {product.inStock ? "In Stock" : "Out of Stock"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button onClick={() => handleEdit(product)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={vendorSearchQuery}
                    onChange={(e) => setVendorSearchQuery(e.target.value)}
                    placeholder="Search vendors by name or email..."
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {vendors
                    .filter((v) =>
                      v.businessName.toLowerCase().includes(vendorSearchQuery.toLowerCase()) ||
                      v.email.toLowerCase().includes(vendorSearchQuery.toLowerCase())
                    )
                    .map((vendor) => (
                      <div key={vendor.id} onClick={() => handleVendorClick(vendor)} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl hover:border-emerald-300 transition-all duration-300 group">
                        <div className="relative h-24 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-t-lg overflow-hidden">
                          {vendor.bannerImage && <img src={getProxiedImageUrl(vendor.bannerImage) || vendor.bannerImage} alt="" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500" />}
                        </div>
                        <div className="p-4 text-center">
                          <div className="w-16 h-16 mx-auto -mt-10 mb-3 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                            {vendor.profileImage ? (
                              <img src={getProxiedImageUrl(vendor.profileImage) || vendor.profileImage} alt={vendor.businessName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-emerald-100">
                                <Store className="w-8 h-8 text-emerald-600" />
                              </div>
                            )}
                          </div>
                          <div className="text-center mt-4">
                            <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors flex items-center justify-center gap-1.5">
                              {vendor.businessName}
                              {vendor.isVerified && <VerifiedBadge size="sm" />}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1 mb-4">{vendor.email}</p>
                            <div className="flex items-center justify-center gap-2 mb-6">
                              <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center">
                                <Package className="w-3.5 h-3.5 mr-1.5" />
                                {getVendorProductCount(vendor.id)} Products
                              </div>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={(e) => handleVerifyVendor(vendor, e)} className={`flex - 1 flex items - center justify - center px - 3 py - 2 text - xs font - bold rounded - xl border transition - all ${vendor.isVerified ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'} `}>
                                {vendor.isVerified ? <ShieldX className="w-3.5 h-3.5 mr-1" /> : <ShieldCheck className="w-3.5 h-3.5 mr-1" />}
                                {vendor.isVerified ? 'Unverify' : 'Verify'}
                              </button>
                              <button onClick={(e) => handleDeleteVendor(vendor, e)} className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition-all">
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        );
      case "banners":
        return <div className="animate-in fade-in slide-in-from-bottom-2 duration-500"><AdminAnnouncements /></div>;
      case "categories":
        return <div className="animate-in fade-in slide-in-from-bottom-2 duration-500"><AdminCategories allProducts={allProducts} /></div>;
      case "verification":
        return <div className="animate-in fade-in slide-in-from-bottom-2 duration-500"><AdminVerificationRequests /></div>;
      case "leaderboard":
        return <div className="animate-in fade-in slide-in-from-bottom-2 duration-500"><AdminLeaderboard initialLeaderboard={leaderboard} /></div>;
      case "curation":
        return <div className="animate-in fade-in slide-in-from-bottom-2 duration-500"><AdminCuration vendors={vendors} /></div>;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar Component */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== "vendors") setSelectedVendor(null);
        }}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex-shrink-0 flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              {selectedVendor && (
                <button
                  onClick={handleBackToVendors}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                  title="Back to Vendors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight font-display">
                {selectedVendor ? selectedVendor.businessName : activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest hidden sm:block bg-gray-50 px-3 py-1 rounded-full border border-gray-200 italic">Secure Admin Session</span>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth bg-gray-50/50">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 border border-emerald-100">
            <ProductForm
              product={editingProduct}
              onSave={handleSave}
              onCancel={() => setShowForm(false)}
              vendorName={selectedVendor?.businessName}
              whatsappNumber={selectedVendor?.whatsappNumber}
            />
          </div>
        </div>
      )}
    </div>
  );
}
