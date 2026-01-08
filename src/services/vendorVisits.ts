/**
 * Vendor Visits Service
 * 
 * Manages vendor store visit tracking and leaderboard functionality.
 * Uses Firebase to store visit counts and history.
 */

import { db } from "../firebase";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    writeBatch,
    query,
    orderBy,
    limit,
    Timestamp,
} from "firebase/firestore";

const COLLECTION_NAME = "vendorVisits";
const HISTORY_COLLECTION = "visitHistory";

export interface VendorVisitData {
    vendorId: string;
    vendorName: string;
    count: number;
    rank?: number;
}

export interface VisitHistoryPeriod {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    rankings: VendorVisitData[];
}

/**
 * Track a visit to a vendor's store (called from client)
 */
export const trackStoreVisit = async (vendorId: string, isExternal: boolean): Promise<boolean> => {
    try {
        const response = await fetch('/api/track-visit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ vendorId, isExternal }),
        });

        const data = await response.json();
        return data.counted === true;
    } catch (error) {
        console.error("Error tracking store visit:", error);
        return false;
    }
};

/**
 * Get the visits leaderboard (all vendors ranked by visit count)
 */
export const getVisitsLeaderboard = async (): Promise<VendorVisitData[]> => {
    try {
        const visitsRef = collection(db, COLLECTION_NAME);
        const snapshot = await getDocs(visitsRef);

        const leaderboard: VendorVisitData[] = [];

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();

            // Get vendor name from vendors collection
            const vendorDoc = await getDoc(doc(db, "vendors", docSnap.id));
            const vendorName = vendorDoc.exists()
                ? vendorDoc.data()?.businessName || "Unknown Vendor"
                : "Unknown Vendor";

            leaderboard.push({
                vendorId: docSnap.id,
                vendorName,
                count: data.count || 0,
            });
        }

        // Sort by count descending and add ranks
        leaderboard.sort((a, b) => b.count - a.count);
        leaderboard.forEach((item, index) => {
            item.rank = index + 1;
        });

        return leaderboard;
    } catch (error) {
        console.error("Error getting visits leaderboard:", error);
        return [];
    }
};

/**
 * Get a single vendor's visit count
 */
export const getVendorVisitCount = async (vendorId: string): Promise<number> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, vendorId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data()?.count || 0;
        }
        return 0;
    } catch (error) {
        console.error("Error getting vendor visit count:", error);
        return 0;
    }
};

/**
 * Reset all visits and archive current data
 */
export const resetVisits = async (periodName: string): Promise<boolean> => {
    try {
        // Get current leaderboard for archiving
        const currentLeaderboard = await getVisitsLeaderboard();

        if (currentLeaderboard.length === 0) {
            console.log("No data to archive");
            return true;
        }

        const batch = writeBatch(db);

        // Archive current data
        const historyRef = doc(collection(db, HISTORY_COLLECTION));
        batch.set(historyRef, {
            name: periodName,
            startDate: Timestamp.now(),
            endDate: Timestamp.now(),
            rankings: currentLeaderboard,
            createdAt: Timestamp.now(),
        });

        // Delete all visit documents (reset counts)
        const visitsRef = collection(db, COLLECTION_NAME);
        const snapshot = await getDocs(visitsRef);

        for (const docSnap of snapshot.docs) {
            batch.delete(docSnap.ref);
        }

        await batch.commit();
        return true;
    } catch (error) {
        console.error("Error resetting visits:", error);
        return false;
    }
};

/**
 * Get visit history (past periods)
 */
export const getVisitHistory = async (limitCount: number = 12): Promise<VisitHistoryPeriod[]> => {
    try {
        const historyRef = collection(db, HISTORY_COLLECTION);
        const q = query(historyRef, orderBy("createdAt", "desc"), limit(limitCount));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                name: data.name,
                startDate: data.startDate?.toDate() || new Date(),
                endDate: data.endDate?.toDate() || new Date(),
                rankings: data.rankings || [],
            };
        });
    } catch (error) {
        console.error("Error getting visit history:", error);
        return [];
    }
};
