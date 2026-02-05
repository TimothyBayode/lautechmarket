import React, { useState } from "react";
import { ChevronDown, ChevronUp, X, SlidersHorizontal, Layers, Tag } from "lucide-react";
import { FilterOptions } from "../types";

interface FilterSidebarProps {
  filters: FilterOptions & { buckets: string[] };
  selectedCategories: string[];
  selectedBuckets: string[];
  priceRange: {
    min: number;
    max: number;
  };
  onCategoryChange: (category: string) => void;
  onBucketChange: (bucket: string) => void;
  onPriceChange: (range: { min: number; max: number }) => void;
  onInstantBuyChange: (checked: boolean) => void;
  onClearFilters: () => void;
}

export function FilterSidebar({
  filters,
  selectedCategories,
  selectedBuckets,
  priceRange,
  onCategoryChange,
  onBucketChange,
  onPriceChange,
  onInstantBuyChange,
  onClearFilters,
}: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedBuckets.length > 0 ||
    priceRange.min !== filters.priceRange.min ||
    priceRange.max !== filters.priceRange.max;

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (value >= filters.priceRange.min && value <= priceRange.max) {
      onPriceChange({
        ...priceRange,
        min: value,
      });
    }
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (value >= priceRange.min && value <= filters.priceRange.max) {
      onPriceChange({
        ...priceRange,
        max: value,
      });
    }
  };

  return (
    <div className="w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer select-none"
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center space-x-3">
          <SlidersHorizontal className="w-5 h-5 text-emerald-600" />
          <span className="text-lg font-black text-gray-900 uppercase tracking-tight">Market Filters</span>
          {hasActiveFilters && (
            <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
              {selectedCategories.length + selectedBuckets.length + (priceRange.min !== filters.priceRange.min || priceRange.max !== filters.priceRange.max ? 1 : 0)} Active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {hasActiveFilters && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearFilters();
              }}
              className="text-xs font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span>Reset</span>
            </button>
          )}
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="pb-8 border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
          <div className="pt-8 grid grid-cols-1 md:grid-cols-12 gap-10">

            {/* Instant Buy Toggle */}
            <div className="md:col-span-12">
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex items-center justify-between shadow-sm">
                <div>
                  <span className="block text-sm font-bold text-emerald-900 flex items-center gap-2">
                    Instant Buy ⚡ <span className="bg-emerald-200 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">Fast</span>
                  </span>
                  <span className="block text-xs text-emerald-700 mt-0.5">Show only In Stock & Responsive vendors</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.instantBuy || false}
                    onChange={(e) => onInstantBuyChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {/* Buckets */}
            <div className="md:col-span-3">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Listing Type</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.buckets.map((bucket) => (
                  <label key={bucket} className="cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedBuckets.includes(bucket)}
                      onChange={() => onBucketChange(bucket)}
                      className="sr-only"
                    />
                    <span className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl border-2 transition-all duration-200 block ${selectedBuckets.includes(bucket)
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100"
                      : "bg-white text-gray-500 border-gray-100 hover:border-emerald-200 hover:text-emerald-600"
                      }`}>
                      {bucket}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="md:col-span-12 lg:col-span-5">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Subcategories</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.categories.map((category) => (
                  <label key={category} className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => onCategoryChange(category)}
                      className="sr-only"
                    />
                    <span className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all duration-200 block ${selectedCategories.includes(category)
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 ring-2 ring-emerald-500 ring-offset-1"
                      : "bg-gray-50 text-gray-600 border-gray-100 hover:bg-white hover:border-emerald-300"
                      }`}>
                      {category}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="md:col-span-4 lg:col-span-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Budget Range (₦)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Min</label>
                  <input
                    type="number"
                    min={filters.priceRange.min}
                    max={filters.priceRange.max}
                    value={priceRange.min}
                    onChange={handleMinPriceChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-bold text-gray-700 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Max</label>
                  <input
                    type="number"
                    min={filters.priceRange.min}
                    max={filters.priceRange.max}
                    value={priceRange.max}
                    onChange={handleMaxPriceChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-bold text-gray-700 text-sm"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active Range</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-emerald-700 text-xs">₦{priceRange.min.toLocaleString()}</span>
                    <span className="text-emerald-300 text-xs">—</span>
                    <span className="font-black text-emerald-700 text-xs">₦{priceRange.max.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
