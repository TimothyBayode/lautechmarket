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

export type EventType =
    | "whatsapp_order"
    | "add_to_cart"
    | "product_view"
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

        // If it's an order, view, or cart addition, update the product counter directly
        if (type === "whatsapp_order" && data.productId) {
            await updateProductCounter(data.productId, "orderCount");
        } else if (type === "product_view" && data.productId) {
            await updateProductCounter(data.productId, "viewCount");
        } else if (type === "add_to_cart" && data.productId) {
            await updateProductCounter(data.productId, "cartCount");
        }
    } catch (error) {
        console.error("Error logging event:", error);
    }
};

/**
 * Records a search query
 */
export const logSearch = async (query: string) => {
    if (!query.trim()) return;
    try {
        await addDoc(collection(db, "searches"), {
            query: query.trim().toLowerCase(),
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error logging search:", error);
    }
};

/**
 * Increments a counter on a product document
 */
const updateProductCounter = async (productId: string, field: "orderCount" | "viewCount" | "cartCount") => {
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
 * Tracks a general site visit
 */
export const trackVisit = async () => {
    try {
        const statsRef = doc(db, "analytics", "dashboard");
        const statsDoc = await getDoc(statsRef);

        if (!statsDoc.exists()) {
            await setDoc(statsRef, {
                totalVisits: 1,
                uniqueVisitors: 1,
                lastUpdated: serverTimestamp()
            });
        } else {
            // Simple logic: increment totalVisits
            // In a real app, unique visitors would check localStorage
            await updateDoc(statsRef, {
                totalVisits: increment(1),
                lastUpdated: serverTimestamp()
            });

            // Increment uniqueVisitors if not visited today (simplified)
            const lastVisit = localStorage.getItem('last_visit');
            const today = new Date().toDateString();
            if (lastVisit !== today) {
                await updateDoc(statsRef, {
                    uniqueVisitors: increment(1)
                });
                localStorage.setItem('last_visit', today);
            }
        }
    } catch (error) {
        console.error("Error tracking visit:", error);
    }
};

/**
 * Gets general site analytics
 */
export const getAnalytics = async () => {
    try {
        const statsRef = doc(db, "analytics", "dashboard");
        const statsDoc = await getDoc(statsRef);

        if (statsDoc.exists()) {
            const data = statsDoc.data();
            return {
                totalVisits: data.totalVisits || 0,
                uniqueVisitors: data.uniqueVisitors || 0
            };
        }
    } catch (error) {
        console.error("Error getting analytics:", error);
    }
    return { totalVisits: 0, uniqueVisitors: 0 };
};
