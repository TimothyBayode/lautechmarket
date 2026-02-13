import React, { useRef, useState } from "react";
import {
    Store,
    Link as LinkIcon,
    X,
    ShieldCheck,
    Download
} from "lucide-react";
import { Vendor } from "../types";
import { toPng } from "html-to-image";
import { getProxiedImageUrl } from '../utils/imageUrl';

interface VendorBusinessCardProps {
    vendor: Vendor;
    onClose: () => void;
}

export const VendorBusinessCard: React.FC<VendorBusinessCardProps> = ({ vendor, onClose }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [profileDataUrl, setProfileDataUrl] = useState<string | null>(null);
    const [bannerDataUrl, setBannerDataUrl] = useState<string | null>(null);
    const storeUrl = `${window.location.origin}/store/${vendor.slug || vendor.id}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(storeUrl);
        alert("Store link copied!");
    };

    /**
     * Helper to convert an image URL to a Data URL (Base64)
     * This helps bypass CORS issues during the final export
     */
    const getSafeImageDataUrl = async (url: string): Promise<string | null> => {
        try {
            // First attempt with CORS
            const response = await fetch(url, { mode: 'cors' });
            if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        } catch (err) {
            console.warn(`[BusinessCard] Failed to pre-fetch image ${url}:`, err);
            return null;
        }
    };

    // Pre-fetch images on mount to avoid CORS issues during download
    React.useEffect(() => {
        const proxiedProfileUrl = getProxiedImageUrl(vendor.profileImage);
        const proxiedBannerUrl = getProxiedImageUrl(vendor.bannerImage);

        if (proxiedProfileUrl) {
            getSafeImageDataUrl(proxiedProfileUrl).then(setProfileDataUrl);
        }
        if (proxiedBannerUrl) {
            getSafeImageDataUrl(proxiedBannerUrl).then(setBannerDataUrl);
        }
    }, [vendor.profileImage, vendor.bannerImage]);

    const handleDownload = async () => {
        if (!cardRef.current) return;

        setIsDownloading(true);
        console.log("[BusinessCard] Starting download...");

        try {
            // Wait a bit for any pending transitions
            await new Promise(resolve => setTimeout(resolve, 500));

            const dataUrl = await toPng(cardRef.current, {
                cacheBust: false,
                pixelRatio: 2,
                backgroundColor: "#065f46",
                style: {
                    borderRadius: '0'
                },
            });

            const link = document.createElement("a");
            link.download = `${vendor.businessName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-business-card.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log("[BusinessCard] Download triggered successfully");
        } catch (err: any) {
            console.error("Business Card Download failed:", err);

            // Provide helpful, actionable error message
            let message = "⚠️ Download Failed\n\n";

            if (err.message?.includes('SecurityError') || err.name === 'SecurityError' || err.message?.includes('Failed to fetch')) {
                message += "Your images are hosted on a server that blocks downloads for security reasons.\n\n";
                message += "📸 Quick Fix: Take a screenshot instead!\n";
                message += "• Windows: Win + Shift + S\n";
                message += "• Mac: Cmd + Shift + 4\n\n";
                message += "Or contact support to enable image downloads.";
            } else {
                message += "An unexpected error occurred. Please try taking a screenshot instead.";
            }

            alert(message);
        } finally {
            setIsDownloading(false);
        }
    };

    // Use pre-fetched data URLs if available for the export area
    const displayProfileUrl = profileDataUrl || vendor.profileImage || null;
    const displayBannerUrl = bannerDataUrl || vendor.bannerImage || null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white p-2 rounded-full z-20 transition-all border border-white/30"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Card Graphic Area */}
                <div
                    ref={cardRef}
                    id="business-card-graphic"
                    className="relative p-8 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white min-h-[400px] flex flex-col justify-between overflow-hidden"
                >
                    {/* Banner Background for Card */}
                    {displayBannerUrl && (
                        <div className="absolute inset-0 opacity-20 transition-opacity">
                            <img
                                src={displayBannerUrl}
                                alt=""
                                className="w-full h-full object-cover grayscale"
                            />
                            <div className="absolute inset-0 bg-emerald-900/40" />
                        </div>
                    )}

                    {/* Decorative Elements */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
                                    <Store className="w-6 h-6" />
                                </div>
                                <span className="font-display font-bold tracking-tight text-xl">LAUTECH Market</span>
                            </div>
                            {vendor.isVerified && (
                                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Verified</span>
                                </div>
                            )}
                            {vendor.isStudent && (
                                <div className="flex items-center gap-1 bg-blue-400/30 backdrop-blur-md px-3 py-1 rounded-full border border-blue-200/30">
                                    <ShieldCheck className="w-4 h-4 text-blue-200" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-100">Student</span>
                                </div>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="flex flex-col items-center text-center mt-4">
                            <div className="w-24 h-24 rounded-full border-4 border-white/30 bg-white/20 p-1 mb-4 shadow-xl overflow-hidden">
                                {displayProfileUrl ? (
                                    <img
                                        src={displayProfileUrl}
                                        alt={vendor.businessName}
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/10 rounded-full">
                                        <Store className="w-10 h-10" />
                                    </div>
                                )}
                            </div>
                            <h2 className="text-3xl font-bold font-display leading-tight">{vendor.businessName}</h2>
                            <div className="mt-2 inline-block bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1 rounded-full">
                                <span className="text-xs font-bold uppercase tracking-widest text-emerald-100">CEO / Business Owner</span>
                            </div>

                            {vendor.tagline && (
                                <p className="mt-6 text-emerald-50 text-base italic line-clamp-2 max-w-[280px]">
                                    "{vendor.tagline}"
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Footer / URL */}
                    <div className="relative z-10 mt-8 border-t border-white/20 pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mb-1">Visit My Store</span>
                                <span className="text-sm font-mono opacity-90 break-all">{vendor.slug || vendor.id}.lautechmarket.ng</span>
                            </div>
                            <div className="p-2 bg-white rounded-xl shadow-lg">
                                {/* Placeholder for QR Code or Logo */}
                                <div className="w-12 h-12 flex items-center justify-center border-2 border-emerald-600 rounded-lg">
                                    <LinkIcon className="w-6 h-6 text-emerald-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions Section */}
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <p className="text-sm text-gray-500 text-center mb-6 font-medium">
                        Download your professional identity and share it on social media.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleCopyLink}
                            className="flex items-center justify-center gap-2 bg-white text-emerald-600 border border-emerald-200 py-3 rounded-xl hover:bg-emerald-50 transition-colors font-bold shadow-sm"
                        >
                            <LinkIcon className="w-4 h-4" />
                            Copy Link
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className={`flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition-colors font-bold shadow-md ${isDownloading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isDownloading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            {isDownloading ? "Generating..." : "Download Card"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
