import React from 'react';
import { Product, Vendor } from '../types';
import { Store, Package, Tag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProxiedImageUrl } from '../utils/imageUrl';

interface SearchSuggestionsProps {
    suggestions: {
        products: Product[];
        vendors: Vendor[];
        categories: string[];
    };
    onSearch: (query: string) => void;
    onClose: () => void;
    isVisible: boolean;
    selectedIndex: number;
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
    suggestions,
    onClose,
    isVisible,
    selectedIndex
}) => {
    if (!isVisible || (suggestions.products.length === 0 && suggestions.vendors.length === 0 && suggestions.categories.length === 0)) {
        return null;
    }

    const categoryCount = suggestions.categories.length;
    const vendorCount = suggestions.vendors.length;

    return (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Trending/Categories Section */}
            {categoryCount > 0 && (
                <div className="p-2 border-b border-gray-50 dark:border-slate-800">
                    <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Categories</p>
                    {suggestions.categories.map((cat, idx) => (
                        <Link
                            key={cat}
                            to={`/category/${cat.toLowerCase()}`}
                            onClick={onClose}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-xl transition-colors ${selectedIndex === idx ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'}`}
                        >
                            <Tag className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-medium">{cat}</span>
                        </Link>
                    ))}
                </div>
            )}

            {/* Vendors Section */}
            {vendorCount > 0 && (
                <div className="p-2 border-b border-gray-50 dark:border-slate-800">
                    <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vendors</p>
                    {suggestions.vendors.map((vendor, idx) => {
                        const itemIdx = categoryCount + idx;
                        return (
                            <Link
                                key={vendor.id}
                                to={`/store/${vendor.id}`}
                                onClick={onClose}
                                className={`flex items-center space-x-3 px-3 py-2 rounded-xl transition-colors ${selectedIndex === itemIdx ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'}`}
                            >
                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center overflow-hidden">
                                    {vendor.profileImage ? (
                                        <img src={getProxiedImageUrl(vendor.profileImage) || vendor.profileImage} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Store className="w-4 h-4 text-emerald-600" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate dark:text-white">{vendor.businessName}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Shop • {vendor.isVerified ? 'Verified' : 'Student Seller'}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Products Section */}
            {suggestions.products.length > 0 && (
                <div className="p-2">
                    <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Products</p>
                    {suggestions.products.map((product, idx) => {
                        const itemIdx = categoryCount + vendorCount + idx;
                        return (
                            <Link
                                key={product.id}
                                to={`/product/${product.id}`}
                                onClick={onClose}
                                className={`flex items-center space-x-3 px-3 py-2 rounded-xl transition-colors ${selectedIndex === itemIdx ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'}`}
                            >
                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-slate-700">
                                    <img src={getProxiedImageUrl(product.image) || product.image} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate dark:text-white">{product.name}</p>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">₦{product.price.toLocaleString()}</p>
                                </div>
                                <Package className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Footer / Search Hint */}
            <div className="bg-gray-50 dark:bg-slate-900/50 p-2 text-center border-t border-gray-100 dark:border-slate-800">
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    Press <span className="font-bold">Enter</span> to search all results
                </p>
            </div>
        </div>
    );
};
