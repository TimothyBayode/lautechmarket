/**
 * Vendor Metrics Display Component
 * Shows vendor performance metrics and trust signals
 */

import React from 'react';
import { Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { VendorBadgesList } from './VendorBadge';
import { VendorBadge } from '../types';
import { formatResponseTime } from '../services/vendorMetrics';
import { formatLastActive } from '../services/vendorActivity';

interface VendorMetricsDisplayProps {
    metrics?: {
        responsivenessScore: number;
        trustScore: number;
        averageResponseMinutes: number;
        responseRate: number;
    };
    badges?: VendorBadge[];
    lastActive?: Date | null;
    isActiveNow?: boolean;
    compact?: boolean;
}

export const VendorMetricsDisplay: React.FC<VendorMetricsDisplayProps> = ({
    metrics,
    badges,
    lastActive,
    isActiveNow,
    compact = false
}) => {
    if (!metrics && (!badges || badges.length === 0)) {
        return null;
    }

    if (compact) {
        return (
            <div className="flex items-center gap-2 flex-wrap">
                {/* Active Now Indicator */}
                {isActiveNow && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Online
                    </span>
                )}

                {/* Badges */}
                {badges && badges.length > 0 && (
                    <VendorBadgesList badges={badges} size="sm" maxDisplay={2} />
                )}

                {/* Response Time */}
                {metrics && metrics.averageResponseMinutes > 0 && (
                    <span className="text-xs text-gray-600">
                        ~{formatResponseTime(metrics.averageResponseMinutes)} response
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Badges */}
            {badges && badges.length > 0 && (
                <div>
                    <VendorBadgesList badges={badges} size="md" />
                </div>
            )}

            {/* Metrics Grid */}
            {metrics && (
                <div className="grid grid-cols-2 gap-4">
                    {/* Response Time */}
                    {metrics.averageResponseMinutes > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-gray-600 mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-medium">Response Time</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">
                                {formatResponseTime(metrics.averageResponseMinutes)}
                            </p>
                            <p className="text-xs text-gray-500">average</p>
                        </div>
                    )}

                    {/* Trust Score */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs font-medium">Trust Score</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                            {metrics.trustScore}/100
                        </p>
                        <p className="text-xs text-gray-500">
                            {metrics.trustScore >= 80 ? 'Excellent' :
                                metrics.trustScore >= 60 ? 'Good' :
                                    metrics.trustScore >= 40 ? 'Fair' : 'Building'}
                        </p>
                    </div>

                    {/* Response Rate */}
                    {metrics.responseRate > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-gray-600 mb-1">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs font-medium">Response Rate</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">
                                {Math.round(metrics.responseRate)}%
                            </p>
                            <p className="text-xs text-gray-500">replies to students</p>
                        </div>
                    )}
                </div>
            )}

            {/* Last Active */}
            {lastActive && (
                <div className="text-sm text-gray-600">
                    {isActiveNow ? (
                        <span className="flex items-center gap-2 text-green-600 font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Online
                        </span>
                    ) : (
                        <span>Last active: {formatLastActive(lastActive)}</span>
                    )}
                </div>
            )}
        </div>
    );
};
