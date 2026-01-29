import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { FilterSidebar } from "../components/FilterSidebar";
import { ProductCard } from "../components/ProductCard";
import { AnnouncementCarousel } from "../components/AnnouncementCarousel";
import { Product, Vendor, FilterOptions } from "../types";
import { getAllProducts } from "../services/products";
import { getAllVendors } from "../services/vendorAuth";
import { Store } from "lucide-react";
import { VerifiedBadge } from "../components/VerifiedBadge";

export function Home() {
  const { category } = useParams<{ category?: string }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500 });

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    priceRange: { min: 0, max: 500 },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch products and vendors in parallel
        const [productsData, vendorsData] = await Promise.all([
          getAllProducts(),
          getAllVendors(),
        ]);

        console.log(" Firestore products:", productsData);
        setProducts(productsData);
        setVendors(vendorsData);

        const categories = [...new Set(productsData.map((p) => p.category))];
        const prices = productsData.map((p) => p.price);
        const minPrice = Math.floor(Math.min(...prices));
        const maxPrice = Math.ceil(Math.max(...prices));

        setFilterOptions({
          categories,
          priceRange: { min: minPrice, max: maxPrice },
        });

        setPriceRange({
          min: minPrice,
          max: maxPrice,
        });
      } catch (err) {
        console.error(" Firestore Load Error:", err);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (category) {
      setSelectedCategories([
        category.charAt(0).toUpperCase() + category.slice(1),
      ]);
    }
  }, [category]);

  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.vendorName && p.vendorName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) =>
        selectedCategories.includes(p.category)
      );
    }

    filtered = filtered.filter(
      (p) => p.price >= priceRange.min && p.price <= priceRange.max
    );

    // Sort: In-stock first, then by newest/recently updated
    const sorted = [...filtered].sort((a, b) => {
      // 1. In stock status (true first)
      if (a.inStock && !b.inStock) return -1;
      if (!a.inStock && b.inStock) return 1;

      // 2. Recently updated or created (newest first)
      const timeA = (a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0) || (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
      const timeB = (b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0) || (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);

      return timeB - timeA;
    });

    setFilteredProducts(sorted);
  }, [products, searchQuery, selectedCategories, priceRange]);

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

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setPriceRange(filterOptions.priceRange);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          onSearch={setSearchQuery}
          categories={filterOptions.categories}
        />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onSearch={setSearchQuery} categories={filterOptions.categories} />

      <main className="flex-1 w-full">
        <div className="w-full bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FilterSidebar
              filters={filterOptions}
              selectedCategories={selectedCategories}
              priceRange={priceRange}
              onCategoryChange={handleCategoryChange}
              onPriceChange={setPriceRange}
              onClearFilters={handleClearFilters}
            />
          </div>
        </div>

        {/* Announcement & Disclaimer Carousel - Single Box */}
        <section className="py-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <AnnouncementCarousel />
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Matching Vendors Section (only shows when searching) */}
          {filteredVendors.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Matching Vendors ({filteredVendors.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {filteredVendors.map((vendor) => (
                  <Link
                    key={vendor.id}
                    to={`/store/${vendor.id}`}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-emerald-300 transition-all"
                  >
                    <div className="flex flex-col items-center text-center">
                      {vendor.profileImage ? (
                        <img
                          src={vendor.profileImage}
                          alt={vendor.businessName}
                          className="w-12 h-12 rounded-full object-cover mb-2"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                          <Store className="w-6 h-6 text-emerald-600" />
                        </div>
                      )}
                      <p className="font-medium text-gray-900 text-sm truncate w-full flex items-center justify-center gap-1">
                        {vendor.businessName}
                        {vendor.isVerified && <VerifiedBadge size="sm" />}
                      </p>
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

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">
                No products found matching your criteria.
              </p>
              <button
                onClick={handleClearFilters}
                className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const productVendor = vendors.find(v => v.id === product.vendorId);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isVendorVerified={productVendor?.isVerified || false}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
