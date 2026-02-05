
import React from 'react';
import { X, Store } from 'lucide-react';
import { Product, Vendor } from '../types';
import { getProxiedImageUrl } from '../utils/imageUrl';
import { Link } from 'react-router-dom';

interface CompareModalProps {
    products: Product[];
    vendors: Vendor[];
    onClose: () => void;
    onRemove: (productId: string) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({ products, vendors, onClose, onRemove }) => {
    if (products.length === 0) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Compare Products</h2>
                        <p className="text-sm text-gray-500">Comparing top {products.length} picks</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Comparison Content */}
                <div className="overflow-auto flex-1 scroll-smooth">
                    {/* MOBILE VIEW: Stacked Sections (hidden on desktop) */}
                    <div className="lg:hidden p-4 space-y-6">
                        {products.map((product, index) => {
                            const vendor = vendors.find(v => v.id === product.vendorId);
                            const trustScore = vendor?.metrics?.trustScore || 0;
                            return (
                                <div key={product.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                                            Pick #{index + 1}
                                        </span>
                                        <button
                                            onClick={() => onRemove(product.id)}
                                            className="p-1 bg-red-50 text-red-500 rounded-full hover:bg-red-100"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex gap-4 mb-6">
                                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-white border border-gray-100 shrink-0">
                                            <img
                                                src={getProxiedImageUrl(product.image || '') || product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 leading-tight mb-1">{product.name}</h3>
                                            <div className="text-xl font-black text-emerald-600">₦{product.price.toLocaleString()}</div>
                                            <Link to={`/product/${product.id}`} className="text-xs text-emerald-600 font-bold hover:underline uppercase tracking-tighter mt-1 block">
                                                View Details →
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-white p-3 rounded-xl border border-gray-100">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Stability</div>
                                            {product.inStock ? (
                                                <span className="text-xs font-bold text-emerald-600">In Stock</span>
                                            ) : (
                                                <span className="text-xs font-bold text-red-600">Sold Out</span>
                                            )}
                                        </div>
                                        <div className="bg-white p-3 rounded-xl border border-gray-100">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Trust Score</div>
                                            <span className="text-xs font-bold text-emerald-600">{trustScore}% Verified</span>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            {vendor?.profileImage ? (
                                                <img src={getProxiedImageUrl(vendor.profileImage) || vendor.profileImage} className="w-5 h-5 rounded-full bg-gray-100 object-cover" />
                                            ) : (
                                                <Store className="w-4 h-4 text-emerald-600" />
                                            )}
                                            <span className="font-bold text-xs text-gray-900">{vendor?.businessName}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                                            {product.description || 'No description provided.'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* DESKTOP VIEW: Row-aligned Grid (hidden on mobile) */}
                    <div className="hidden lg:block min-w-[900px]">
                        {/* THEAD-like Row (Images & Names) */}
                        <div className="grid grid-cols-[160px_1fr] border-b border-gray-100">
                            <div className="p-6 bg-gray-50/50 flex items-end font-bold text-gray-400 uppercase tracking-widest text-[10px]">Product Info</div>
                            <div className={`grid grid-cols-${products.length} gap-6 p-6`}>
                                {products.map(product => (
                                    <div key={product.id} className="relative group">
                                        <button
                                            onClick={() => onRemove(product.id)}
                                            className="absolute -top-2 -right-2 p-1 bg-red-50 text-red-500 rounded-full hover:bg-red-100 shadow-sm z-10"
                                            title="Remove from comparison"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                        <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 mb-3 border border-gray-100">
                                            <img
                                                src={getProxiedImageUrl(product.image || '') || product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">
                                            {product.name}
                                        </h3>
                                        <Link to={`/product/${product.id}`} className="text-[10px] text-emerald-600 font-bold hover:underline uppercase tracking-tighter mt-1 block">
                                            View Details →
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PRICE ROW */}
                        <div className="grid grid-cols-[160px_1fr] border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <div className="p-6 bg-gray-50/30 flex items-center font-bold text-gray-500 text-xs">Price & Value</div>
                            <div className={`grid grid-cols-${products.length} gap-6 p-6 items-center`}>
                                {products.map(product => (
                                    <div key={product.id} className="text-xl font-bold text-emerald-600">
                                        ₦{product.price.toLocaleString()}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* VENDOR ROW */}
                        <div className="grid grid-cols-[160px_1fr] border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <div className="p-6 bg-gray-50/30 flex items-center font-bold text-gray-500 text-xs">Vendor Trust</div>
                            <div className={`grid grid-cols-${products.length} gap-6 p-6`}>
                                {products.map(product => {
                                    const vendor = vendors.find(v => v.id === product.vendorId);
                                    const trustScore = vendor?.metrics?.trustScore || 0;
                                    return (
                                        <div key={product.id} className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                {vendor?.profileImage ? (
                                                    <img src={getProxiedImageUrl(vendor.profileImage) || vendor.profileImage} className="w-6 h-6 rounded-full bg-gray-100 object-cover" />
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                                        <Store className="w-3 h-3 text-emerald-600" />
                                                    </div>
                                                )}
                                                <span className="font-bold text-xs text-gray-900 truncate">{vendor?.businessName}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between text-[10px] font-bold">
                                                    <span className="text-gray-400">TRUST SCORE</span>
                                                    <span className="text-emerald-600">{trustScore}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${trustScore}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* AVAILABILITY ROW */}
                        <div className="grid grid-cols-[160px_1fr] border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <div className="p-6 bg-gray-50/30 flex items-center font-bold text-gray-500 text-xs">Availability</div>
                            <div className={`grid grid-cols-${products.length} gap-6 p-6 items-center`}>
                                {products.map(product => (
                                    <div key={product.id}>
                                        {product.inStock ? (
                                            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                                In Stock
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1 rounded">
                                                Out of Stock
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* DESCRIPTION ROW */}
                        <div className="grid grid-cols-[160px_1fr] hover:bg-gray-50 transition-colors">
                            <div className="p-6 bg-gray-50/30 flex items-start font-bold text-gray-500 text-xs pt-6">Product Details</div>
                            <div className={`grid grid-cols-${products.length} gap-6 p-6 items-start`}>
                                {products.map(product => (
                                    <div key={product.id} className="text-xs text-gray-600 leading-relaxed font-medium">
                                        {product.description || 'No description provided.'}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                        Close Comparison
                    </button>
                </div>
            </div>
        </div>
    );
};
