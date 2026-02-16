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
  Star,
  DollarSign,
  ShoppingBag,
  Eye,
  ShoppingCart,
  Flame,
  AlertCircle,
  Trophy,
  Activity,
  PieChart,
  RefreshCw,
  MoveDown,
  MessageSquare,
  Clock,
  ThumbsUp,
  Calendar
} from "lucide-react";

import {
  getDocs,
  query,
  collection,
  orderBy,
  limit,
  onSnapshot,
  where,
} from "firebase/firestore";
import { Product, Vendor, ExpansionResponse, ContactFeedback } from "../types";
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
import { auth } from "../firebase";
import { logAdminAction, getRecentAuditLogs } from "../services/audit";
import { getRecentFeedbackNotes } from "../services/vendorContacts";
import { GMVDashboard } from "../components/admin/GMVDashboard";

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
  const [activeTab, setActiveTab] = useState<string>("business-metrics");
  const [productFilter, setProductFilter] = useState<'all' | 'out-of-stock'>('all');
  const [inventorySearch, setInventorySearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


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
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [feedbackNotes, setFeedbackNotes] = useState<any[]>([]);
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
      const analyticsResults = await getAnalytics();
      if (analyticsResults) {
        setAnalytics(analyticsResults);
      }
    } catch (err) {
      console.error("[AdminDashboard] Error loading site analytics:", err);
    }

    try {
      // Fetch searches for intelligence and auditing
      let searchesQuery = query(collection(db, "searches"), orderBy("timestamp", "desc"), limit(200));
      let searchesSnap;

      try {
        searchesSnap = await getDocs(searchesQuery);
      } catch (indexErr) {
        console.warn("[AdminDashboard] Initial search query failed with ordering (index missing). Falling back to unordered.");
        searchesQuery = query(collection(db, "searches"), limit(200));
        searchesSnap = await getDocs(searchesQuery);
      }


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

      // Fetch category views for more accurate funnel 
      const analyticsEventsSnap = await getDocs(query(collection(db, "analytics_events"), where("type", "==", "category_view")));
      const catViewCounts: { [key: string]: number } = {};
      analyticsEventsSnap.docs.forEach(doc => {
        const cat = doc.data().category;
        if (cat) catViewCounts[cat] = (catViewCounts[cat] || 0) + 1;
      });

      const intelConversion = categories.map(cat => {
        const catProds = allVendorProducts.filter(p => (p.category || "Uncategorized") === cat);
        const orders = catProds.reduce((sum, p) => sum + (p.orderCount || 0), 0);
        // Use browsing views instead of just product clicks if available
        const views = catViewCounts[cat] || catProds.reduce((sum, p) => sum + (p.viewCount || 0), 0);
        const rate = views > 0 ? (orders / views) * 100 : 0;
        return { category: cat, rate, orders, views };
      }).sort((a, b) => b.rate - a.rate);
      setCategoryConversion(intelConversion);

      // Fetch Audit Logs
      const logs = await getRecentAuditLogs(30);
      setAuditLogs(logs);

      // Fetch Recent Feedback Notes
      const feedback = await getRecentFeedbackNotes(50);
      setFeedbackNotes(feedback);

    } catch (err) {
      console.error("[AdminDashboard] Error loading searches or intelligence:", err);
    }

    setLoading(false);
  };

  // Real-time search listener
  useEffect(() => {
    if (!authChecked) return;

    // Real-time listener for operational search monitoring
    const searchesRef = collection(db, "searches");
    const orderedQuery = query(searchesRef, orderBy("timestamp", "desc"), limit(100));

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
          const unorderedQuery = query(searchesRef, limit(100));
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
      const product = products.find(p => p.id === id);
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setAllProducts((prev) => prev.filter((p) => p.id !== id));

      if (auth.currentUser?.email) {
        logAdminAction(auth.currentUser.email, "product_delete", {
          targetId: id,
          targetName: product?.name,
          details: `Deleted product from vendor ${product?.vendorName}`
        });
      }

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

      if (auth.currentUser?.email) {
        logAdminAction(auth.currentUser.email, "vendor_delete", {
          targetId: vendor.id,
          targetName: vendor.businessName,
          details: `Deleted vendor with ${productCount} products`
        });
      }

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
        verificationLevel: newStatus ? "verified" : "basic",
      });
      setVendors((prev) =>
        prev.map((v) => (v.id === vendor.id ? { ...v, isVerified: newStatus, verifiedAt: verifiedAt, verificationLevel: newStatus ? "verified" : "basic" } : v))
      );

      if (auth.currentUser?.email) {
        logAdminAction(auth.currentUser.email, newStatus ? "vendor_verify" : "vendor_unverify", {
          targetId: vendor.id,
          targetName: vendor.businessName
        });
      }

      alert(`Vendor "${vendor.businessName}" is now ${newStatus ? "verified" : "unverified"}.`);
    } catch (err) {
      console.error("Error updating vendor verification:", err);
      alert("Error updating vendor: " + (err as Error).message);
    }
  };


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
      case "overview":
      case "business-metrics":
        return (
          <GMVDashboard
            totalVisits={analytics?.total?.totalVisits || 0}
            uniqueVisitors={analytics?.total?.uniqueVisitors || 0}
            totalProducts={allProducts.length}
            outOfStockCount={allProducts.filter(p => p.inStock === false).length}
            trafficLeaderboard={leaderboard}
            onViewLeaderboard={() => setActiveTab("leaderboard")}
            onViewProducts={(filter) => {
              setProductFilter(filter || 'all');
              setActiveTab("all-products");
            }}
            totalProductViews={totalProductViews}
            totalOrderIntents={totalOrders}
          />
        );

      case "all-products":
        const filteredProducts = allProducts.filter(p => {
          const matchesFilter = productFilter === 'all' || !p.inStock;
          const searchLower = inventorySearch.toLowerCase();
          const matchesSearch = !inventorySearch ||
            p.name.toLowerCase().includes(searchLower) ||
            p.category.toLowerCase().includes(searchLower) ||
            p.vendorName.toLowerCase().includes(searchLower);
          return matchesFilter && matchesSearch;
        });

        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight font-display flex items-center gap-2">
                <Package className="w-6 h-6 text-emerald-600" />
                Platform Inventory ({filteredProducts.length})
              </h3>
              <div className="flex bg-gray-100 rounded-lg p-1 text-xs">
                <button
                  onClick={() => setProductFilter('all')}
                  className={`px-4 py-2 rounded-lg font-bold transition-all ${productFilter === 'all' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}
                >
                  All Items
                </button>
                <button
                  onClick={() => setProductFilter('out-of-stock')}
                  className={`px-4 py-2 rounded-lg font-bold transition-all ${productFilter === 'out-of-stock' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`}
                >
                  Out of Stock
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, categories, or vendors..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none shadow-sm transition-all font-medium text-gray-900"
              />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-4">
                            <img src={getProxiedImageUrl(product.image) || product.image} alt={product.name} className="w-12 h-12 object-cover rounded-lg shadow-sm" />
                            <div>
                              <span className="font-semibold text-gray-900 block">{product.name}</span>
                              <span className="text-[10px] text-gray-400 font-bold uppercase">{product.category}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-500">{product.vendorName}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">₦{product.price.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-[10px] font-black uppercase rounded-full ${product.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {product.inStock ? "In Stock" : "Out of Stock"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button onClick={() => navigate(`/product/${product.id}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View on Site"><Eye className="w-4 h-4" /></button>
                            <button
                              onClick={async () => {
                                setSelectedVendor(vendors.find(v => v.id === product.vendorId) || null);
                                setEditingProduct(product);
                                setShowForm(true);
                              }}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredProducts.length === 0 && (
                  <div className="p-20 text-center text-gray-400 italic font-medium">
                    No products matching this filter found.
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "product-interactions":
      case "product-performance":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Global Product Health */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-blue-600 text-[10px] font-black uppercase tracking-wider">Total Product Views</p>
                  <Eye className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-3xl font-black text-blue-900">{totalProductViews.toLocaleString()}</p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-emerald-600 text-[10px] font-black uppercase tracking-wider">Total Cart Additions</p>
                  <ShoppingCart className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-3xl font-black text-emerald-900">{totalCartAdditions.toLocaleString()}</p>
                <p className="text-[10px] text-emerald-600 font-bold mt-1">High Intent Customers</p>
              </div>

              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-orange-600 text-[10px] font-black uppercase tracking-wider">Direct Order Clicks</p>
                  <ShoppingBag className="w-4 h-4 text-orange-400" />
                </div>
                <p className="text-3xl font-black text-orange-900">{totalOrders.toLocaleString()}</p>
                <p className="text-[10px] text-orange-600 font-bold mt-1">Lead Generation Pipeline</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Product Hotlist */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-3 font-display uppercase tracking-tight mb-6">
                  <Flame className="w-6 h-6 text-orange-500" />
                  Product Engagement Hotlist
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-left">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest">Product</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Engagement</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allProducts
                        .map(p => ({
                          ...p,
                          totalScore: (p.orderCount || 0) + (p.viewCount || 0) + (p.cartCount || 0)
                        }))
                        .sort((a, b) => b.totalScore - a.totalScore)
                        .slice(0, 10)
                        .map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                <img src={getProxiedImageUrl(product.image) || product.image} className="w-10 h-10 rounded-lg object-cover" />
                                <div className="min-w-0">
                                  <p className="text-sm font-bold truncate">{product.name}</p>
                                  <p className="text-[9px] text-gray-400 uppercase font-black">{product.category}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-4">
                                <div className="text-center">
                                  <p className="text-xs font-black text-blue-600">{product.viewCount || 0}</p>
                                  <p className="text-[8px] font-black text-gray-400 uppercase">Views</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs font-black text-emerald-600">{product.orderCount || 0}</p>
                                  <p className="text-[8px] font-black text-gray-400 uppercase">Orders</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => navigate(`/product/${product.id}`)} className="text-gray-400 hover:text-emerald-600 transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Side Intelligence */}
              <div className="space-y-6">
                {/* Stagnant Products */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center uppercase tracking-tight">
                    <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
                    Stagnant Inventory
                  </h3>
                  <div className="space-y-4">
                    {allProducts
                      .filter(p => (p.viewCount || 0) < 5 && (p.orderCount || 0) === 0)
                      .slice(0, 4)
                      .map(product => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-red-50/20 rounded-xl border border-red-50">
                          <div className="flex items-center space-x-3">
                            <img src={getProxiedImageUrl(product.image) || product.image} className="w-8 h-8 object-cover rounded shadow-xs" />
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold truncate max-w-[100px]">{product.name}</p>
                              <p className="text-[8px] text-gray-400">by {product.vendorName}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-black text-red-600 uppercase">Boost Req.</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Reliability Kings */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center uppercase tracking-tight">
                    <Trophy className="w-4 h-4 mr-2 text-amber-500" />
                    Reliability Kings
                  </h3>
                  <div className="space-y-3">
                    {reliabilityRanking.slice(0, 4).map((vendor, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-700">{vendor.businessName}</span>
                        <span className="text-xs font-black text-emerald-600">{vendor.trustScore}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div >
        );

      case "category-stats":
      case "market-intelligence":
      case "category-intelligence":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Category Conversion & Volume */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center uppercase tracking-tight text-emerald-600">
                  <Activity className="w-4 h-4 mr-2" />
                  Category Order Conversion
                </h3>
                <div className="space-y-4">
                  {categoryConversion.slice(0, 6).map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="capitalize">{item.category}</span>
                        <span className="text-emerald-600 font-black">{item.rate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, item.rate * 3)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center uppercase tracking-tight text-blue-600">
                  <PieChart className="w-4 h-4 mr-2" />
                  Supply Distribution
                </h3>
                <div className="space-y-4">
                  {Array.from(new Set(allProducts.map(p => p.category)))
                    .map(category => ({
                      name: category,
                      count: allProducts.filter(p => p.category === category).length
                    }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 6)
                    .map(({ name, count }) => {
                      const percentage = Math.round((count / (allProducts.length || 1)) * 100);
                      return (
                        <div key={name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-xs font-bold capitalize text-gray-700">{name}</span>
                          </div>
                          <span className="text-xs font-black text-gray-400">{count} Units ({percentage}%)</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Categorical Price Index */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center uppercase tracking-tight text-purple-600">
                <RefreshCw className="w-4 h-4 mr-2" />
                Market Price Index (By Category)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from(new Set(allProducts.map(p => p.category || "Uncategorized")))
                  .map(cat => {
                    const catProducts = allProducts.filter(p => (p.category || "Uncategorized") === cat);
                    const avg = catProducts.reduce((sum, p) => sum + p.price, 0) / (catProducts.length || 1);
                    return { name: cat, avg };
                  })
                  .sort((a, b) => b.avg - a.avg)
                  .map(item => (
                    <div key={item.name} className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-center">
                      <p className="text-[9px] font-black text-purple-400 uppercase truncate">{item.name}</p>
                      <p className="text-sm font-black text-purple-700 mt-1">₦{Math.round(item.avg).toLocaleString()}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        );

      case "demand-gap":
      case "search-analytics":
      case "search-intelligence":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Search Queries */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center uppercase tracking-tight">
                    <Search className="w-4 h-4 mr-2 text-emerald-600" />
                    Active Student Interest
                  </h3>
                  <span className="text-[10px] font-black uppercase text-emerald-600">{topSearches.length} Key Terms</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {topSearches.slice(0, 10).map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors">
                      <span className="text-sm font-bold italic text-gray-700">"{item.query}"</span>
                      <span className="bg-white text-emerald-600 px-3 py-1 rounded-lg text-xs font-black shadow-xs">{item.count} searches</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Demand Gaps */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center uppercase tracking-tight text-red-600">
                    <MoveDown className="w-4 h-4 mr-2" />
                    Unmet Demand (Zero Results)
                  </h3>
                  <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-black tracking-widest">URGENT</span>
                </div>
                <div className="space-y-2">
                  {demandGaps.slice(0, 10).map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-red-50/30 rounded-xl border border-red-50">
                      <span className="text-sm font-bold text-red-900 italic">"{item.query}"</span>
                      <span className="text-xs font-black text-red-400">{item.count} Student Requests</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Keyword Price Index */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center uppercase tracking-tight">
                <DollarSign className="w-4 h-4 mr-2 text-blue-600" />
                Keyword Price Sensitivity index
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {keywordPriceIndex.slice(0, 10).map((item, i) => (
                  <div key={i} className="p-3 bg-white border border-gray-100 rounded-xl shadow-xs">
                    <p className="text-[10px] font-black text-gray-400 italic mb-1 truncate">"{item.query}"</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-600">₦{Math.round(item.avgPrice).toLocaleString()}</span>
                      <span className="text-[10px] text-gray-400">n={item.productCount}</span>
                    </div>
                  </div>
                ))}
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
                              <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${product.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
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
                              {vendor.isVerified && <VerifiedBadge level={vendor.verificationLevel || "verified"} size="sm" />}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1 mb-4">{vendor.email}</p>
                            <div className="flex items-center justify-center gap-2 mb-6">
                              <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center">
                                <Package className="w-3.5 h-3.5 mr-1.5" />
                                {getVendorProductCount(vendor.id)} Products
                              </div>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={(e) => handleVerifyVendor(vendor, e)} className={`flex-1 flex items-center justify-center px-3 py-2 text-xs font-bold rounded-xl border transition-all ${vendor.isVerified ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}>
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
      case "leaderboard":
        return <AdminLeaderboard initialLeaderboard={leaderboard} />;

      case "banners":
        return <div className="animate-in fade-in slide-in-from-bottom-2 duration-500"><AdminAnnouncements /></div>;
      case "categories":
        return <div className="animate-in fade-in slide-in-from-bottom-2 duration-500"><AdminCategories allProducts={allProducts} /></div>;
      case "verification":
        return <div className="animate-in fade-in slide-in-from-bottom-2 duration-500"><AdminVerificationRequests /></div>;
      case "curation":
        return <div className="animate-in fade-in slide-in-from-bottom-2 duration-500"><AdminCuration vendors={vendors} /></div>;
      case "expansion-circle":
        return <ExpansionCircleView />;
      case "customer-feedback":
        return (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight font-display flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-emerald-600" />
                Customer Feedback Loop
              </h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                Latest Student Experiences
              </span>
            </div>

            <div className="space-y-6">
              {feedbackNotes.length > 0 ? (
                feedbackNotes.map((feedback) => {
                  const vendor = vendors.find(v => v.id === feedback.vendorId);

                  return (
                    <div
                      key={feedback.id}
                      className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-200 transition-all group"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 rounded-lg">
                            <Store className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{vendor?.businessName || "Unknown Vendor"}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                              <Calendar className="w-3 h-3" />
                              {feedback.feedbackAt.toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 ${feedback.responseTime === 'under_30min' || feedback.responseTime === '30min_2hr'
                              ? 'bg-emerald-50 text-emerald-700'
                              : feedback.responseTime === 'no_response'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}>
                            <Clock className="w-3 h-3" />
                            {feedback.responseTime.replace('_', ' ')}
                          </div>

                          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 ${feedback.wasHelpful ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                            }`}>
                            <ThumbsUp className="w-3 h-3" />
                            {feedback.wasHelpful ? 'Helpful' : 'Not Helpful'}
                          </div>

                          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 ${feedback.purchaseMade ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-500'
                            }`}>
                            <ShoppingBag className="w-3 h-3" />
                            {feedback.purchaseMade ? 'Purchase Made' : 'No Purchase'}
                          </div>
                        </div>
                      </div>

                      {feedback.feedbackNote && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-xl relative">
                          <div className="absolute -top-2 left-4 w-3 h-3 bg-gray-50 rotate-45 border-t border-l border-gray-100" />
                          <p className="text-sm text-gray-600 italic leading-relaxed">
                            "{feedback.feedbackNote}"
                          </p>
                        </div>
                      )}

                      {!feedback.feedbackNote && (
                        <p className="text-xs text-gray-300 italic">No additional comments provided.</p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No customer feedback collected yet</p>
                </div>
              )}
            </div>
          </div>
        );
      case "audit-logs":
        return (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight font-display flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                Administrative Audit Trail
              </h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">Last 30 Actions</span>
            </div>
            <div className="space-y-4">
              {auditLogs.length > 0 ? auditLogs.map((log) => (
                <div key={log.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start justify-between group hover:border-emerald-200 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${log.action.includes('delete') ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {(log.action || '').replace('_', ' ')}
                      </span>
                      <span className="text-xs font-bold text-gray-900">{log.targetName}</span>
                    </div>
                    <p className="text-[11px] text-gray-500">{log.details || `Admin action performed on ${log.targetId}`}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[9px] font-bold text-emerald-600">{log.adminEmail}</span>
                      <span className="text-[9px] text-gray-400">•</span>
                      <span className="text-[9px] text-gray-400">{log.timestamp ? log.timestamp.toLocaleString() : 'Recent'}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <ShieldCheck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No audit logs found</p>
                </div>
              )}
            </div>
          </div>
        );
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
