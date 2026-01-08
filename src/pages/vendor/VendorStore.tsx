/**
 * VendorStore Page
 * 
 * Public page displaying a vendor's profile and all their products.
 * Users can browse products, view vendor info, and contact via WhatsApp.
 * 
 * Route: /store/:vendorId
 */

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    Store,
    Package,
    MessageCircle,
    ArrowLeft,
    Phone,
    Share2,
    Grid3X3,
} from "lucide-react";
import { VerifiedBadge } from "../../components/VerifiedBadge";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { ProductCard } from "../../components/ProductCard";
import { Product, Vendor } from "../../types";
import { getVendorProducts } from "../../services/products";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { trackStoreVisit } from "../../services/vendorVisits";

/**
 * Fetch vendor data from Firestore by ID
 */
const getVendorById = async (vendorId: string): Promise<Vendor | null> => {
    try {
        const vendorDoc = await getDoc(doc(db, "vendors", vendorId));
        if (vendorDoc.exists()) {
            const data = vendorDoc.data();
            return {
                id: vendorDoc.id,
                name: data.name,
                email: data.email,
                password: "",
                whatsappNumber: data.whatsappNumber,
                businessName: data.businessName,
                description: data.description || "",
                storeAddress: data.storeAddress || "",
                bannerImage: data.bannerImage,
                profileImage: data.profileImage,
                isVerified: data.isVerified || false,
                createdAt: data.createdAt?.toDate() || new Date(),
            } as Vendor;
        }
    } catch (error) {
        console.error("Error fetching vendor:", error);
    }
    return null;
};


export function VendorStore() {
    // Get vendor ID from URL params
    const { vendorId } = useParams<{ vendorId: string }>();

    // Component state
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedLink, setCopiedLink] = useState(false);

    // Fetch vendor and products on mount
    useEffect(() => {
        const loadVendorData = async () => {
            if (!vendorId) {
                setError("Vendor not found");
                setLoading(false);
                return;
            }

            try {
                // Fetch vendor details
                const vendorData = await getVendorById(vendorId);

                if (!vendorData) {
                    setError("Vendor not found");
                    setLoading(false);
                    return;
                }

                setVendor(vendorData);

                // Fetch vendor's products
                const vendorProducts = await getVendorProducts(vendorId);
                setProducts(vendorProducts);

            } catch (err) {
                console.error("Error loading vendor data:", err);
                setError("Failed to load vendor information");
            } finally {
                setLoading(false);
            }
        };

        loadVendorData();

        // Track external visits (for leaderboard)
        const trackVisit = async () => {
            if (!vendorId) return;

            // Check if visit is from external source
            const referrer = document.referrer;
            const currentHost = window.location.hostname;
            const isExternal = !referrer || !referrer.includes(currentHost);

            console.log('[Visit Tracking] referrer:', referrer);
            console.log('[Visit Tracking] currentHost:', currentHost);
            console.log('[Visit Tracking] isExternal:', isExternal);
            console.log('[Visit Tracking] vendorId:', vendorId);

            if (isExternal) {
                console.log('[Visit Tracking] Calling API...');
                const result = await trackStoreVisit(vendorId, true);
                console.log('[Visit Tracking] API result:', result);
            } else {
                console.log('[Visit Tracking] Skipped - internal visit');
            }
        };

        trackVisit();
    }, [vendorId]);

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
        const storeUrl = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `${vendor?.businessName} - LAUTECH Market`,
                    text: `Check out ${vendor?.businessName} on LAUTECH Market!`,
                    url: storeUrl,
                });
            } else {
                await navigator.clipboard.writeText(storeUrl);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
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
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        }
    };

    // Loading state
    if (loading) {
        return (
            <>
                <Header />
                <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading store...</p>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    // Error state
    if (error || !vendor) {
        return (
            <>
                <Header />
                <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Store Not Found
                        </h1>
                        <p className="text-gray-600 mb-6">
                            {error || "This vendor store doesn't exist."}
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back to Home</span>
                        </Link>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />

            <main className="min-h-screen bg-gray-50">
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

                {/* Vendor Profile Header */}
                <div className="bg-white pb-8 shadow-sm">
                    {/* Banner Section */}
                    <div className="h-48 md:h-64 w-full relative bg-gray-200">
                        {vendor.bannerImage ? (
                            <img
                                src={vendor.bannerImage}
                                alt="Store Banner"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-emerald-600 to-emerald-800" />
                        )}
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Centered Profile */}
                        <div className="relative -mt-16 sm:-mt-20 flex flex-col items-center text-center">
                            {/* Profile Picture */}
                            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden mb-4 relative z-10">
                                {vendor.profileImage ? (
                                    <img
                                        src={vendor.profileImage}
                                        alt={vendor.businessName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                        <Store className="w-12 h-12 text-emerald-600" />
                                    </div>
                                )}
                            </div>

                            {/* Store Name */}
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                                {vendor.businessName}
                                {vendor.isVerified && <VerifiedBadge size="lg" />}
                            </h1>

                            {/* Description */}
                            {vendor.description && (
                                <p className="text-gray-600 text-lg mb-4 max-w-2xl">
                                    {vendor.description}
                                </p>
                            )}

                            {/* Product Count */}
                            <div className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                                <Package className="w-4 h-4 mr-2" />
                                <span>{products.length} Products Available</span>
                            </div>

                            {/* Action Buttons - Contact, Catalog, Share */}
                            <div className="flex items-center justify-center gap-4">
                                {/* Contact Button */}
                                <a
                                    href={getWhatsAppLink(vendor.whatsappNumber)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center gap-2 bg-white text-emerald-600 hover:bg-emerald-50 px-6 py-3 rounded-xl transition-colors min-w-[100px] shadow-lg border border-gray-100"
                                >
                                    <Phone className="w-5 h-5" />
                                    <span className="text-sm font-medium">Contact</span>
                                </a>

                                {/* Catalog Button */}
                                <button
                                    onClick={scrollToProducts}
                                    className="flex flex-col items-center gap-2 bg-white text-emerald-600 hover:bg-emerald-50 px-6 py-3 rounded-xl transition-colors min-w-[100px] shadow-lg border border-gray-100"
                                >
                                    <Grid3X3 className="w-5 h-5" />
                                    <span className="text-sm font-medium">Catalog</span>
                                </button>

                                {/* Share Button */}
                                <button
                                    onClick={handleShareStore}
                                    className="flex flex-col items-center gap-2 bg-white text-emerald-600 hover:bg-emerald-50 px-6 py-3 rounded-xl transition-colors min-w-[100px] shadow-lg border border-gray-100"
                                >
                                    <Share2 className="w-5 h-5" />
                                    <span className="text-sm font-medium">
                                        {copiedLink ? "Copied!" : "Share"}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Section */}
                <div id="products-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Products from {vendor.businessName}
                        </h2>
                        <span className="text-gray-500">
                            {products.length} {products.length === 1 ? "product" : "products"}
                        </span>
                    </div>

                    {/* Products Grid */}
                    {products.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No Products Yet
                            </h3>
                            <p className="text-gray-500">
                                This vendor hasn't listed any products yet. Check back later!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}
