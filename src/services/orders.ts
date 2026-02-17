import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    getDocs,
    limit,
    serverTimestamp,
    increment,
    setDoc
} from "firebase/firestore";
import { db } from "../firebase";

export interface Order {
    id: string;
    orderId: string; // LM-10023
    productId: string;
    productName: string;
    productImage?: string;
    listedPrice: number;
    vendorId: string;
    vendorName: string;
    whatsappNumber: string;
    studentFingerprint: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    isCompleted: boolean;
    finalAmount?: number;
    createdAt: Date;
    confirmedAt?: Date;
    category: string;
}

/**
 * Generates a readable Order ID: LM-XXXXXX
 */
const generateOrderId = (): string => {
    const timestamp = Date.now().toString().slice(-6);
    return `LM-${timestamp}`;
};

/**
 * Get or create a unique student fingerprint for repeat buyer tracking
 */
export const getStudentFingerprint = (): string => {
    let fp = localStorage.getItem('lautech_market_fp');
    if (!fp) {
        fp = 'fp_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('lautech_market_fp', fp);
    }
    return fp;
};

/**
 * Create a new pending order when student clicks "Order Now"
 */
export const createPendingOrder = async (product: any): Promise<string> => {
    try {
        const orderId = generateOrderId();
        const fingerprint = getStudentFingerprint();

        const orderData = {
            orderId,
            productId: product.id,
            productName: product.name,
            productImage: product.image || '',
            listedPrice: product.price,
            vendorId: product.vendorId,
            vendorName: product.vendorName,
            whatsappNumber: product.whatsappNumber,
            studentFingerprint: fingerprint,
            status: 'pending',
            isCompleted: false,
            createdAt: serverTimestamp(),
            category: product.category || 'Uncategorized'
        };

        await addDoc(collection(db, "orders"), orderData);

        // Also log this as an analytics event via a separate service if needed, 
        // but for now, we have the order record.

        // UPDATE: Increment the product's orderCount so it shows "X orders" on the card
        const productRef = doc(db, "products", product.id);
        await updateDoc(productRef, {
            orderCount: increment(1)
        });

        return orderId;
    } catch (error) {
        console.error("Error creating pending order:", error);
        throw error;
    }
};

/**
 * Get pending orders for a vendor
 */
export const getVendorOrders = async (vendorId: string, status?: 'pending' | 'confirmed' | 'cancelled'): Promise<Order[]> => {
    try {
        let q = query(collection(db, "orders"), where("vendorId", "==", vendorId));

        if (status) {
            q = query(q, where("status", "==", status));
        }

        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                confirmedAt: data.confirmedAt?.toDate() || undefined
            } as Order;
        });

        // Sort in memory to avoid missing index errors
        return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
        console.error("Error fetching vendor orders:", error);
        return [];
    }
};

/**
 * Confirm an order by a vendor
 */
export const confirmOrder = async (
    orderId: string,
    isCompleted: boolean,
    finalAmount?: number
): Promise<void> => {
    try {
        const orderRef = doc(db, "orders", orderId);
        const updateData: any = {
            status: isCompleted ? 'confirmed' : 'cancelled',
            isCompleted,
            confirmedAt: serverTimestamp()
        };

        if (isCompleted && finalAmount !== undefined) {
            updateData.finalAmount = finalAmount;

            // Update global GMV metrics
            await updateGMVMetrics(finalAmount);
        }

        await updateDoc(orderRef, updateData);
    } catch (error) {
        console.error("Error confirming order:", error);
        throw error;
    }
};

/**
 * Internal: Update rolling GMV metrics
 */
const updateGMVMetrics = async (amount: number) => {
    try {
        const now = new Date();
        const day = now.toISOString().split('T')[0];
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Update overall
        const globalRef = doc(db, "gmv_stats", "overall");
        await setDoc(globalRef, {
            totalGMV: increment(amount),
            totalOrders: increment(1),
            lastUpdated: serverTimestamp()
        }, { merge: true });

        // Update daily
        const dailyRef = doc(db, "gmv_stats", `day_${day}`);
        await setDoc(dailyRef, {
            gmv: increment(amount),
            orders: increment(1),
            lastUpdated: serverTimestamp()
        }, { merge: true });

        // Update monthly
        const monthlyRef = doc(db, "gmv_stats", `month_${month}`);
        await setDoc(monthlyRef, {
            gmv: increment(amount),
            orders: increment(1),
            lastUpdated: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.warn("Could not update GMV aggregation stats:", error);
    }
};

/**
 * Get recent orders for admin
 */
export const getRecentOrders = async (count: number = 50): Promise<Order[]> => {
    try {
        const q = query(
            collection(db, "orders"),
            limit(count)
        );
        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                confirmedAt: data.confirmedAt?.toDate() || undefined
            } as Order;
        });

        // Sort in memory
        return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
        console.error("Error fetching recent orders:", error);
        return [];
    }
};
/**
 * Get historical GMV data for charts
 */
export const getGMVHistory = async (type: 'daily' | 'monthly', count: number = 12): Promise<{ date: string; gmv: number; orders: number }[]> => {
    try {
        const prefix = type === 'daily' ? 'day_' : 'month_';
        const q = query(
            collection(db, "gmv_stats"),
            limit(count + 20) // Get plenty for filtering
        );

        const snapshot = await getDocs(q);
        const history = snapshot.docs
            .filter(doc => doc.id.startsWith(prefix))
            .map(doc => {
                const data = doc.data();
                return {
                    date: doc.id.replace(prefix, ''),
                    gmv: data.gmv || 0,
                    orders: data.orders || 0
                };
            })
            .sort((a, b) => a.date.localeCompare(b.date)); // Sort chronological

        return history.slice(-count); // Take most recent requested count

        return history;
    } catch (error) {
        console.error("Error fetching GMV history:", error);
        return [];
    }
};
