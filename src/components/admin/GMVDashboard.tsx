import React, { useEffect, useState } from 'react';
import {
    TrendingUp,
    DollarSign,
    ShoppingBag,
    Users,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    ChevronRight,
    Filter
} from 'lucide-react';
import { getRecentOrders, getGMVHistory } from '../../services/orders';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface GMVStats {
    totalGMV: number;
    totalOrders: number;
    pendingValue: number;
    pendingCount: number;
    avgOrderValue: number;
    conversionRate: number;
}

interface GMVDashboardProps {
    totalVisits?: number;
    uniqueVisitors?: number;
    totalProducts?: number;
    outOfStockCount?: number;
    trafficLeaderboard?: any[];
    onViewLeaderboard?: () => void;
    onViewProducts?: (filter?: 'all' | 'out-of-stock') => void;
    totalProductViews?: number;
    totalOrderIntents?: number;
}

export const GMVDashboard: React.FC<GMVDashboardProps> = ({
    totalVisits = 0,
    uniqueVisitors = 0,
    totalProducts = 0,
    outOfStockCount = 0,
    trafficLeaderboard = [],
    onViewLeaderboard,
    onViewProducts,
    totalProductViews = 0,
    totalOrderIntents = 0
}) => {
    const [stats, setStats] = useState<GMVStats>({
        totalGMV: 0,
        totalOrders: 0,
        pendingValue: 0,
        pendingCount: 0,
        avgOrderValue: 0,
        conversionRate: 0
    });
    const [loading, setLoading] = useState(true);
    const [topVendors, setTopVendors] = useState<any[]>([]);
    const [trendData, setTrendData] = useState<{ date: string; gmv: number; orders: number }[]>([]);
    const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    useEffect(() => {
        loadData();
    }, [timeRange]);

    const loadData = async () => {
        setLoading(true);
        try {
            const overallRef = doc(db, "gmv_stats", "overall");
            const overallDoc = await getDoc(overallRef);
            const orders = await getRecentOrders(100);

            // Fetch trend data
            let history = await getGMVHistory(timeRange === 'monthly' ? 'monthly' : 'daily', 12);

            // Comprehensive Padded Merge Logic
            const paddedHistory = new Map();
            const now = new Date();

            // 1. Initialize 12 buckets ending today/this month
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now);
                let dateKey = "";
                if (timeRange === 'monthly') {
                    d.setMonth(d.getMonth() - i);
                    dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                } else {
                    d.setDate(d.getDate() - i);
                    dateKey = d.toISOString().split('T')[0];
                }
                paddedHistory.set(dateKey, { date: dateKey, gmv: 0, orders: 0, label: timeRange === 'daily' ? d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) });
            }

            // 2. Overlay historical stats
            history.forEach(item => {
                if (paddedHistory.has(item.date)) {
                    paddedHistory.set(item.date, { ...paddedHistory.get(item.date), ...item });
                }
            });

            // 3. Always merge live confirmed/pending orders to ensure immediate visibility
            if (orders.length > 0) {
                const relevantOrders = orders.filter(o => o.status === 'confirmed' || o.status === 'pending');
                relevantOrders.forEach(o => {
                    const d = new Date(o.createdAt);
                    let dateKey = "";
                    if (timeRange === 'monthly') {
                        dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    } else {
                        dateKey = d.toISOString().split('T')[0];
                    }

                    if (paddedHistory.has(dateKey)) {
                        const current = paddedHistory.get(dateKey);
                        // Add live data to existing stats
                        paddedHistory.set(dateKey, {
                            ...current,
                            gmv: current.gmv + (o.finalAmount || (o.status === 'pending' ? o.listedPrice : 0) || 0),
                            orders: current.orders + 1
                        });
                    }
                });
            }

            setTrendData(Array.from(paddedHistory.values()));

            const pending = orders.filter(o => o.status === 'pending');
            const pendingVal = pending.reduce((sum, o) => sum + o.listedPrice, 0);

            if (overallDoc.exists()) {
                const data = overallDoc.data();
                setStats({
                    totalGMV: data.totalGMV || 0,
                    totalOrders: data.totalOrders || 0,
                    pendingValue: pendingVal,
                    pendingCount: pending.length,
                    avgOrderValue: (data.totalGMV || 0) / (data.totalOrders || 1),
                    conversionRate: totalVisits > 0
                        ? ((data.totalOrders || 0) / totalVisits) * 100
                        : ((data.totalOrders || 0) / (orders.length || 1)) * 100
                });
            } else {
                setStats(prev => ({
                    ...prev,
                    pendingValue: pendingVal,
                    pendingCount: pending.length
                }));
            }

            const vendorMap = new Map();
            orders.filter(o => o.status === 'confirmed').forEach(o => {
                const current = vendorMap.get(o.vendorId) || { name: o.vendorName, gmv: 0, count: 0 };
                vendorMap.set(o.vendorId, {
                    ...current,
                    gmv: current.gmv + (o.finalAmount || 0),
                    count: current.count + 1
                });
            });

            const sortedVendors = Array.from(vendorMap.values())
                .sort((a, b) => b.gmv - a.gmv)
                .slice(0, 5);
            setTopVendors(sortedVendors);

        } catch (err) {
            console.error("Error loading GMV data:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Traffic Metrics */}
            {/* Metric Grid - Row 1: Traffic & Sales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard
                    title="Total Platform Visits"
                    value={totalVisits.toLocaleString()}
                    trend="Real-time"
                    icon={<Users className="w-5 h-5" />}
                    color="blue"
                    onClick={onViewLeaderboard}
                />
                <MetricCard
                    title="Unique Visitors"
                    value={uniqueVisitors.toLocaleString()}
                    trend="Unique IPs"
                    icon={<Users className="w-5 h-5" />}
                    color="purple"
                />
                <MetricCard
                    title="Total GMV"
                    value={`₦${stats.totalGMV.toLocaleString()}`}
                    trend={stats.totalGMV > 0 ? "Revenue Live" : "Awaiting Sales"}
                    icon={<DollarSign className="w-5 h-5" />}
                    color="emerald"
                />
            </div>

            {/* Metric Grid - Row 2: Inventory & Conversion */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Products"
                    value={totalProducts.toString()}
                    trend="Live Catalog"
                    icon={<ShoppingBag className="w-5 h-5" />}
                    color="blue"
                    onClick={() => onViewProducts?.('all')}
                />
                <MetricCard
                    title="Fulfilled Orders"
                    value={stats.totalOrders.toString()}
                    trend={stats.totalOrders > 0 ? "Growth Active" : "No Sales Yet"}
                    icon={<ShoppingBag className="w-5 h-5" />}
                    color="emerald"
                />
                <MetricCard
                    title="Conversion Rate"
                    value={`${stats.conversionRate.toFixed(1)}%`}
                    trend="Efficiency"
                    icon={<TrendingUp className="w-5 h-5" />}
                    color="purple"
                />
                <MetricCard
                    title="Out of Stock"
                    value={outOfStockCount.toString()}
                    trend={outOfStockCount > 10 ? "CRITICAL" : outOfStockCount > 0 ? "Monitor" : "Healthy"}
                    icon={<Calendar className="w-5 h-5" />}
                    color="orange"
                    onClick={() => onViewProducts?.('out-of-stock')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-emerald-600" />
                                GMV Growth Trend
                                <span className="text-[10px] text-gray-400 font-normal uppercase tracking-widest ml-2">Market Performance</span>
                            </h3>
                            <div className="flex bg-gray-100 rounded-lg p-1 text-xs">
                                <button
                                    onClick={() => setTimeRange('daily')}
                                    className={`px-3 py-1 rounded transition-all font-bold ${timeRange === 'daily' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}
                                >
                                    Daily
                                </button>
                                <button
                                    onClick={() => setTimeRange('weekly')}
                                    className={`px-3 py-1 rounded transition-all font-bold ${timeRange === 'weekly' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}
                                >
                                    Weekly
                                </button>
                                <button
                                    onClick={() => setTimeRange('monthly')}
                                    className={`px-3 py-1 rounded transition-all font-bold ${timeRange === 'monthly' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}
                                >
                                    Monthly
                                </button>
                            </div>
                        </div>

                        <div className="h-64 flex items-end justify-between gap-1 relative">
                            {trendData.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 backdrop-blur-[1px] rounded-xl z-20">
                                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Awaiting Transaction Data</p>
                                </div>
                            )}
                            {(trendData.length > 0 ? trendData : Array(12).fill({ gmv: 0 })).map((item: any, i) => {
                                const maxGmv = Math.max(...trendData.map(d => d.gmv), 1000);
                                const percentage = (item.gmv / maxGmv) * 100;
                                return (
                                    <div key={i} className="w-full group relative flex items-end">
                                        <div
                                            className={`${item.gmv > 0 ? 'bg-emerald-500 group-hover:bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-gray-100/50'} w-1.5 mx-auto rounded-full transition-all duration-500`}
                                            style={{ height: `${Math.max(percentage, item.gmv > 0 ? 15 : 4)}%` }}
                                        ></div>
                                        {item.gmv > 0 && (
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-30 whitespace-nowrap shadow-2xl border border-white/10 flex flex-col items-center">
                                                <span className="font-black text-emerald-400">₦{item.gmv.toLocaleString()}</span>
                                                <span className="text-[8px] opacity-70 font-bold uppercase tracking-widest">{item.label}</span>
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 border-r border-b border-white/10"></div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {trendData.length > 0 ? (
                                <>
                                    <span>{(trendData[0] as any).label}</span>
                                    <span>{(trendData[Math.floor(trendData.length / 2)] as any).label}</span>
                                    <span>{(trendData[trendData.length - 1] as any).label}</span>
                                </>
                            ) : (
                                <>
                                    <span>No Data</span>
                                    <span>-</span>
                                    <span>Today</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute -right-8 -bottom-8 opacity-10">
                            <ShoppingBag className="w-48 h-48" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-indigo-100 font-bold uppercase tracking-wider text-xs mb-2">Pending Pipeline Value</h3>
                                <div className="text-4xl font-black">₦{stats.pendingValue.toLocaleString()}</div>
                                <p className="text-indigo-200 text-sm mt-2">{stats.pendingCount} orders awaiting vendor confirmation</p>
                            </div>
                            <button
                                onClick={() => alert("Reminder notifications sent to all pending vendors via Dashboard.")}
                                className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-black hover:bg-indigo-50 transition-colors shadow-lg active:scale-95 duration-200"
                            >
                                Remind All Vendors
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-emerald-600" />
                            Revenue Leaders
                        </h3>
                        <div className="space-y-4">
                            {topVendors.length === 0 ? (
                                <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No Confirmed Sales</p>
                                </div>
                            ) : topVendors.map((vendor, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-100">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{vendor.name}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">{vendor.count} orders</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-gray-900">₦{vendor.gmv.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            Traffic Engagement
                        </h3>
                        <div className="space-y-4">
                            {trafficLeaderboard.slice(0, 5).length === 0 ? (
                                <p className="text-gray-500 text-sm italic">No traffic data yet</p>
                            ) : trafficLeaderboard.slice(0, 5).map((vendor, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{vendor.vendorName}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">{vendor.count} visits</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-gray-900">{vendor.count.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={onViewLeaderboard}
                            className="w-full mt-8 py-3 bg-gray-50 text-gray-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 group"
                        >
                            Full Traffic Leaderboard
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Filter className="w-5 h-5 text-purple-600" />
                            Conversion Funnel
                        </h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                                    <span>Product Interest</span>
                                    <span>{(totalVisits > 0 ? (totalProductViews / totalVisits * 100) : 0).toFixed(1)}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-1000"
                                        style={{ width: `${Math.min(100, totalVisits > 0 ? (totalProductViews / totalVisits * 100) : 0)}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                                    <span>WhatsApp Intent Rate</span>
                                    <span>{(totalVisits > 0 ? (totalOrderIntents / totalVisits * 100) : 0).toFixed(1)}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 transition-all duration-1000"
                                        style={{ width: `${Math.min(100, totalVisits > 0 ? (totalOrderIntents / totalVisits * 100) : 0)}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                                    <span>Fulfilled Conversion</span>
                                    <span>{stats.conversionRate.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-orange-500 transition-all duration-1000"
                                        style={{ width: `${Math.min(100, stats.conversionRate)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface MetricCardProps {
    title: string;
    value: string;
    trend: string;
    icon: React.ReactNode;
    color: 'emerald' | 'blue' | 'purple' | 'orange';
    onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend, icon, color, onClick }) => {
    const isPositive = trend.startsWith('+') ||
        ['Healthy', 'Alive', 'System Wide', 'Real-time', 'Unique IPs', 'Revenue Live', 'Live Catalog', 'Growth Active'].includes(trend);
    const isNegative = trend.startsWith('-') || ['CRITICAL', 'Action Req.', 'Monitor'].includes(trend);
    const colorClasses = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100'
    };

    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm group transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-xl hover:border-emerald-200 active:scale-95' : 'hover:shadow-md'}`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl ${colorClasses[color]} border transition-transform group-hover:scale-110 duration-300`}>
                    {icon}
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-emerald-500' : isNegative ? 'text-red-500' : 'text-gray-400'}`}>
                    {isPositive && <ArrowUpRight className="w-3 h-3" />}
                    {isNegative && <ArrowDownRight className="w-3 h-3" />}
                    {trend}
                </div>
            </div>
            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">{title}</h3>
            <div className="text-2xl font-black text-gray-900">{value}</div>
        </div>
    );
};
