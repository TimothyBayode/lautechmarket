/**
 * Vendor Activity Service
 * Tracks vendor login and platform activity
 */

import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp, query, collection, where, getDocs, getDoc } from 'firebase/firestore';

/**
 * Track vendor login/activity
 * Call this when vendor logs in or performs any action
 */
export const trackVendorActivity = async (vendorId: string): Promise<void> => {
    try {
        await updateDoc(doc(db, 'vendors', vendorId), {
            lastActive: serverTimestamp(),
            isActiveNow: true
        });

        console.log('[Activity] Tracked activity for vendor:', vendorId);
    } catch (error) {
        console.error('[Activity] Error tracking activity:', error);
    }
};

/**
 * Mark vendors as inactive if they haven't been active in 15 minutes
 * This should be run periodically (e.g., every 5 minutes via a cron job or Cloud Function)
 */
export const updateInactiveVendors = async (): Promise<number> => {
    try {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

        const q = query(
            collection(db, 'vendors'),
            where('isActiveNow', '==', true)
        );

        const snapshot = await getDocs(q);
        let updatedCount = 0;

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const lastActive = data.lastActive?.toDate ? data.lastActive.toDate() : null;

            if (lastActive && lastActive < fifteenMinutesAgo) {
                await updateDoc(docSnap.ref, {
                    isActiveNow: false
                });
                updatedCount++;
            }
        }

        console.log(`[Activity] Marked ${updatedCount} vendors as inactive`);
        return updatedCount;
    } catch (error) {
        console.error('[Activity] Error updating inactive vendors:', error);
        return 0;
    }
};

/**
 * Get vendor's last active time
 */
export const getVendorLastActive = async (vendorId: string): Promise<Date | null> => {
    try {
        const vendorDoc = await getDoc(doc(db, 'vendors', vendorId));
        const data = vendorDoc.data();

        if (data?.lastActive?.toDate) {
            return data.lastActive.toDate();
        }

        return null;
    } catch (error) {
        console.error('[Activity] Error getting last active:', error);
        return null;
    }
};

/**
 * Format last active time for display
 */
export const formatLastActive = (lastActive: Date | null): string => {
    if (!lastActive) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return lastActive.toLocaleDateString();
};
