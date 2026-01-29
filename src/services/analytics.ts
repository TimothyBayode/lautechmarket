import {
    collection,
    addDoc,
    serverTimestamp,
    increment,
    doc,
    updateDoc
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

        // If it's an order or view, we also update the product counter directly
        if (type === "whatsapp_order" && data.productId) {
            await updateProductCounter(data.productId, "orderCount");
        } else if (type === "product_view" && data.productId) {
            await updateProductCounter(data.productId, "viewCount");
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
const updateProductCounter = async (productId: string, field: "orderCount" | "viewCount") => {
    try {
        const productRef = doc(db, "products", productId);
        await updateDoc(productRef, {
            [field]: increment(1)
        });
    } catch (error) {
        console.error(`Error updating product ${field}:`, error);
    }
};
