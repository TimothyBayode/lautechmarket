import { Users, Package, TrendingUp } from "lucide-react";

interface PeriodStats {
    totalVisits: number;
    uniqueVisitors: number;
}

interface AdminStatsProps {
    vendorsCount: number;
    productsCount: number;
    inStockCount: number;
    outOfStockCount: number;
    analytics: {
        total: PeriodStats;
        daily: PeriodStats;
        weekly: PeriodStats;
        monthly: PeriodStats;
        yearly: PeriodStats;
    } | null;
}

export function AdminStats({
    vendorsCount,
    productsCount,
    inStockCount,
    outOfStockCount,
    analytics
}: AdminStatsProps) {
    const stats = [
        { label: "Total Vendors", value: vendorsCount, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "All Products", value: productsCount, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Inventory", value: `${inStockCount} in / ${outOfStockCount} out`, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
    ];

    const periods = [
        { label: "Today", data: analytics?.daily },
        { label: "This Week", data: analytics?.weekly },
        { label: "This Month", data: analytics?.monthly },
        { label: "This Year", data: analytics?.yearly },
        { label: "All Time", data: analytics?.total },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                        <div className="flex items-center space-x-4 mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-tight">{stat.label}</p>
                                <p className="text-2xl font-black text-gray-900">{stat.value.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-900 flex items-center uppercase tracking-widest">
                        <Users className="w-4 h-4 mr-2 text-purple-600" />
                        Engagement Analytics
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">Live Period Breakdown</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                    {periods.map((period, index) => (
                        <div key={index} className="p-6 hover:bg-gray-50/30 transition-colors">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-tighter">{period.label}</p>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-2xl font-black text-gray-900">{(period.data?.uniqueVisitors || 0).toLocaleString()}</p>
                                    <p className="text-[10px] font-bold text-purple-600 uppercase">Unique Users</p>
                                </div>
                                <div className="pt-2 border-t border-gray-50">
                                    <p className="text-lg font-bold text-gray-600">{(period.data?.totalVisits || 0).toLocaleString()}</p>
                                    <p className="text-[10px] font-medium text-gray-400 uppercase">Total visits</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
