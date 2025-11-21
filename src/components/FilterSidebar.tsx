import React, { useState } from "react";
import { ChevronDown, ChevronUp, X, SlidersHorizontal } from "lucide-react";
import { FilterOptions } from "../types";
import { fetchCategories } from "../services/categories";

const categories = await fetchCategories();
const categoryNames = categories.map((cat) => cat.name);

interface FilterSidebarProps {
  filters: FilterOptions;
  selectedCategories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  onCategoryChange: (category: string) => void;
  onPriceChange: (range: { min: number; max: number }) => void;
  onClearFilters: () => void;
}

export function FilterSidebar({
  filters,
  selectedCategories,
  priceRange,
  onCategoryChange,
  onPriceChange,
  onClearFilters,
}: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasActiveFilters =
    selectedCategories.length > 0 ||
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          <span className="text-lg font-semibold text-gray-900">Filters</span>
          {hasActiveFilters && (
            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
              Active
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
              className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span>Clear all</span>
            </button>
          )}
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="pb-6 border-t border-gray-200">
          <div className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="md:col-span-2 lg:col-span-1">
              <h3 className="font-medium text-gray-900 mb-4">Category</h3>
              <div className="flex flex-wrap gap-3">
                {filters.categories.map((category) => (
                  <label
                    key={category}
                    className="inline-flex items-center cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => onCategoryChange(category)}
                      className="sr-only"
                    />
                    <span
                      className={`
                      px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200
                      ${
                        selectedCategories.includes(category)
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 hover:border-gray-300"
                      }
                    `}
                    >
                      {category}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="font-medium text-gray-900 mb-4">Price Range</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">
                    Minimum Price (₦)
                  </label>
                  <input
                    type="number"
                    min={filters.priceRange.min}
                    max={filters.priceRange.max}
                    value={priceRange.min}
                    onChange={handleMinPriceChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Range: ₦{filters.priceRange.min} - ₦{filters.priceRange.max}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">
                    Maximum Price (₦)
                  </label>
                  <input
                    type="number"
                    min={filters.priceRange.min}
                    max={filters.priceRange.max}
                    value={priceRange.max}
                    onChange={handleMaxPriceChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Range: ₦{filters.priceRange.min} - ₦{filters.priceRange.max}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
                <span className="font-medium">₦{priceRange.min}</span>
                <span className="text-gray-400">to</span>
                <span className="font-medium">₦{priceRange.max}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
