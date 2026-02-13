import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ProductCard } from "../components/ProductCard";
import { AnnouncementCarousel } from "../components/AnnouncementCarousel";
import { CuratedCarousel } from "../components/CuratedCarousel";
import { Product, Vendor, FilterOptions } from "../types";
import { getAllProducts } from "../services/products";
import { normalizeVendorData } from "../services/vendorAuth";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { fetchBuckets, fetchCategories, Bucket, Category } from "../services/categories";
import { Store, Info } from "lucide-react";
import { SEO } from "../components/SEO";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { rankProducts, getSpellingCorrection } from "../services/ranking";
import { getRecommendations } from "../services/recommendations";
import { logSearch, logEvent } from "../services/analytics";
import { getProxiedImageUrl } from "../utils/imageUrl";
import { CompareModal } from "../components/CompareModal";
import { CompareFloatingBar } from "../components/CompareFloatingBar";
import { LoadingScreen } from "../components/LoadingScreen";

export function Home() {
  const { category } = useParams<{ category?: string }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBuckets, setSelectedBuckets] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500 });
  const [didYouMean, setDidYouMean] = useState<string | null>(null);

  // Comparison State
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const [filterOptions, setFilterOptions] = useState<FilterOptions & { buckets: string[] }>({
    categories: [],
    buckets: [],
    priceRange: { min: 0, max: 500 },
    instantBuy: false
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch products, vendors, and buckets with individual error handling to be resilient
        const productsPromise = getAllProducts().catch(err => {
          console.error("Failed to fetch products:", err);
          return [] as Product[];
        });
        const bucketsPromise = fetchBuckets().catch(err => {
          console.error("Failed to fetch buckets:", err);
          return [] as Bucket[];
        });

        const [productsData, bucketsData, categoriesData] = await Promise.all([
          productsPromise,
          bucketsPromise,
          fetchCategories().catch(() => [])
        ]);

        console.log(" Firestore products fetched:", productsData.length);

        // Data Normalization: Ensure every product has a bucketId.
        // If missing, default to the "Products" bucket ID.
        const defaultBucket = bucketsData.find(b => b.name.toLowerCase().includes("product"));
        const normalizedProducts = productsData.map(p => ({
          ...p,
          bucketId: p.bucketId || defaultBucket?.id || ""
        }));

        setProducts(normalizedProducts);
        setBuckets(bucketsData);
        setCategoriesList(categoriesData);

        // Set AI recommendations
        if (normalizedProducts.length > 0) {
          const recs = getRecommendations(normalizedProducts);
          setRecommendations(recs);
        }

        // Update counts in filterOptions for categories that already exist in products
        const categoryNames = [...new Set(normalizedProducts.map((p) => p.category))];

        const validPriceProducts = (productsData || []).filter(p => typeof p.price === 'number' && !isNaN(p.price));
        const prices = validPriceProducts.length > 0 ? validPriceProducts.map((p) => p.price) : [0];

        const minPrice = isFinite(Math.min(...prices)) ? Math.floor(Math.min(...prices)) : 0;
        const maxProductPrice = isFinite(Math.max(...prices)) ? Math.ceil(Math.max(...prices)) : 0;
        const displayMax = Math.max(maxProductPrice, 10000); // Allow headroom for new high-price items

        setFilterOptions({
          categories: categoryNames,
          buckets: bucketsData.map(b => b.name),
          priceRange: { min: minPrice, max: displayMax },
        });

        // Only update priceRange if it hasn't been manually moved by the user yet
        // or if we are doing the initial load
        setPriceRange({
          min: minPrice,
          max: displayMax,
        });
      } catch (err) {
        console.error(" Firestore Load Error:", err);
        // Fallback to a much larger range to be safe
        setFilterOptions(prev => ({ ...prev, priceRange: { min: 0, max: 1000000 } }));
        setPriceRange({ min: 0, max: 1000000 });
      }

      setLoading(false);
    };

    fetchData();
  }, [category]); // Refetch when navigating between categories/home

  // Real-time Vendor Listener to capture Online Status updates instantly
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "vendors"), (snapshot) => {
      const vendorsData = snapshot.docs.map(doc => normalizeVendorData(doc));
      console.log("[Home] Real-time vendors updated:", vendorsData.length);
      setVendors(vendorsData);
    }, (error) => {
      console.error("[Home] Error in real-time vendor listener:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (category) {
      // Normalize category from URL
      setSelectedCategories([
        category.charAt(0).toUpperCase() + category.slice(1).toLowerCase(),
      ]);
    }

    // Log category view for analytics
    if (category) {
      logEvent("category_view", {
        category: category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
      });
    }
  }, [category]);



  // Apply filters (Categories, Buckets, Price, Instant Buy)
  useEffect(() => {
    let filtered = products;

    // Apply Instant Buy filter
    if (filterOptions.instantBuy) {
      filtered = filtered.filter((p) => {
        const vendor = vendors.find((v) => v.id === p.vendorId);
        if (!vendor) return false;

        // Criteria: In Stock AND (Fast Response OR Active Now OR Verified)
        // Relaxed constraint: If metrics are missing, we give benefit of doubt (assume fast) to encourage new vendors
        const responseTime = vendor.metrics?.averageResponseMinutes;
        // Default to TRUE if metrics are missing (new vendor logic)
        const isFast = responseTime !== undefined ? responseTime < 30 : true;
        const isActive = vendor.isActiveNow || false;

        return p.inStock && (isFast || isActive);
      });
    }

    // Apply existing filters with normalization...
    if (selectedBuckets.length > 0) {
      const normalizedSelectedBuckets = selectedBuckets.map(b => b.toLowerCase().trim());
      filtered = filtered.filter((p) => {
        if (!p.bucketId) return false;
        const pBucketId = p.bucketId.toLowerCase().trim();
        // Check for ID match OR name match (in case some products have names)
        const bucket = buckets.find(bucket => bucket.id === p.bucketId || bucket.name.toLowerCase() === pBucketId);
        const bucketMatch = normalizedSelectedBuckets.includes(pBucketId) ||
          (bucket && normalizedSelectedBuckets.includes(bucket.id.toLowerCase()));
        return bucketMatch;
      });
    }

    if (selectedCategories.length > 0) {
      const normalizedSelectedCats = selectedCategories.map(c => c.toLowerCase().replace(/&amp;/g, '&').trim());
      filtered = filtered.filter((p) => {
        if (!p.category) return false;
        const pCat = p.category.toLowerCase().replace(/&amp;/g, '&').trim();
        return normalizedSelectedCats.includes(pCat);
      });
    }

    // Price filter
    filtered = filtered.filter(
      (p) => {
        const price = Number(p.price);
        if (isNaN(price)) return true;
        // Ensure priceRange bounds are valid
        const min = priceRange.min || 0;
        const max = priceRange.max || Infinity;
        return price >= min && price <= max;
      }
    );

    // Debugging: Log if a specific product is being filtered out
    // if (products.length > 0 && filtered.length === 0) {
    //   console.log("All products filtered out. Active filters:", {
    //     selectedBuckets,
    //     selectedCategories,
    //     priceRange,
    //     instantBuy: filterOptions.instantBuy
    //   });
    // }

    // Rank/Sort
    let sorted: Product[];
    if (searchQuery.trim()) {
      sorted = rankProducts(filtered, searchQuery);
    } else {
      // Smart Default Sort: In-Stock > High Trust/Fast Response > Newest
      sorted = [...filtered].sort((a, b) => {
        // 0. INSTANT BUY PRIORITY (Urgent Needs First)
        if (filterOptions.instantBuy) {
          const urgentBuckets = ["Hostel & Student Essentials", "Campus Services"];
          const bucketObjA = buckets.find(bucket => bucket.id === a.bucketId);
          const bucketObjB = buckets.find(bucket => bucket.id === b.bucketId);

          const aName = bucketObjA?.name || "";
          const bName = bucketObjB?.name || "";

          const isUrgentA = urgentBuckets.includes(aName);
          const isUrgentB = urgentBuckets.includes(bName);

          if (isUrgentA && !isUrgentB) return -1;
          if (!isUrgentA && isUrgentB) return 1;
        }

        // 1. In stock status (true first)
        if (a.inStock && !b.inStock) return -1;
        if (!a.inStock && b.inStock) return 1;

        // 2. Vendor Quality/Trust (Smart Sort)
        const vendorA = vendors.find(v => v.id === a.vendorId);
        const vendorB = vendors.find(v => v.id === b.vendorId);

        const scoreA = (vendorA?.isActiveNow ? 20 : 0) +
          ((vendorA?.metrics?.averageResponseMinutes || 999) < 60 ? 30 : 0) +
          ((vendorA?.metrics?.trustScore || 0) > 80 ? 20 : 0);

        const scoreB = (vendorB?.isActiveNow ? 20 : 0) +
          ((vendorB?.metrics?.averageResponseMinutes || 999) < 60 ? 30 : 0) +
          ((vendorB?.metrics?.trustScore || 0) > 80 ? 20 : 0);

        if (scoreA !== scoreB) return scoreB - scoreA; // Higher score first

        // 3. Recently updated or created (newest first)
        const getTime = (p: Product) => {
          const date = p.updatedAt || p.createdAt;
          if (!date) return 0;
          if (date instanceof Date) return date.getTime();
          if ((date as any).toDate) return (date as any).toDate().getTime();
          return new Date(date as any).getTime() || 0;
        };

        return getTime(b) - getTime(a);
      });
    }
    setFilteredProducts(sorted);

    // Spelling Correction logic
    if (searchQuery.trim().length > 2) {
      const dictionary = [
        ...new Set([
          ...products.map(p => p.name),
          ...products.map(p => p.category),
          ...vendors.map(v => v.businessName),
          "Electronics", "Fashion", "Hostels", "Groceries", "Smartphones", "Laptops"
        ])
      ];

      const correction = getSpellingCorrection(searchQuery, dictionary);
      if (correction && correction.toLowerCase() !== searchQuery.toLowerCase()) {
        setDidYouMean(correction);
      } else {
        setDidYouMean(null);
      }
    } else {
      setDidYouMean(null);
    }
  }, [products, vendors, searchQuery, selectedCategories, selectedBuckets, priceRange, filterOptions.instantBuy, buckets]);

  // Filter vendors based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = vendors.filter(
        (v) =>
          v.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredVendors(filtered);
    } else {
      setFilteredVendors([]);
    }
  }, [vendors, searchQuery]);

  // Debounced search logging with result counts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        const totalResults = filteredProducts.length + filteredVendors.length;
        logSearch(searchQuery, totalResults);
      }
    }, 1000); // 1s delay to prioritize UI responsiveness

    return () => clearTimeout(timer);
  }, [searchQuery, filteredProducts.length, filteredVendors.length]);

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedBuckets([]);
    setPriceRange(filterOptions.priceRange);
    setFilterOptions(prev => ({ ...prev, instantBuy: false }));
  };
  const handleToggleCompare = (product: Product) => {
    setCompareList(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      if (prev.length >= 3) {
        alert("You can compare up to 3 products at a time.");
        return prev;
      }
      // Log comparison intent
      logEvent("compare_click", {
        productId: product.id,
        vendorId: product.vendorId,
        category: product.category
      });
      return [...prev, product];
    });
  };

  const handleClearCompare = () => setCompareList([]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          onSearch={setSearchQuery}
          categories={filterOptions.categories}
        />
        <LoadingScreen />
      </div>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://lautechmarket.com.ng/#organization",
        "name": "LAUTECH Market",
        "url": "https://lautechmarket.com.ng",
        "logo": "https://lautechmarket.com.ng/logo_icon.png",
        "description": "The official student marketplace for LAUTECH Ogbomoso. Buy and sell electronics, fashion, and services."
      },
      {
        "@type": "WebSite",
        "@id": "https://lautechmarket.com.ng/#website",
        "url": "https://lautechmarket.com.ng",
        "name": "LAUTECH Market",
        "publisher": { "@id": "https://lautechmarket.com.ng/#organization" },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://lautechmarket.com.ng/?search={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SEO
        title={category ? `${category} Products` : "Student Marketplace Ogbomoso"}
        description="Discover verified vendors for electronics, fashion & services at LAUTECH. Buy & sell easily, anytime - 100% student-focused & free."
        schema={structuredData}
      />
      <Header onSearch={setSearchQuery} categories={filterOptions.categories} />

      <main className="flex-1 w-full relative">
        <div id="home-content-wrapper">

          {/* Announcement & Disclaimer Carousel - Single Box */}
          <section className="py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <AnnouncementCarousel />
              {/* Curated Lists Carousel */}
              <CuratedCarousel />
            </div>
          </section>

          {/* AI Recommendations Section */}
          {!searchQuery && recommendations.length > 0 && (
            <section className="bg-white border-y border-gray-100 py-12 relative overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <span className="text-emerald-600">✨</span> Recommended for You
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Based on your interests and trending items</p>
                  </div>
                </div>

                <div className="flex space-x-4 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide desktop-scrollbar-visible snap-x">
                  {recommendations.map((product) => (
                    <div key={product.id} className="min-w-[280px] max-w-[280px] snap-start">
                      <ProductCard
                        product={product}
                        isVendorVerified={vendors.find(v => v.id === product.vendorId)?.isVerified}
                        isVendorActive={vendors.find(v => v.id === product.vendorId)?.isActiveNow}
                        vendorBadges={vendors.find(v => v.id === product.vendorId)?.badges}
                        verificationLevel={vendors.find(v => v.id === product.vendorId)?.verificationLevel}
                        isStudent={vendors.find(v => v.id === product.vendorId)?.isStudent}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Spelling Correction logic */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {didYouMean && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl animate-in fade-in slide-in-from-top-1">
                <p className="text-emerald-800 dark:text-emerald-300 text-sm">
                  Showing results for <span className="italic font-bold">\"{searchQuery}\"</span>.
                  Did you mean: <button
                    onClick={() => setSearchQuery(didYouMean)}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    {didYouMean}
                  </button>?
                </p>
              </div>
            )}
          </div>

          {/* Two-Tier Filter Chips (Buckets top, Subcategories below) */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="flex flex-col gap-4">
              {/* Top Tier: Buckets */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide desktop-scrollbar-visible flex-1">
                  {buckets
                    .sort((a, b) => {
                      // 1. Manual Position (if set > 0)
                      const posA = a.manualPosition || 0;
                      const posB = b.manualPosition || 0;

                      if (posA > 0 && posB > 0) return posA - posB;
                      if (posA > 0) return -1;
                      if (posB > 0) return 1;

                      // 2. Product Count (Highest first)
                      const countA = products.filter(p => p.bucketId === a.id).length;
                      const countB = products.filter(p => p.bucketId === b.id).length;
                      return countB - countA;
                    })
                    .map(bucket => {
                      const bucketProductCount = products.filter(p => p.bucketId === bucket.id).length;
                      return (
                        <button
                          key={bucket.id}
                          onClick={() => {
                            setSelectedBuckets(prev =>
                              prev.includes(bucket.id) ? [] : [bucket.id]
                            );
                            setSelectedCategories([]); // Reset subcategories when changing bucket
                            setSearchQuery(""); // Clear search when filtering by bucket
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-2 ${selectedBuckets.includes(bucket.id) ? "bg-emerald-600 text-white border-emerald-600 shadow-md" : "bg-white text-gray-600 border-gray-100 hover:border-emerald-200"}`}
                        >
                          {bucket.name} <span className="opacity-50 ml-1">({bucketProductCount})</span>
                        </button>
                      );
                    })}
                </div>

                <div className="relative group">
                  <button
                    onClick={() => setFilterOptions(prev => ({ ...prev, instantBuy: !prev.instantBuy }))}
                    className={`ml-4 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight flex items-center gap-2 transition-all border-2 ${filterOptions.instantBuy ? "bg-emerald-50 text-emerald-700 border-emerald-500 ring-2 ring-emerald-500/20" : "bg-white text-gray-500 border-gray-100 hover:border-emerald-200"}`}
                  >
                    Instant Buy ⚡
                  </button>
                  {/* Tooltip */}
                  <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl leading-relaxed">
                    <div className="flex items-start gap-1">
                      <Info className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      <p>Shows verified vendors with stock who respond in &lt;30 mins.</p>
                    </div>
                    {/* Arrow */}
                    <div className="absolute top-full right-6 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>

              {/* Second Tier: Subcategories (Filtering within active buckets) */}
              {selectedBuckets.length > 0 && (
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide desktop-scrollbar-visible animate-in fade-in slide-in-from-left-2 duration-300">
                  {categoriesList
                    .filter(cat => selectedBuckets.includes(cat.bucketId))
                    .sort((a, b) => {
                      // 1. Manual Position (if set > 0)
                      const posA = a.manualPosition || 0;
                      const posB = b.manualPosition || 0;

                      if (posA > 0 && posB > 0) return posA - posB;
                      if (posA > 0) return -1;
                      if (posB > 0) return 1;

                      // 2. Product Count (Highest first)
                      const countA = products.filter(p => p.category === a.name).length;
                      const countB = products.filter(p => p.category === b.name).length;
                      return countB - countA;
                    })
                    .map(subCat => {
                      const catProductCount = products.filter(p => p.category === subCat.name).length;
                      return (
                        <button
                          key={subCat.id}
                          onClick={() => {
                            setSelectedCategories(prev =>
                              prev.includes(subCat.name) ? prev.filter(c => c !== subCat.name) : [...prev, subCat.name]
                            );
                            setSearchQuery(""); // Clear search when filtering by category
                          }}
                          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedCategories.includes(subCat.name) ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-white text-gray-400 border-gray-100 hover:border-emerald-200"}`}
                        >
                          {subCat.name} <span className="opacity-50 ml-1">({catProductCount})</span>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Matching Vendors Section (only shows when searching) */}
            {filteredVendors.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Matching Vendors ({filteredVendors.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {filteredVendors.map((vendor) => (
                    <Link
                      key={vendor.id}
                      to={`/store/${vendor.id}`}
                      className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600 transition-all"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full border-2 border-white dark:border-slate-900 shadow-lg overflow-hidden bg-white dark:bg-slate-800">
                          {vendor.profileImage ? (
                            <img
                              src={getProxiedImageUrl(vendor.profileImage || "") || vendor.profileImage}
                              alt={vendor.businessName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30">
                              <Store className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                            </div>
                          )}
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate w-full flex items-center justify-center gap-1">
                          {vendor.businessName}
                          {vendor.verificationLevel && vendor.verificationLevel !== 'basic' && <VerifiedBadge level={vendor.verificationLevel} size="sm" />}
                        </p>
                        {vendor.isActiveNow && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 rounded-full border border-emerald-100/50 mt-1">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-[8px] text-emerald-600 font-black uppercase tracking-tighter">Online</span>
                          </div>
                        )}
                        <p className="text-xs text-emerald-600">View Store →</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Products Section */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {category
                  ? `${category.charAt(0).toUpperCase() + category.slice(1)
                  } Products`
                  : "All Products"}
              </h1>

              <p className="text-gray-600">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "product" : "products"} found
              </p>
            </div>

            <div className="min-h-[400px]">
              {filteredProducts.length === 0 ? (
                <div key="home-empty-state" className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 animate-in fade-in duration-300">
                  <div className="max-w-xs mx-auto">
                    <p className="text-gray-400 text-lg font-medium mb-1">No products found</p>
                    <p className="text-gray-400 text-xs mb-6">Try adjusting your filters or search terms</p>
                    <button
                      onClick={handleClearFilters}
                      className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700 transition-all"
                    >
                      Reset All Filters
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500"
                >
                  {filteredProducts.map((product) => {
                    const productVendor = vendors.find(v => v.id === product.vendorId);
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        isVendorVerified={productVendor?.isVerified || false}
                        onCompare={handleToggleCompare}
                        isSelectedForCompare={compareList.some(p => p.id === product.id)}
                        isVendorActive={productVendor?.isActiveNow || false}
                        vendorBadges={productVendor?.badges || []}
                        verificationLevel={productVendor?.verificationLevel}
                        isStudent={productVendor?.isStudent}
                        searchQuery={searchQuery}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Comparison UI */}
      <CompareFloatingBar
        count={compareList.length}
        onClear={handleClearCompare}
        onCompare={() => setIsCompareModalOpen(true)}
      />

      {isCompareModalOpen && (
        <CompareModal
          products={compareList}
          vendors={vendors}
          onClose={() => setIsCompareModalOpen(false)}
          onRemove={(id) => setCompareList(prev => prev.filter(p => p.id !== id))}
        />
      )}
    </div>
  );
}
