import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  LogOut,
  Package,
  TrendingUp,
  AlertCircle,
  Store,
  ArrowLeft,
  Users,
  Megaphone,
  Eye,
  ShieldCheck,
  ShieldX,
  Trophy,
  RotateCcw,
  Tag,
} from "lucide-react";
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
import { getAnalytics } from "../services/analytics";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { getVisitsLeaderboard, resetVisits, VendorVisitData } from "../services/vendorVisits";

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

  // Analytics state
  const [analytics, setAnalytics] = useState({ uniqueVisitors: 0, totalVisits: 0 });

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<VendorVisitData[]>([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPeriodName, setResetPeriodName] = useState("");
  const [resetting, setResetting] = useState(false);

  // Auth check
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

      // Load analytics
      const analyticsData = await getAnalytics();
      setAnalytics(analyticsData);

      // Load leaderboard
      const leaderboardData = await getVisitsLeaderboard();
      setLeaderboard(leaderboardData);

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

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {selectedVendor && (
              <button
                onClick={handleBackToVendors}
                className="flex items-center space-x-2 text-gray-600 hover:text-emerald-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Vendors</span>
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedVendor ? selectedVendor.businessName : "Admin Dashboard"}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards - Dynamic based on selected vendor */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {/* First Card: Vendors (global) or Vendor Name (when selected) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              {selectedVendor ? (
                <Store className="w-6 h-6 text-emerald-600" />
              ) : (
                <Users className="w-6 h-6 text-emerald-600" />
              )}
              <span className="text-xl font-bold text-gray-900">
                {selectedVendor ? products.length : vendors.length}
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              {selectedVendor ? "Vendor Products" : "Total Vendors"}
            </p>
          </div>

          {/* Second Card: Total Products */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                {selectedVendor ? products.length : allProducts.length}
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              {selectedVendor ? "Total Products" : "All Products"}
            </p>
          </div>

          {/* Third Card: In Stock */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <span className="text-xl font-bold text-gray-900">
                {selectedVendor
                  ? products.filter((p) => p.inStock).length
                  : allProducts.filter((p) => p.inStock).length}
              </span>
            </div>
            <p className="text-gray-600 text-sm">In Stock</p>
          </div>

          {/* Fourth Card: Out of Stock */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <span className="text-xl font-bold text-gray-900">
                {selectedVendor
                  ? products.filter((p) => !p.inStock).length
                  : allProducts.filter((p) => !p.inStock).length}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Out of Stock</p>
          </div>

          {/* Fifth Card: Unique Visitors */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-6 h-6 text-purple-600" />
              <span className="text-xl font-bold text-gray-900">
                {analytics.uniqueVisitors.toLocaleString()}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Unique Visitors</p>
          </div>

          {/* Sixth Card: Total Visits */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-6 h-6 text-cyan-600" />
              <span className="text-xl font-bold text-gray-900">
                {analytics.totalVisits.toLocaleString()}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Total Visits</p>
          </div>
        </div>

        {/* Announcements Management (only on main admin view) */}
        {!selectedVendor && (
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-6">
              <Megaphone className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-bold text-gray-900">Homepage Banners</h2>
            </div>
            <AdminAnnouncements />
          </div>
        )}

        {/* Store Visits Leaderboard (only on main admin view) */}
        {!selectedVendor && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-amber-500" />
                <h2 className="text-xl font-bold text-gray-900">Store Visits Leaderboard</h2>
              </div>
              <button
                onClick={() => setShowResetModal(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>

            {leaderboard.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                No store visits recorded yet.
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Rank</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Vendor</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.slice(0, 10).map((item) => (
                      <tr key={item.vendorId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="text-lg">
                            {item.rank === 1 && "🥇"}
                            {item.rank === 2 && "🥈"}
                            {item.rank === 3 && "🥉"}
                            {item.rank && item.rank > 3 && item.rank}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{item.vendorName}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{item.count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Reset Leaderboard Modal */}
        {showResetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Reset Leaderboard</h3>
              <p className="text-gray-600 mb-4">
                This will archive the current leaderboard and reset all counts to 0.
              </p>
              <input
                type="text"
                value={resetPeriodName}
                onChange={(e) => setResetPeriodName(e.target.value)}
                placeholder="Period name (e.g., January 2026)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowResetModal(false);
                    setResetPeriodName("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!resetPeriodName.trim()) return;
                    setResetting(true);
                    const success = await resetVisits(resetPeriodName);
                    if (success) {
                      const newLeaderboard = await getVisitsLeaderboard();
                      setLeaderboard(newLeaderboard);
                    }
                    setResetting(false);
                    setShowResetModal(false);
                    setResetPeriodName("");
                  }}
                  disabled={!resetPeriodName.trim() || resetting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:bg-gray-400"
                >
                  {resetting ? "Resetting..." : "Reset & Archive"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Categories Management (only on main admin view) */}
        {!selectedVendor && (
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-6">
              <Tag className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-bold text-gray-900">Product Categories</h2>
            </div>
            <AdminCategories />
          </div>
        )}

        {/* Verification Requests (only on main admin view) */}
        {!selectedVendor && (
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-6">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-bold text-gray-900">Verification Requests</h2>
            </div>
            <AdminVerificationRequests />
          </div>
        )}

        {/* Vendor List View */}
        {!selectedVendor && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-6">All Vendors</h2>

            {vendors.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Vendors Yet
                </h3>
                <p className="text-gray-500">
                  Vendors will appear here once they register.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {vendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    onClick={() => handleVendorClick(vendor)}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all"
                  >
                    {/* Vendor Banner */}
                    <div className="h-24 bg-gradient-to-r from-emerald-600 to-emerald-700 relative">
                      {vendor.bannerImage && (
                        <img
                          src={vendor.bannerImage}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Vendor Info */}
                    <div className="p-4 pt-0 relative">
                      {/* Profile Image */}
                      <div className="w-16 h-16 rounded-full border-4 border-white bg-emerald-100 overflow-hidden -mt-8 relative z-10 mx-auto">
                        {vendor.profileImage ? (
                          <img
                            src={vendor.profileImage}
                            alt={vendor.businessName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Store className="w-8 h-8 text-emerald-600" />
                          </div>
                        )}
                      </div>

                      <div className="text-center mt-2">
                        <h3 className="font-semibold text-gray-900 flex items-center justify-center gap-1">
                          {vendor.businessName}
                          {vendor.isVerified && <VerifiedBadge size="sm" />}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {vendor.email}
                        </p>
                        <div className="mt-3 inline-flex items-center bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                          <Package className="w-4 h-4 mr-1" />
                          {getVendorProductCount(vendor.id)} Products
                        </div>

                        {/* Verification Timestamp */}
                        {vendor.isVerified && vendor.verifiedAt && (
                          <p className="mt-2 text-xs text-gray-400">
                            Verified on {new Date(vendor.verifiedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })} at {new Date(vendor.verifiedAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}

                        {/* Verify/Unverify and Delete Buttons */}
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => handleVerifyVendor(vendor, e)}
                            className={`inline-flex items-center px-3 py-1.5 text-sm rounded-lg transition-colors border ${vendor.isVerified
                              ? 'text-orange-600 hover:bg-orange-50 border-orange-200'
                              : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                              }`}
                          >
                            {vendor.isVerified ? (
                              <>
                                <ShieldX className="w-4 h-4 mr-1" />
                                Unverify
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-4 h-4 mr-1" />
                                Verify
                              </>
                            )}
                          </button>
                          <button
                            onClick={(e) => handleDeleteVendor(vendor, e)}
                            className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Vendor Products View */}
        {selectedVendor && (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setShowForm(true);
                  }}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Product</span>
                </button>

                {selectedProducts.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Delete ({selectedProducts.size})
                  </button>
                )}
              </div>

              <p className="text-sm text-gray-600">
                {products.length} products from {selectedVendor.businessName}
              </p>
            </div>

            {/* Product Form Modal */}
            {showForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

            {/* Products Table */}
            {products.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Products
                </h3>
                <p className="text-gray-500 mb-6">
                  This vendor hasn't added any products yet.
                </p>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setShowForm(true);
                  }}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center space-x-2 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add First Product</span>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={
                              selectedProducts.size === products.length &&
                              products.length > 0
                            }
                            onChange={handleSelectAll}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedProducts.has(product.id)}
                              onChange={() => handleSelectProduct(product.id)}
                              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div>
                                <span className="font-medium text-gray-900 block">
                                  {product.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ID: {product.id.substring(0, 8)}...
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {product.category}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            ₦{product.price.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.inStock
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                                }`}
                            >
                              {product.inStock ? "In Stock" : "Out of Stock"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(product)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
