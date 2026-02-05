/**
 * Vendor Badge Component
 * Displays trust badges earned by vendors
 */

import React from 'react';
import { VendorBadge as BadgeType } from '../types';

interface VendorBadgeProps {
    badge: BadgeType;
    size?: 'sm' | 'md' | 'lg';
    showTooltip?: boolean;
}

export const VendorBadge: React.FC<VendorBadgeProps> = ({ badge, size = 'md', showTooltip = true }) => {
    const sizeClasses = {
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-3 py-1.5',
        lg: 'text-base px-4 py-2'
    };

    const colorClasses = {
        yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        green: 'bg-green-100 text-green-800 border-green-300',
        gold: 'bg-amber-100 text-amber-800 border-amber-300',
        blue: 'bg-blue-100 text-blue-800 border-blue-300'
    };

    return (
        <div
            className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizeClasses[size]} ${colorClasses[badge.color]}`}
            title={showTooltip ? badge.criteria : undefined}
        >
            <span>{badge.icon}</span>
            <span>{badge.label}</span>
        </div>
    );
};

/**
 * Vendor Badges List Component
 * Displays multiple badges in a row
 */
interface VendorBadgesListProps {
    badges: BadgeType[];
    size?: 'sm' | 'md' | 'lg';
    maxDisplay?: number;
}

export const VendorBadgesList: React.FC<VendorBadgesListProps> = ({ badges, size = 'sm', maxDisplay = 3 }) => {
    if (!badges || badges.length === 0) return null;

    const displayBadges = badges.slice(0, maxDisplay);
    const remainingCount = badges.length - maxDisplay;

    return (
        <div className="flex flex-wrap gap-2">
            {displayBadges.map((badge, index) => (
                <VendorBadge key={index} badge={badge} size={size} />
            ))}
            {remainingCount > 0 && (
                <span className="text-xs text-gray-500 self-center">
                    +{remainingCount} more
                </span>
            )}
        </div>
    );
};
