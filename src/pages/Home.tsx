import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { FilterSidebar } from "../components/FilterSidebar";
import { ProductCard } from "../components/ProductCard";
import { Product, FilterOptions } from "../types";
import { getAllProducts } from "../services/products";

export function Home() {
  const { category } = useParams<{ category?: string }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500 });

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    priceRange: { min: 0, max: 500 },
  });

  // ✅ Fetch from Firestore instead of JSONBin/local storage
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      try {
        const data = await getAllProducts(); // <-- Firestore call
        console.log("🔥 Firestore products:", data);

        setProducts(data);

        // Build filters dynamically
        const categories = [...new Set(data.map((p) => p.category))];
        const prices = data.map((p) => p.price);
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
        console.error("❌ Firestore Load Error:", err);
      }

      setLoading(false);
    };

    fetchProducts();
  }, []);

  // If URL has /category/x — preselect category filter
  useEffect(() => {
    if (category) {
      setSelectedCategories([
        category.charAt(0).toUpperCase() + category.slice(1),
      ]);
    }
  }, [category]);

  // Apply all filters
  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
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

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategories, priceRange]);

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

  // Loading Spinner
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {category
                ? `${
                    category.charAt(0).toUpperCase() + category.slice(1)
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
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
