/**
 * VerifiedBadge Component
 * 
 * Displays a shield with checkmark badge for verified vendors.
 * Shows "Verified Vendor" tooltip on hover.
 * Uses emerald green to match site theme.
 */

import { useState } from "react";

interface VerifiedBadgeProps {
    level?: "basic" | "verified" | "pro";
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function VerifiedBadge({ level = "verified", size = "md", className = "" }: VerifiedBadgeProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    if (level === "basic") return null;

    // Size configurations
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6",
    };

    // Level configurations
    const levelConfig = {
        basic: {
            stroke: "#94a3b8", // Slate 400
            fill: "#f8fafc",   // Slate 50
            label: "Basic Seller",
            tooltip: "Basic Vendor Level"
        },
        verified: {
            stroke: "#334155", // Slate 700 (Silver feel)
            fill: "#f1f5f9",   // Slate 100
            label: "Verified Vendor",
            tooltip: "Verified (Silver): Identity & Reliability Confirmed."
        },
        pro: {
            stroke: "#b45309", // Amber 700 (Gold)
            fill: "#fef3c7",   // Amber 100
            label: "Pro Partner",
            tooltip: "Pro Partner (Gold): Premium Tier • Top Performance."
        }
    };

    const config = levelConfig[level] || levelConfig.verified;

    return (
        <div
            className={`relative inline-flex items-center ${className}`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {/* Shield with Checkmark SVG */}
            <svg
                className={`${sizeClasses[size]} flex-shrink-0 transition-transform duration-200 hover:scale-110`}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Shield outline */}
                <path
                    d="M12 2L4 6V12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12V6L12 2Z"
                    stroke={config.stroke}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={config.fill}
                />
                {/* Checkmark */}
                <path
                    d="M8.5 12L11 14.5L16 9"
                    stroke={config.stroke}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900/95 backdrop-blur-sm text-white text-[10px] sm:text-xs rounded-md whitespace-nowrap z-50 shadow-xl border border-white/10">
                    {config.tooltip}
                    {/* Tooltip arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
            )}
        </div>
    );
}
