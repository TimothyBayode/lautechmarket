import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, Clock, ShieldCheck, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { CuratedList, Vendor } from '../types';
import { getActiveCuratedLists, getCuratedListWithVendors } from '../services/curation';
import { getProxiedImageUrl } from '../utils/imageUrl';
import { formatResponseTime } from '../services/vendorMetrics';
import { VerifiedBadge } from './VerifiedBadge';

export const CuratedCarousel: React.FC = () => {
    const [lists, setLists] = useState<CuratedList[]>([]);
    const [listData, setListData] = useState<{ [key: string]: Vendor[] }>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLists();
    }, []);

    const loadLists = async () => {
        try {
            const activeLists = await getActiveCuratedLists();
            setLists(activeLists);

            // Load vendors for each list
            const data: { [key: string]: Vendor[] } = {};
            await Promise.all(activeLists.map(async (list) => {
                const result = await getCuratedListWithVendors(list.id);
                if (result) {
                    data[list.id] = result.vendors;
                }
            }));
            setListData(data);
        } catch (error) {
            console.error('Failed to load curated lists:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null;
    if (lists.length === 0) return null;

    return (
        <div className="space-y-12 py-8">
            {lists.map(list => (
                <CuratedSection
                    key={list.id}
                    list={list}
                    vendors={listData[list.id] || []}
                />
            ))}
        </div>
    );
};

const CuratedSection: React.FC<{ list: CuratedList; vendors: Vendor[] }> = ({ list, vendors }) => {
    const navigate = useNavigate();
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (vendors.length === 0) return null;

    const getListIcon = () => {
        switch (list.type) {
            case 'top_3': return <Star className="w-5 h-5 text-amber-500 fill-current" />;
            case 'certified': return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
            case 'featured': return <TrendingUp className="w-5 h-5 text-purple-500" />;
            default: return <Star className="w-5 h-5 text-gray-400" />;
        }
    };

    const getListColor = () => {
        switch (list.type) {
            case 'top_3': return 'bg-amber-50 border-amber-100 text-amber-800';
            case 'certified': return 'bg-emerald-50 border-emerald-100 text-emerald-800';
            case 'featured': return 'bg-purple-50 border-purple-100 text-purple-800';
            default: return 'bg-gray-50 border-gray-100 text-gray-800';
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-end justify-between px-4 md:px-0 mb-6 max-w-7xl mx-auto">
                <div>
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border ${getListColor()}`}>
                        {getListIcon()}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                        {list.title}
                    </h2>
                    <p className="text-gray-500 mt-2 font-medium max-w-xl">
                        {list.description}
                    </p>
                </div>

                <div className="hidden md:flex space-x-2">
                    <button
                        onClick={() => scroll('left')}
                        className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex overflow-x-auto space-x-6 pb-8 px-4 md:px-0 snap-x snap-mandatory scrollbar-hide max-w-7xl mx-auto"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {vendors.map((vendor, index) => (
                    <div
                        key={vendor.id}
                        onClick={() => navigate(`/store/${vendor.slug || vendor.id}`)}
                        className="flex-shrink-0 w-80 snap-center group cursor-pointer"
                    >
                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm group-hover:shadow-xl transition-all duration-300">
                            {/* Rank Badge (only for Top 3) */}
                            {list.type === 'top_3' && (
                                <div className="absolute top-4 left-4 z-10 w-8 h-8 flex items-center justify-center bg-black text-white font-black text-lg rounded-lg shadow-lg">
                                    {index + 1}
                                </div>
                            )}

                            {/* Vendor Image */}
                            {vendor.bannerImage ? (
                                <img
                                    src={getProxiedImageUrl(vendor.bannerImage) || undefined}
                                    alt={vendor.businessName}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                    <span className="text-gray-300 text-4xl font-black opacity-20">{vendor.businessName.charAt(0)}</span>
                                </div>
                            )}

                        </div>

                        <div className="mt-4 px-1">
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-1 flex items-center gap-2">
                                {vendor.businessName}
                                <VerifiedBadge level={vendor.verificationLevel || (vendor.isVerified ? 'verified' : 'basic')} size="sm" />
                                {vendor.isActiveNow && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 rounded-full border border-emerald-100/50">
                                        <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-[9px] text-emerald-600 font-black uppercase tracking-tighter">Online</span>
                                    </div>
                                )}
                            </h3>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                {vendor.metrics?.averageResponseMinutes && (
                                    <div className="flex items-center text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                                        <Clock className="w-3.5 h-3.5 mr-1" />
                                        {formatResponseTime(vendor.metrics.averageResponseMinutes)}
                                    </div>
                                )}
                                {vendor.tagline && (
                                    <div className="font-medium">
                                        {vendor.tagline}
                                    </div>
                                )}
                            </div>

                            {/* "Why This Vendor" Mini Explainer */}
                            <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-xs font-medium text-gray-600 leading-relaxed">
                                    <span className="font-bold text-gray-900">Why? </span>
                                    {list.vendorReasons?.[vendor.id] ? (
                                        list.vendorReasons[vendor.id]
                                    ) : (
                                        vendor.metrics?.trustScore && vendor.metrics.trustScore > 80
                                            ? "Highly trusted by students with excellent feedback."
                                            : vendor.metrics?.averageResponseMinutes && vendor.metrics.averageResponseMinutes < 30
                                                ? "Responds faster than 90% of other vendors."
                                                : `${vendor.totalOrders || 'New'} successful orders delivered.`
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                {/* 'See All' Card */}
                {list.category && (
                    <div
                        onClick={() => navigate(`/category/${list.category}`)}
                        className="flex-shrink-0 w-40 snap-center cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50 transition-colors group"
                    >
                        <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center text-gray-400 group-hover:text-emerald-600 transition-colors mb-3">
                            <ArrowRight className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-gray-500 group-hover:text-emerald-700">See All</span>
                    </div>
                )}
            </div>
        </div>
    );
};
