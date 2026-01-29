import { useEffect, useState } from "react";
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
} from "lucide-react";
import {
  getDoc,
  getDocs,
  query,
  collection,
  orderBy,
  limit,
} from "firebase/firestore";
import { Product, Vendor } from "../types";
import {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getVendorProducts,
} from "../services/products";
import { ProductForm } from "../components/ProductForm";
import { authStateListener, logoutUser } from "../services/auth";
import { getAllVendors, deleteVendor, updateVendorProfile } from "../services/vendorAuth";
import { AdminAnnouncements } from "../components/AdminAnnouncements";
import { AdminCategories } from "../components/AdminCategories";
import { AdminVerificationRequests } from "../components/AdminVerificationRequests";
import { db } from "../firebase";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { getVisitsLeaderboard, VendorVisitData } from "../services/vendorVisits";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminStats } from "../components/AdminStats";
import { AdminLeaderboard } from "../components/AdminLeaderboard";

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

  const [analytics, setAnalytics] = useState({ uniqueVisitors: 0, totalVisits: 0 });

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<VendorVisitData[]>([]);
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");
  const [topSearches, setTopSearches] = useState<{ query: string; count: number }[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalProductViews, setTotalProductViews] = useState(0);
  // Dashboard data loading - initial load
  useEffect(() => {
    const unsubscribe = authStateListener((user) => {
      if (!user) {
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
    try {
      const vendorsData = await getAllVendors();
      setVendors(vendorsData);

      const allVendorProducts = await fetchProducts();
      setAllProducts(allVendorProducts);

      // Load leaderboard
      const leaderboardData = await getVisitsLeaderboard();
      setLeaderboard(leaderboardData);

      // Fetch top searches
      const searchesQuery = query(collection(db, "searches"), orderBy("timestamp", "desc"), limit(100));
      const searchesSnap = await getDocs(searchesQuery);
      const searchCounts: { [key: string]: number } = {};
      searchesSnap.docs.forEach(doc => {
        const q = doc.data().query;
        searchCounts[q] = (searchCounts[q] || 0) + 1;
      });
      const topSearchesData = Object.entries(searchCounts)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTopSearches(topSearchesData);

      // Calculate total metrics from products
      const orders = allProducts.reduce((sum, p) => sum + (p.orderCount || 0), 0);
      const views = allProducts.reduce((sum, p) => sum + (p.viewCount || 0), 0);
      setTotalOrders(orders);
      setTotalProductViews(views);

      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setLoading(false);
    }
  };

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
    if (!window.confirm(`Delete ${selectedProducts.size} selected products?`)) return;

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
      ? `Are you sure you want to delete "${vendor.businessName}" and their ${productCount} products? This action cannot be undone.`
      : `Are you sure you want to delete "${vendor.businessName}"? This action cannot be undone.`;

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

    if (!window.confirm(`Are you sure you want to ${action} "${vendor.businessName}"?`)) {
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

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <AdminStats
              vendorsCount={vendors.length}
              productsCount={allProducts.length}
              inStockCount={allProducts.filter((p) => p.inStock).length}
              outOfStockCount={allProducts.filter((p) => !p.inStock).length}
              uniqueVisitors={analytics.uniqueVisitors}
              totalVisits={analytics.totalVisits}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Category Distribution */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-emerald-600" />
                  Category Distribution
                </h3>
                <div className="space-y-4">
                  {Array.from(new Set(allProducts.map(p => p.category))).map(category => {
                    const count = allProducts.filter(p => p.category === category).length;
                    const percentage = Math.round((count / allProducts.length) * 100) || 0;
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="capitalize text-gray-700">{category}</span>
                          <span className="text-gray-500">{count} products ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Searches */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <Search className="w-5 h-5 mr-2 text-emerald-600" />
                  Top Search Queries
                </h3>
                {topSearches.length > 0 ? (
                  <div className="space-y-3">
                    {topSearches.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-sm font-semibold text-gray-700">"{item.query}"</span>
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold">
                          {item.count} searches
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500">No search data yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Interaction Analytics */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Interaction Metrics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                  <p className="text-orange-600 text-sm font-bold uppercase tracking-wider mb-1">WhatsApp Orders (Clicks)</p>
                  <p className="text-3xl font-black text-orange-900">{totalOrders.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-blue-600 text-sm font-bold uppercase tracking-wider mb-1">Total Product Views</p>
                  <p className="text-3xl font-black text-blue-900">{totalProductViews.toLocaleString()}</p>
                </div>
              </div>
            </div>
            {/* Quick Actions or Recent Stats could go here */}
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

                {/* Products Table implementation remains similar but refreshed */}
                {/* ... (existing products table logic) */}
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
                                <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-lg shadow-sm" />
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
                        <div className="h-28 bg-gradient-to-br from-emerald-600 to-emerald-800 relative overflow-hidden">
                          {vendor.bannerImage && <img src={vendor.bannerImage} alt="" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500" />}
                          <div className="absolute inset-0 bg-black/10" />
                        </div>
                        <div className="p-6 pt-0 relative">
                          <div className="w-20 h-20 rounded-2xl border-4 border-white bg-white shadow-lg overflow-hidden -mt-10 relative z-10 mx-auto">
                            {vendor.profileImage ? (
                              <img src={vendor.profileImage} alt={vendor.businessName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-emerald-50">
                                <Store className="w-10 h-10 text-emerald-600" />
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
      case "banners":
        return <div className="animate-in fade-in slide-in-from-bottom-2 duration-500"><AdminAnnouncements /></div>;
      case "categories":
        return <div className="animate-in fade-in slide-in-from-bottom-2 duration-500"><AdminCategories /></div>;
      case "verification":
        return <div className="animate-in fade-in slide-in-from-bottom-2 duration-500"><AdminVerificationRequests /></div>;
      case "leaderboard":
        return <div className="animate-in fade-in slide-in-from-bottom-2 duration-500"><AdminLeaderboard initialLeaderboard={leaderboard} /></div>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
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
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
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
              <h1 className="text-xl font-bold text-gray-900">
                {selectedVendor ? selectedVendor.businessName : activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace("-", " ")}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Admin Profile/Logout is now in sidebar but could duplicate here for mobile */}
            <span className="text-sm font-medium text-gray-500 hidden sm:block">Admin Session</span>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <ProductForm
              product={editingProduct}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingProduct(null);
              }}
              vendorName={selectedVendor?.businessName}
              whatsappNumber={selectedVendor?.whatsappNumber}
              canAddCategory={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
