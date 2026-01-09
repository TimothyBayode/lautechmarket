/**
 * AnnouncementCarousel Component
 * 
 * Displays admin-managed announcements/banners on the homepage.
 * Includes the disclaimer as the first slide by default.
 * Features smooth sliding animation, auto-scroll (5 seconds), and manual navigation.
 */

import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { Announcement } from "../types";
import { getActiveAnnouncements } from "../services/announcements";

// Default disclaimer slide
const disclaimerSlide: Announcement = {
    id: "disclaimer",
    type: "text",
    title: "Disclaimer",
    message: "Do not make any preorder. Always PAY ON DELIVERY!",
    backgroundColor: "#6ee7b7", // emerald-300
    active: true,
    order: 0,
    createdAt: new Date(),
};

export function AnnouncementCarousel() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([disclaimerSlide]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');

    // Fetch announcements on mount
    useEffect(() => {
        const loadAnnouncements = async () => {
            try {
                const data = await getActiveAnnouncements();
                setAnnouncements([disclaimerSlide, ...data]);
            } catch (error) {
                console.error("Error loading announcements:", error);
                setAnnouncements([disclaimerSlide]);
            } finally {
                setLoading(false);
            }
        };
        loadAnnouncements();
    }, []);

    // Slide to next with animation
    const goToNext = useCallback(() => {
        if (announcements.length > 1 && !isAnimating) {
            setSlideDirection('left');
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % announcements.length);
                setIsAnimating(false);
            }, 300);
        }
    }, [announcements.length, isAnimating]);

    // Slide to previous with animation
    const goToPrev = useCallback(() => {
        if (announcements.length > 1 && !isAnimating) {
            setSlideDirection('right');
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentIndex((prev) =>
                    prev === 0 ? announcements.length - 1 : prev - 1
                );
                setIsAnimating(false);
            }, 300);
        }
    }, [announcements.length, isAnimating]);

    // Go to specific slide
    const goToSlide = (index: number) => {
        if (index === currentIndex || isAnimating) return;
        setSlideDirection(index > currentIndex ? 'left' : 'right');
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentIndex(index);
            setIsAnimating(false);
        }, 300);
    };

    // Auto-scroll every 5 seconds
    useEffect(() => {
        if (announcements.length <= 1 || isPaused) return;

        const interval = setInterval(goToNext, 5000);
        return () => clearInterval(interval);
    }, [announcements.length, isPaused, goToNext]);

    // Loading state
    if (loading) {
        return (
            <div className="w-full h-48 md:h-64 bg-emerald-100 animate-pulse rounded-lg" />
        );
    }

    const currentAnnouncement = announcements[currentIndex];
    const isDisclaimer = currentAnnouncement.id === "disclaimer";

    // Animation classes based on direction
    const getSlideClass = () => {
        if (!isAnimating) return "translate-x-0 opacity-100";
        return slideDirection === 'left'
            ? "-translate-x-full opacity-0"
            : "translate-x-full opacity-0";
    };

    return (
        <div
            className="relative w-full overflow-hidden rounded-lg shadow-md"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Carousel Content with Slide Animation */}
            <div
                className="relative h-48 md:h-64 overflow-hidden"
                style={{
                    backgroundColor: currentAnnouncement.type === 'text'
                        ? (currentAnnouncement.backgroundColor || '#059669')
                        : '#f0fdf4'
                }}
            >
                {/* Clickable Wrapper - only when link exists */}
                {currentAnnouncement.link ? (
                    currentAnnouncement.link.startsWith('http') ? (
                        <a
                            href={currentAnnouncement.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out cursor-pointer ${getSlideClass()}`}
                        >
                            {currentAnnouncement.type === 'image' && currentAnnouncement.imageUrl ? (
                                <img
                                    src={currentAnnouncement.imageUrl}
                                    alt={currentAnnouncement.title || "Announcement"}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-center px-8 md:px-16">
                                    {isDisclaimer && (
                                        <AlertTriangle className="w-8 h-8 text-black mx-auto mb-2" />
                                    )}
                                    {currentAnnouncement.title && (
                                        <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                                            {currentAnnouncement.title}
                                        </h3>
                                    )}
                                    {currentAnnouncement.message && (
                                        <p className={`text-sm md:text-base ${isDisclaimer ? 'text-black font-medium' : 'text-white/90'
                                            }`}>
                                            {currentAnnouncement.message}
                                        </p>
                                    )}
                                </div>
                            )}
                        </a>
                    ) : (
                        <Link
                            to={currentAnnouncement.link}
                            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out cursor-pointer ${getSlideClass()}`}
                        >
                            {currentAnnouncement.type === 'image' && currentAnnouncement.imageUrl ? (
                                <img
                                    src={currentAnnouncement.imageUrl}
                                    alt={currentAnnouncement.title || "Announcement"}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-center px-8 md:px-16">
                                    {isDisclaimer && (
                                        <AlertTriangle className="w-8 h-8 text-black mx-auto mb-2" />
                                    )}
                                    {currentAnnouncement.title && (
                                        <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                                            {currentAnnouncement.title}
                                        </h3>
                                    )}
                                    {currentAnnouncement.message && (
                                        <p className={`text-sm md:text-base ${isDisclaimer ? 'text-black font-medium' : 'text-white/90'
                                            }`}>
                                            {currentAnnouncement.message}
                                        </p>
                                    )}
                                </div>
                            )}
                        </Link>
                    )
                ) : (
                    <div
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${getSlideClass()}`}
                    >
                        {currentAnnouncement.type === 'image' && currentAnnouncement.imageUrl ? (
                            <img
                                src={currentAnnouncement.imageUrl}
                                alt={currentAnnouncement.title || "Announcement"}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-center px-8 md:px-16">
                                {isDisclaimer && (
                                    <AlertTriangle className="w-8 h-8 text-black mx-auto mb-2" />
                                )}
                                {currentAnnouncement.title && (
                                    <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                                        {currentAnnouncement.title}
                                    </h3>
                                )}
                                {currentAnnouncement.message && (
                                    <p className={`text-sm md:text-base ${isDisclaimer ? 'text-black font-medium' : 'text-white/90'
                                        }`}>
                                        {currentAnnouncement.message}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Navigation Arrows */}
            {announcements.length > 1 && (
                <>
                    <button
                        onClick={goToPrev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-emerald-700 p-1.5 rounded-full shadow-md transition-all"
                        aria-label="Previous"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-emerald-700 p-1.5 rounded-full shadow-md transition-all"
                        aria-label="Next"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </>
            )}

            {/* Dot Indicators */}
            {announcements.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5">
                    {announcements.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                                ? "bg-emerald-600 scale-110"
                                : "bg-white/70 hover:bg-white"
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
