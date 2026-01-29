import React from "react";
import { Users, Package, TrendingUp, AlertCircle, Eye } from "lucide-react";

interface AdminStatsProps {
    vendorsCount: number;
    productsCount: number;
    inStockCount: number;
    outOfStockCount: number;
    uniqueVisitors: number;
    totalVisits: number;
}

export function AdminStats({
    vendorsCount,
    productsCount,
    inStockCount,
    outOfStockCount,
    uniqueVisitors,
    totalVisits
}: AdminStatsProps) {
    const stats = [
        { label: "Total Vendors", value: vendorsCount, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "All Products", value: productsCount, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "In Stock", value: inStockCount, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
        { label: "Out of Stock", value: outOfStockCount, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
        { label: "Unique Visitors", value: uniqueVisitors, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
        { label: "Total Visits", value: totalVisits, icon: Eye, color: "text-cyan-600", bg: "bg-cyan-50" },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-lg ${stat.bg}`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</span>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                </div>
            ))}
        </div>
    );
}
