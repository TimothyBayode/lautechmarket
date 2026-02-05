import {
    collection,
    addDoc,
    serverTimestamp,
    increment,
    doc,
    updateDoc,
    getDoc,
    setDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { getCurrentVendor } from "./vendorAuth";

export type EventType =
    | "whatsapp_order"
    | "add_to_cart"
    | "product_view"
    | "compare_click"
    | "search";

/**
 * Logs a user interaction event to Firestore
 */
export const logEvent = async (
    type: EventType,
    data: {
        productId?: string;
        vendorId?: string;
        query?: string;
        category?: string;
    }
) => {
    try {
        await addDoc(collection(db, "analytics_events"), {
            type,
            ...data,
            timestamp: serverTimestamp(),
        });

        // 2. Update product counters if not throttled/manipulated
        if (data.productId) {
            // Anti-manipulation: Block vendor self-interaction
            const vendor = getCurrentVendor();
            if (vendor && vendor.id === data.vendorId) {
                console.log(`[Analytics] Self-interaction detected for ${type} on product ${data.productId}. Counter not incremented.`);
                return;
            }

            // Anti-manipulation: Throttling
            if (shouldThrottle(type, data.productId)) {
                console.log(`[Analytics] ${type} throttled for product ${data.productId}.`);
                return;
            }

            if (type === "whatsapp_order") {
                await updateProductCounter(data.productId, "orderCount");
            } else if (type === "product_view") {
                await updateProductCounter(data.productId, "viewCount");
            } else if (type === "add_to_cart") {
                await updateProductCounter(data.productId, "cartCount");
            } else if (type === "compare_click") {
                await updateProductCounter(data.productId, "compareCount");
            }
        }
    } catch (error) {
        console.error("Error logging event:", error);
    }
};

/**
 * Records a search query
 */
export const logSearch = async (query: string, resultsCount: number = 0) => {
    if (!query.trim()) return;
    try {
        console.log(`[Analytics] Logging search: "${query}" with ${resultsCount} results`);
        await addDoc(collection(db, "searches"), {
            query: query.trim().toLowerCase(),
            resultsCount,
            timestamp: serverTimestamp(),
        });
        console.log(`[Analytics] Search logged successfully`);
    } catch (error) {
        console.error("Error logging search:", error);
    }
};

/**
 * Checks if an interaction should be throttled to prevent manipulation
 */
const shouldThrottle = (type: EventType, productId: string): boolean => {
    try {
        const key = `lautech_market_throttle_${type}_${productId}`;
        const lastInteraction = localStorage.getItem(key);
        const now = Date.now();

        if (lastInteraction) {
            const lastTime = parseInt(lastInteraction);
            const timeDiff = now - lastTime;

            // Define limits: 24h for views, 1h for cart/orders
            const limit = type === "product_view"
                ? 24 * 60 * 60 * 1000 // 24 hours
                : 60 * 60 * 1000;      // 1 hour

            if (timeDiff < limit) {
                return true;
            }
        }

        localStorage.setItem(key, now.toString());
        return false;
    } catch (error) {
        // Fallback: if localStorage fails, don't throttle (better to have data than none)
        return false;
    }
};

/**
 * Increments a counter on a product document
 */
const updateProductCounter = async (productId: string, field: "orderCount" | "viewCount" | "cartCount" | "compareCount") => {
    try {
        const productRef = doc(db, "products", productId);
        await updateDoc(productRef, {
            [field]: increment(1)
        });
    } catch (error) {
        console.error(`Error updating product ${field}:`, error);
    }
};

/**
 * Helper to get period identifiers
 */
const getPeriods = () => {
    const now = new Date();

    // Day: YYYY-MM-DD
    const day = now.toISOString().split('T')[0];

    // Month: YYYY-MM
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Year: YYYY
    const year = `${now.getFullYear()}`;

    // Week: ISO Week (simplified)
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const week = `${now.getFullYear()}-W${Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7)}`;

    return { day, week, month, year };
};

/**
 * Tracks a general site visit across multiple periods
 */
export const trackVisit = async () => {
    try {
        const periods = getPeriods();
        const periodKeys = [
            { id: "dashboard", storageKey: "last_visit_total" }, // Global
            { id: `period_day_${periods.day}`, storageKey: `last_visit_day_${periods.day}` },
            { id: `period_week_${periods.week}`, storageKey: `last_visit_week_${periods.week}` },
            { id: `period_month_${periods.month}`, storageKey: `last_visit_month_${periods.month}` },
            { id: `period_year_${periods.year}`, storageKey: `last_visit_year_${periods.year}` },
        ];

        for (const { id, storageKey } of periodKeys) {
            const statsRef = doc(db, "analytics", id);
            const statsDoc = await getDoc(statsRef);

            const isUnique = !localStorage.getItem(storageKey);

            if (!statsDoc.exists()) {
                await setDoc(statsRef, {
                    totalVisits: 1,
                    uniqueVisitors: 1,
                    lastUpdated: serverTimestamp()
                });
            } else {
                await updateDoc(statsRef, {
                    totalVisits: increment(1),
                    uniqueVisitors: isUnique ? increment(1) : increment(0),
                    lastUpdated: serverTimestamp()
                });
            }

            if (isUnique) {
                localStorage.setItem(storageKey, 'true');

                // Cleanup old keys (optional but good for long-term storage)
                if (id.startsWith('period_day') && Math.random() < 0.1) {
                    // Randomly cleanup could be implemented here
                }
            }
        }
    } catch (error) {
        console.error("Error tracking visit:", error);
    }
};

/**
 * Gets general and periodic site analytics
 */
export const getAnalytics = async () => {
    try {
        const periods = getPeriods();
        const periodIds = {
            total: "dashboard",
            daily: `period_day_${periods.day}`,
            weekly: `period_week_${periods.week}`,
            monthly: `period_month_${periods.month}`,
            yearly: `period_year_${periods.year}`
        };

        const results: any = {};

        for (const [key, id] of Object.entries(periodIds)) {
            const statsRef = doc(db, "analytics", id);
            const statsDoc = await getDoc(statsRef);
            if (statsDoc.exists()) {
                const data = statsDoc.data();
                results[key] = {
                    totalVisits: data.totalVisits || 0,
                    uniqueVisitors: data.uniqueVisitors || 0
                };
            } else {
                results[key] = { totalVisits: 0, uniqueVisitors: 0 };
            }
        }

        return results;
    } catch (error) {
        console.error("Error getting analytics:", error);
    }
    return null;
};
