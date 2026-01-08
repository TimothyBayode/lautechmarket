import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    Plus,
    ArrowLeft,
    Edit2,
    Trash2,
    Package,
    TrendingUp,
    AlertCircle,
    Store,
    Link as LinkIcon,
    Check,
    X,
    Camera,
    Phone,
    Share2,
    Grid3X3,
    List,
    ShieldCheck,
} from "lucide-react";
import { MessageCircle, ExternalLink } from "lucide-react";
import { Product, Vendor } from "../../types";
import {
    getVendorProducts,
    addProduct,
    updateProduct,
    deleteProduct,
} from "../../services/products";
import { ProductForm } from "../../components/ProductForm";
import {
    vendorAuthStateListener,
    updateVendorProfile,
} from "../../services/vendorAuth";
import { uploadImage } from "../../services/cloudinary";
import { Header } from "../../components/Header";
import { VerificationRequestModal } from "../../components/VerificationRequestModal";
import { hasPendingRequest } from "../../services/verificationRequests";
import { getVisitsLeaderboard, VendorVisitData } from "../../services/vendorVisits";
import { Trophy } from "lucide-react";

/**
 * VendorDashboard Component
 * 
 * Dashboard for vendors to manage their products.
 * Shows product listing with edit/delete capabilities.
 */
export function VendorDashboard() {
    const navigate = useNavigate();

    // State for current vendor
    const [vendor, setVendor] = useState<Vendor | null>(null);

    // State for products
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // State for product form modal
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // State for auth check
    const [authChecked, setAuthChecked] = useState(false);

    // State for copied link feedback
    const [copiedProductId, setCopiedProductId] = useState<string | null>(null);
    const [copiedStoreLink, setCopiedStoreLink] = useState(false);

    // State for view mode (grid or list)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // State for bulk selection
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

    // State for stock filter (all, inStock, outOfStock)
    const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'outOfStock'>('all');

    // State for verification modal
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [hasPendingVerification, setHasPendingVerification] = useState(false);

    // State for Vendor Hub welcome popup
    const [showVendorHubPopup, setShowVendorHubPopup] = useState(false);

    // State for top referrers leaderboard
    const [topReferrers, setTopReferrers] = useState<VendorVisitData[]>([]);
    const [myRankData, setMyRankData] = useState<VendorVisitData | null>(null);

    // Check if should show Vendor Hub popup on mount
    useEffect(() => {
        const checkVendorHubPopup = () => {
            const joined = localStorage.getItem('vendorHubJoined');
            if (joined === 'true') return; // Never show if already joined

            const dismissedAt = localStorage.getItem('vendorHubDismissedAt');
            if (dismissedAt) {
                const dismissedTime = parseInt(dismissedAt, 10);
                const oneDayMs = 24 * 60 * 60 * 1000; // 24 hours
                if (Date.now() - dismissedTime < oneDayMs) return; // Don't show if less than 24 hours
            }

            // Show popup
            setShowVendorHubPopup(true);
        };

        // Delay popup slightly so dashboard loads first
        const timer = setTimeout(checkVendorHubPopup, 1000);
        return () => clearTimeout(timer);
    }, []);

    // Generate WhatsApp link
    const getWhatsAppLink = (number: string): string => {
        const cleanNumber = number.replace(/\D/g, "");
        return `https://wa.me/${cleanNumber}`;
    };

    // Scroll to products section
    const scrollToProducts = () => {
        const productsSection = document.getElementById("products-section");
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: "smooth" });
        }
    };

    // Handle share store link
    const handleShareStore = async () => {
        // Construct the public store URL
        const storeUrl = `${window.location.origin}/store/${vendor?.id}`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: `${vendor?.businessName} - LAUTECH Market`,
                    text: `Check out ${vendor?.businessName} on LAUTECH Market!`,
                    url: storeUrl,
                });
            } else {
                await navigator.clipboard.writeText(storeUrl);
                setCopiedStoreLink(true);
                setTimeout(() => setCopiedStoreLink(false), 2000);
            }
        } catch (err) {
            console.error("Error sharing:", err);
            // Fallback to clipboard
            const textArea = document.createElement("textarea");
            textArea.value = storeUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            setCopiedStoreLink(true);
            setTimeout(() => setCopiedStoreLink(false), 2000);
        }
    };

    // State for profile editing
    const [showProfileForm, setShowProfileForm] = useState(false);
    const [profileForm, setProfileForm] = useState({
        businessName: "",
        description: "",
        whatsappNumber: "",
    });

    // State for image uploads
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [uploadingProfile, setUploadingProfile] = useState(false);

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = vendorAuthStateListener((currentVendor) => {
            if (!currentVendor) {
                navigate("/vendor/login");
                return;
            }
            setVendor(currentVendor);
            setAuthChecked(true);
            loadVendorProducts(currentVendor.id);
        });

        return () => unsubscribe();
    }, [navigate]);

    // Load top referrers leaderboard and find vendor's rank
    useEffect(() => {
        const loadLeaderboard = async () => {
            if (!vendor) return;
            const data = await getVisitsLeaderboard();
            setTopReferrers(data.slice(0, 3)); // Only top 3

            // Find current vendor's rank data (if not already in top 3)
            const myRank = data.find(item => item.vendorId === vendor.id);
            if (myRank && myRank.rank && myRank.rank > 3) {
                setMyRankData(myRank);
            } else {
                setMyRankData(null);
            }
        };
        loadLeaderboard();
    }, [vendor]);

    // Load vendor's products
    const loadVendorProducts = async (vendorId: string) => {
        setLoading(true);
        try {
            const data = await getVendorProducts(vendorId);
            setProducts(data);
        } catch (err) {
            console.error("Failed to load products:", err);
        } finally {
            setLoading(false);
        }
    };

    // Handle save product (add or update)
    const handleSave = async (productData: Product) => {
        if (!vendor) return;

        try {
            const productWithVendor = {
                ...productData,
                vendorId: vendor.id,
                vendorName: vendor.businessName,
                whatsappNumber: vendor.whatsappNumber,
            };

            if (editingProduct) {
                await updateProduct(productData.id, productWithVendor);
                setProducts((prev) =>
                    prev.map((p) => (p.id === productData.id ? productWithVendor : p))
                );
            } else {
                const newProduct = await addProduct(productWithVendor);
                setProducts((prev) => [...prev, newProduct]);
            }
        } catch (err) {
            console.error("Error saving product:", err);
            alert("Error saving product: " + (err as Error).message);
        } finally {
            setShowForm(false);
            setEditingProduct(null);
        }
    };

    // Handle edit product
    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setShowForm(true);
    };

    // Handle delete product
    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this product?")) {
            return;
        }

        try {
            await deleteProduct(id);
            setProducts((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            console.error("Error deleting product:", err);
            alert("Error deleting product: " + (err as Error).message);
        }
    };

    // Format price with Naira symbol
    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat("en-NG", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(price);
    };

    // Toggle product selection
    const toggleProductSelection = (productId: string) => {
        setSelectedProducts((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    // Select all products
    const handleSelectAll = () => {
        if (selectedProducts.size === products.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(products.map((p) => p.id)));
        }
    };

    // Clear selection
    const clearSelection = () => {
        setSelectedProducts(new Set());
    };

    // Bulk delete selected products
    const handleBulkDelete = async () => {
        if (selectedProducts.size === 0) return;

        const confirmMessage = `Are you sure you want to delete ${selectedProducts.size} selected product(s)? This action cannot be undone.`;
        if (!window.confirm(confirmMessage)) return;

        try {
            for (const id of selectedProducts) {
                await deleteProduct(id);
            }
            setProducts((prev) => prev.filter((p) => !selectedProducts.has(p.id)));
            setSelectedProducts(new Set());
            alert(`Successfully deleted ${selectedProducts.size} product(s).`);
        } catch (err) {
            console.error("Error in bulk delete:", err);
            alert("Error deleting products: " + (err as Error).message);
        }
    };

    // Bulk toggle stock status
    const handleBulkToggleStock = async (inStock: boolean) => {
        if (selectedProducts.size === 0) return;

        const action = inStock ? "mark as In Stock" : "mark as Out of Stock";
        const confirmMessage = `Are you sure you want to ${action} ${selectedProducts.size} selected product(s)?`;
        if (!window.confirm(confirmMessage)) return;

        try {
            for (const id of selectedProducts) {
                await updateProduct(id, { inStock });
            }
            setProducts((prev) =>
                prev.map((p) =>
                    selectedProducts.has(p.id) ? { ...p, inStock } : p
                )
            );
            setSelectedProducts(new Set());
            alert(`Successfully updated ${selectedProducts.size} product(s).`);
        } catch (err) {
            console.error("Error in bulk stock update:", err);
            alert("Error updating products: " + (err as Error).message);
        }
    };

    // Handle copy product link
    const handleCopyLink = async (productId: string) => {
        const productUrl = `${window.location.origin}/product/${productId}`;
        try {
            await navigator.clipboard.writeText(productUrl);
            setCopiedProductId(productId);
            setTimeout(() => setCopiedProductId(null), 2000);
        } catch (err) {
            console.error("Failed to copy link:", err);
            const textArea = document.createElement("textarea");
            textArea.value = productUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            setCopiedProductId(productId);
            setTimeout(() => setCopiedProductId(null), 2000);
        }
    };

    // Handle profile update
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vendor) return;

        try {
            await updateVendorProfile(vendor.id, {
                businessName: profileForm.businessName,
                description: profileForm.description,
                whatsappNumber: profileForm.whatsappNumber ? `+234${profileForm.whatsappNumber}` : vendor.whatsappNumber,
            });
            setShowProfileForm(false);
        } catch (err) {
            console.error("Error updating profile:", err);
            alert("Failed to update profile");
        }
    };

    // Open profile form
    const handleOpenProfileForm = () => {
        if (vendor) {
            // Extract digits after +234 if present
            let phoneDigits = "";
            if (vendor.whatsappNumber) {
                phoneDigits = vendor.whatsappNumber.replace(/^\+234/, "").replace(/\D/g, "");
            }
            setProfileForm({
                businessName: vendor.businessName,
                description: vendor.description || "",
                whatsappNumber: phoneDigits,
            });
            setShowProfileForm(true);
        }
    };

    // Handle banner image upload
    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !vendor) return;

        setUploadingBanner(true);
        try {
            const uploadResult = await uploadImage(file);
            await updateVendorProfile(vendor.id, { bannerImage: uploadResult.url });
        } catch (err) {
            console.error("Error uploading banner:", err);
            alert("Failed to upload banner image");
        } finally {
            setUploadingBanner(false);
        }
    };

    // Handle profile image upload
    const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !vendor) return;

        setUploadingProfile(true);
        try {
            const uploadResult = await uploadImage(file);
            await updateVendorProfile(vendor.id, { profileImage: uploadResult.url });
        } catch (err) {
            console.error("Error uploading profile image:", err);
            alert("Failed to upload profile image");
        } finally {
            setUploadingProfile(false);
        }
    };

    // Show loading state
    if (!authChecked || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    // Calculate stats
    const totalProducts = products.length;
    const inStockCount = products.filter((p) => p.inStock).length;
    const outOfStockCount = products.filter((p) => !p.inStock).length;

    // Filter products based on stockFilter
    const filteredProducts = products.filter((p) => {
        if (stockFilter === 'inStock') return p.inStock;
        if (stockFilter === 'outOfStock') return !p.inStock;
        return true; // 'all'
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* Back Navigation */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Link
                        to="/"
                        className="inline-flex items-center space-x-2 text-gray-600 hover:text-emerald-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Marketplace</span>
                    </Link>
                </div>
            </div>

            {/* Profile Banner Section */}
            <div className="relative">
                {/* Banner Image */}
                <div className="relative h-48 md:h-64 bg-gradient-to-r from-emerald-600 to-emerald-700 overflow-hidden">
                    {vendor?.bannerImage ? (
                        <img
                            src={vendor.bannerImage}
                            alt="Store Banner"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-700" />
                    )}

                    {/* Banner Upload Button */}
                    <label className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg cursor-pointer transition-colors">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleBannerUpload}
                            className="hidden"
                            disabled={uploadingBanner}
                        />
                        {uploadingBanner ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Camera className="w-5 h-5" />
                        )}
                    </label>
                </div>

                {/* Profile Picture & Info - CENTERED */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative -mt-16 sm:-mt-20 flex flex-col items-center pb-4">
                        {/* Profile Picture */}
                        <div className="relative">
                            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white bg-emerald-100 overflow-hidden shadow-lg">
                                {vendor?.profileImage ? (
                                    <img
                                        src={vendor.profileImage}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Store className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-600" />
                                    </div>
                                )}
                            </div>

                            {/* Profile Picture Upload Button */}
                            <label className="absolute bottom-1 right-1 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full cursor-pointer transition-colors shadow-md">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProfileUpload}
                                    className="hidden"
                                    disabled={uploadingProfile}
                                />
                                {uploadingProfile ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Camera className="w-4 h-4" />
                                )}
                            </label>
                        </div>

                        {/* Store Info - Centered */}
                        <div className="mt-4 text-center">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                {vendor?.businessName || "Your Store"}
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">{vendor?.email}</p>
                            {vendor?.description && (
                                <p className="text-gray-600 mt-2 text-sm max-w-xl mx-auto">
                                    {vendor.description}
                                </p>
                            )}
                        </div>

                        {/* Action Buttons - Contact, Catalog, Share */}
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                            {/* Contact Button */}
                            <a
                                href={vendor?.whatsappNumber ? getWhatsAppLink(vendor.whatsappNumber) : "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center gap-2 bg-white text-emerald-600 hover:bg-emerald-50 px-6 py-3 rounded-xl transition-colors min-w-[100px] shadow-lg"
                            >
                                <Phone className="w-5 h-5" />
                                <span className="text-sm font-medium">Contact</span>
                            </a>

                            {/* Catalog Button */}
                            <button
                                onClick={scrollToProducts}
                                className="flex flex-col items-center gap-2 bg-white text-emerald-600 hover:bg-emerald-50 px-6 py-3 rounded-xl transition-colors min-w-[100px] shadow-lg"
                            >
                                <Grid3X3 className="w-5 h-5" />
                                <span className="text-sm font-medium">Catalog</span>
                            </button>

                            {/* Share Button */}
                            <button
                                onClick={handleShareStore}
                                className="flex flex-col items-center gap-2 bg-white text-emerald-600 hover:bg-emerald-50 px-6 py-3 rounded-xl transition-colors min-w-[100px] shadow-lg"
                            >
                                <Share2 className="w-5 h-5" />
                                <span className="text-sm font-medium">
                                    {copiedStoreLink ? "Copied!" : "Share"}
                                </span>
                            </button>
                        </div>

                        {/* Admin Actions */}
                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={handleOpenProfileForm}
                                className="inline-flex items-center px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors text-sm font-medium"
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit Profile
                            </button>

                            {/* Get Verified Button - Coming Soon */}
                            {!vendor?.isVerified && (
                                <div className="relative inline-flex items-center ml-3">
                                    <button
                                        disabled
                                        className="inline-flex items-center px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed opacity-60 text-sm font-medium"
                                    >
                                        <ShieldCheck className="w-4 h-4 mr-2" />
                                        Get Verified
                                    </button>
                                    <span className="absolute -top-2 -right-3 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                                        Coming Soon
                                    </span>
                                </div>
                            )}
                            {vendor?.isVerified && (
                                <span className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium ml-3">
                                    <ShieldCheck className="w-4 h-4 mr-2" />
                                    Verified ✓
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <main id="products-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards - Clickable Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Total Products Card */}
                    <button
                        onClick={() => setStockFilter('all')}
                        className={`bg-white rounded-lg shadow-sm border-2 p-6 text-left transition-all hover:shadow-md ${stockFilter === 'all'
                            ? 'border-emerald-500 ring-2 ring-emerald-200'
                            : 'border-gray-200 hover:border-emerald-300'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Package className={`w-8 h-8 ${stockFilter === 'all' ? 'text-emerald-600' : 'text-emerald-500'}`} />
                            <span className="text-2xl font-bold text-gray-900">
                                {totalProducts}
                            </span>
                        </div>
                        <p className={`font-medium ${stockFilter === 'all' ? 'text-emerald-600' : 'text-gray-600'}`}>
                            Total Products {stockFilter === 'all' && '✓'}
                        </p>
                    </button>

                    {/* In Stock Card */}
                    <button
                        onClick={() => setStockFilter('inStock')}
                        className={`bg-white rounded-lg shadow-sm border-2 p-6 text-left transition-all hover:shadow-md ${stockFilter === 'inStock'
                            ? 'border-green-500 ring-2 ring-green-200'
                            : 'border-gray-200 hover:border-green-300'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className={`w-8 h-8 ${stockFilter === 'inStock' ? 'text-green-600' : 'text-green-500'}`} />
                            <span className="text-2xl font-bold text-gray-900">
                                {inStockCount}
                            </span>
                        </div>
                        <p className={`font-medium ${stockFilter === 'inStock' ? 'text-green-600' : 'text-gray-600'}`}>
                            In Stock {stockFilter === 'inStock' && '✓'}
                        </p>
                    </button>

                    {/* Out of Stock Card */}
                    <button
                        onClick={() => setStockFilter('outOfStock')}
                        className={`bg-white rounded-lg shadow-sm border-2 p-6 text-left transition-all hover:shadow-md ${stockFilter === 'outOfStock'
                            ? 'border-red-500 ring-2 ring-red-200'
                            : 'border-gray-200 hover:border-red-300'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className={`w-8 h-8 ${stockFilter === 'outOfStock' ? 'text-red-600' : 'text-red-500'}`} />
                            <span className="text-2xl font-bold text-gray-900">
                                {outOfStockCount}
                            </span>
                        </div>
                        <p className={`font-medium ${stockFilter === 'outOfStock' ? 'text-red-600' : 'text-gray-600'}`}>
                            Out of Stock {stockFilter === 'outOfStock' && '✓'}
                        </p>
                    </button>
                </div>

                {/* Top Visits Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex items-center space-x-2 mb-4">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <h3 className="font-bold text-gray-900">Top Visits</h3>
                    </div>
                    {topReferrers.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No store visits recorded yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {topReferrers.map((item) => (
                                <div key={item.vendorId} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-lg">
                                            {item.rank === 1 && "🥇"}
                                            {item.rank === 2 && "🥈"}
                                            {item.rank === 3 && "🥉"}
                                        </span>
                                        <span className="font-medium text-gray-900">{item.vendorName}</span>
                                    </div>
                                    <span className="text-gray-600 text-sm">{item.count} visits</span>
                                </div>
                            ))}
                            {/* Vendor's own rank as 4th row */}
                            {myRankData && (
                                <div className="flex items-center justify-between bg-amber-50 -mx-6 px-6 py-3 border-t border-amber-200">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-lg font-medium text-gray-700 w-6 text-center">{myRankData.rank}</span>
                                        <span className="font-medium text-gray-900">{myRankData.vendorName}</span>
                                    </div>
                                    <span className="text-gray-600 text-sm">{myRankData.count} visits</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Add Product Button and View Toggle */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Your Products</h2>
                    <div className="flex items-center space-x-3">
                        {/* View Toggle */}
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-colors ${viewMode === 'grid'
                                    ? 'bg-white shadow-sm text-emerald-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                title="Grid view"
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-colors ${viewMode === 'list'
                                    ? 'bg-white shadow-sm text-emerald-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                title="List view"
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>

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
                    </div>
                </div>

                {/* Bulk Action Bar */}
                {products.length > 0 && (
                    <div className="mb-4 bg-gray-50 rounded-lg border border-gray-200 p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            {/* Select All Checkbox */}
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedProducts.size === products.length && products.length > 0}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    Select All
                                </span>
                            </label>

                            {/* Selection Count */}
                            {selectedProducts.size > 0 && (
                                <span className="text-sm text-gray-500">
                                    {selectedProducts.size} of {products.length} selected
                                </span>
                            )}
                        </div>

                        {/* Bulk Actions */}
                        {selectedProducts.size > 0 && (
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleBulkToggleStock(true)}
                                    className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                                >
                                    Mark In Stock
                                </button>
                                <button
                                    onClick={() => handleBulkToggleStock(false)}
                                    className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
                                >
                                    Mark Out of Stock
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                                >
                                    Delete Selected
                                </button>
                                <button
                                    onClick={clearSelection}
                                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>
                )}

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
                                vendorName={vendor?.businessName}
                                whatsappNumber={vendor?.whatsappNumber}
                            />
                        </div>
                    </div>
                )}

                {/* Products Grid */}
                {filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {stockFilter === 'all' ? 'No products yet' : `No ${stockFilter === 'inStock' ? 'in-stock' : 'out-of-stock'} products`}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {stockFilter === 'all'
                                ? 'Start selling by adding your first product'
                                : 'Click "Total Products" above to view all products'}
                        </p>
                        {stockFilter === 'all' ? (
                            <button
                                onClick={() => {
                                    setEditingProduct(null);
                                    setShowForm(true);
                                }}
                                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center space-x-2 font-medium"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Add Your First Product</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => setStockFilter('all')}
                                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center space-x-2 font-medium"
                            >
                                <span>View All Products</span>
                            </button>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    /* Grid View */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className={`bg-white rounded-lg shadow-sm border-2 overflow-hidden transition-colors ${selectedProducts.has(product.id)
                                    ? 'border-emerald-500 ring-2 ring-emerald-200'
                                    : 'border-gray-200'
                                    }`}
                            >
                                {/* Product Image */}
                                <div className="relative aspect-square overflow-hidden bg-gray-100">
                                    {/* Selection Checkbox */}
                                    <label className="absolute top-2 left-2 z-10 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts.has(product.id)}
                                            onChange={() => toggleProductSelection(product.id)}
                                            className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 bg-white shadow-sm"
                                        />
                                    </label>
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                    {!product.inStock && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                            <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
                                                Out of Stock
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-600">
                                        {product.category}
                                    </div>
                                </div>

                                {/* Product Info */}
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                                        {product.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                        {product.description}
                                    </p>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xl font-bold text-gray-900">
                                            ₦{formatPrice(product.price)}
                                        </span>
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.inStock
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                                }`}
                                        >
                                            {product.inStock ? "In Stock" : "Out of Stock"}
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2 text-sm font-medium"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleCopyLink(product.id)}
                                            className={`p-2 rounded-lg transition-colors ${copiedProductId === product.id
                                                ? "bg-green-100 text-green-600"
                                                : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                                }`}
                                            title={copiedProductId === product.id ? "Copied!" : "Copy product link"}
                                        >
                                            {copiedProductId === product.id ? (
                                                <Check className="w-5 h-5" />
                                            ) : (
                                                <LinkIcon className="w-5 h-5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors"
                                            title="Delete product"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* List View */
                    <div className="space-y-3">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className={`bg-white rounded-lg shadow-sm border-2 p-4 flex items-center gap-4 transition-colors ${selectedProducts.has(product.id)
                                    ? 'border-emerald-500 ring-2 ring-emerald-200'
                                    : 'border-gray-200'
                                    }`}
                            >
                                {/* Selection Checkbox */}
                                <input
                                    type="checkbox"
                                    checked={selectedProducts.has(product.id)}
                                    onChange={() => toggleProductSelection(product.id)}
                                    className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 flex-shrink-0"
                                />

                                {/* Product Image */}
                                <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                    {!product.inStock && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                            <span className="text-white text-xs font-semibold">OOS</span>
                                        </div>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate">
                                                {product.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 truncate">
                                                {product.category}
                                            </p>
                                        </div>
                                        <span className="text-lg font-bold text-gray-900 flex-shrink-0">
                                            ₦{formatPrice(product.price)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.inStock
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                                }`}
                                        >
                                            {product.inStock ? "In Stock" : "Out of Stock"}
                                        </span>

                                        {/* Action Buttons */}
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="bg-emerald-600 text-white py-1.5 px-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-1 text-sm font-medium"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleCopyLink(product.id)}
                                                className={`p-1.5 rounded-lg transition-colors ${copiedProductId === product.id
                                                    ? "bg-green-100 text-green-600"
                                                    : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                                    }`}
                                                title={copiedProductId === product.id ? "Copied!" : "Copy link"}
                                            >
                                                {copiedProductId === product.id ? (
                                                    <Check className="w-4 h-4" />
                                                ) : (
                                                    <LinkIcon className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="bg-red-100 text-red-600 p-1.5 rounded-lg hover:bg-red-200 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Profile Edit Modal */}
                {showProfileForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                                <button
                                    onClick={() => setShowProfileForm(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Business Name
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.businessName}
                                        onChange={(e) =>
                                            setProfileForm({ ...profileForm, businessName: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Store Description
                                    </label>
                                    <textarea
                                        value={profileForm.description}
                                        onChange={(e) =>
                                            setProfileForm({ ...profileForm, description: e.target.value })
                                        }
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Tell customers about your store..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        WhatsApp Number
                                    </label>
                                    <div className="flex w-full">
                                        <span className="inline-flex items-center px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600 font-medium text-sm flex-shrink-0">
                                            +234
                                        </span>
                                        <input
                                            type="tel"
                                            value={profileForm.whatsappNumber}
                                            onChange={(e) => {
                                                let value = e.target.value.replace(/\D/g, '');
                                                if (value.startsWith('0')) {
                                                    value = value.substring(1);
                                                }
                                                if (value.length <= 10) {
                                                    setProfileForm({ ...profileForm, whatsappNumber: value });
                                                }
                                            }}
                                            maxLength={10}
                                            placeholder="8012345678"
                                            className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowProfileForm(false)}
                                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>

            {/* Verification Request Modal */}
            {showVerificationModal && vendor && (
                <VerificationRequestModal
                    vendorId={vendor.id}
                    vendorName={vendor.businessName}
                    vendorEmail={vendor.email}
                    onClose={() => setShowVerificationModal(false)}
                    onSuccess={() => {
                        setShowVerificationModal(false);
                        setHasPendingVerification(true);
                    }}
                />
            )}

            {/* Vendor Hub Welcome Popup */}
            {showVendorHubPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-xl">
                        <div className="text-5xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            You're In!
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Welcome to the LAUTECH Market vendor family!<br /><br />
                            Join our WhatsApp community to connect with other vendors,
                            get selling tips, and receive important updates.
                        </p>
                        <div className="flex flex-col space-y-3">
                            <a
                                href="https://chat.whatsapp.com/J8tSxuYVX5ZJKy8WESiE6T"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => {
                                    localStorage.setItem('vendorHubJoined', 'true');
                                    setShowVendorHubPopup(false);
                                }}
                                className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center justify-center space-x-2"
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span>Join Vendor Hub</span>
                                <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                                onClick={() => {
                                    localStorage.setItem('vendorHubDismissedAt', Date.now().toString());
                                    setShowVendorHubPopup(false);
                                }}
                                className="w-full text-gray-500 hover:text-gray-700 py-2 transition-colors"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
