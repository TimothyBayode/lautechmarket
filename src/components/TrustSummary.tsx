import { Vendor, VendorMetrics } from "../types";
import { VerifiedBadge } from "./VerifiedBadge";
import { ShieldCheck, Zap, Users } from "lucide-react";

interface TrustSummaryProps {
    vendor: Partial<Vendor> | null;
    metrics?: VendorMetrics | null;
    className?: string;
    showFull?: boolean;
}

export function TrustSummary({ vendor, metrics, className = "", showFull = false }: TrustSummaryProps) {
    if (!vendor) return null;

    const isFresh = (lastActive: { toDate?: () => Date } | Date | string | null | undefined) => {
        if (!lastActive) return false;
        const date = lastActive instanceof Date ? lastActive :
            (typeof lastActive === 'object' && 'toDate' in lastActive && typeof lastActive.toDate === 'function') ? lastActive.toDate() :
                new Date(lastActive as string);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        return diffMs < 5 * 60 * 1000; // 5 minutes
    };

    const isOnline = (vendor.isActiveNow || metrics?.isActiveNow) && isFresh(vendor.lastActive || metrics?.lastActive);

    return (
        <div className={`flex flex-col gap-3 ${className}`}>
            {/* Main Trust Line */}
            <div className="flex flex-wrap items-center gap-2">
                <VerifiedBadge
                    level={vendor.verificationLevel || (vendor.isVerified ? "verified" : "basic")}
                    size="md"
                />

                {vendor.isStudent && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] sm:text-xs font-bold border border-blue-100 uppercase tracking-tight">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Student Seller</span>
                    </div>
                )}

                {isOnline && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] sm:text-xs font-bold border border-emerald-100 uppercase tracking-tight shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>Online</span>
                    </div>
                )}
            </div>

            {/* Metrics Breakdown (shown in Detail or Storefront) */}
            {showFull && (
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <div>
                            <p className="font-semibold text-gray-900">
                                {metrics?.averageResponseMinutes ?
                                    (metrics.averageResponseMinutes < 60 ?
                                        `~${Math.round(metrics.averageResponseMinutes)}m response` :
                                        `~${Math.round(metrics.averageResponseMinutes / 60)}h response`)
                                    : "Fast response"}
                            </p>
                            <p className="scale-90 origin-left opacity-70">Responsiveness</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <div>
                            <p className="font-semibold text-gray-900">
                                {metrics?.totalContacts ? `${metrics.totalContacts}+` : "New"} Students
                            </p>
                            <p className="scale-90 origin-left opacity-70">Total Contacts</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
