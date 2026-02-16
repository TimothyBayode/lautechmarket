/**
 * Vendor Metrics Service
 * Calculates vendor performance metrics, trust scores, and assigns badges
 */

import { db } from '../firebase';
import {
    collection,
    doc,
    query,
    where,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { VendorBadge, VendorMetrics } from '../types';
import { logger } from '../utils/logger';

/**
 * Response time mapping for calculations
 */
const RESPONSE_TIME_MAP = {
    'under_30min': 15,      // Average 15 min
    '30min_2hr': 60,        // Average 1 hour
    '2hr_24hr': 12 * 60,    // Average 12 hours
    'over_24hr': 36 * 60,   // Average 36 hours
    'no_response': null     // No response
};

/**
 * Calculate and update vendor metrics based on feedback and activity
 */
export const updateVendorMetrics = async (vendorId: string): Promise<void> => {
    try {
        logger.log('[Metrics] Updating metrics for vendor:', vendorId);

        // Get all contacts for this vendor
        const contactsQuery = query(
            collection(db, 'vendorContacts'),
            where('vendorId', '==', vendorId)
        );
        const contactsSnapshot = await getDocs(contactsQuery);

        // Calculate feedback metrics
        const totalContacts = contactsSnapshot.size;
        const feedbackDocs = contactsSnapshot.docs.filter(doc => doc.data().feedbackSubmitted);
        const feedbackCount = feedbackDocs.length;

        if (feedbackCount === 0) {
            logger.log('[Metrics] No feedback yet for vendor:', vendorId);
            return;
        }

        // Calculate response metrics
        let totalResponseMinutes = 0;
        let responseCount = 0;
        let helpfulCount = 0;
        let purchaseCount = 0;

        feedbackDocs.forEach(docSnap => {
            const data = docSnap.data();
            const responseMinutes = RESPONSE_TIME_MAP[data.responseTime as keyof typeof RESPONSE_TIME_MAP];

            if (responseMinutes !== null) {
                totalResponseMinutes += responseMinutes;
                responseCount++;
            }

            if (data.wasHelpful) helpfulCount++;
            if (data.purchaseMade) purchaseCount++;
        });

        const averageResponseMinutes = responseCount > 0 ? totalResponseMinutes / responseCount : 0;
        const responseRate = (responseCount / feedbackCount) * 100;
        const helpfulRate = (helpfulCount / feedbackCount) * 100;
        const purchaseRate = (purchaseCount / feedbackCount) * 100;

        // Get vendor's claimed response time
        const vendorDoc = await getDoc(doc(db, 'vendors', vendorId));
        const vendorData = vendorDoc.data();
        const claimedResponseTime = vendorData?.claimedResponseTime || '24hr';

        // Get activity score
        const activityScore = await calculateActivityScore(vendorId, vendorData);

        // Calculate composite scores
        const responsivenessScore = calculateResponsivenessScore({
            averageResponseMinutes,
            responseRate,
            activityScore,
            claimedResponseTime
        });

        const trustScore = calculateTrustScore({
            responsivenessScore,
            helpfulRate,
            purchaseRate,
            feedbackCount
        });

        // Determine badges
        const badges = calculateBadges({
            averageResponseMinutes,
            responseRate,
            trustScore,
            activityScore,
            feedbackCount
        });

        // Update vendorMetrics collection
        await setDoc(doc(db, 'vendorMetrics', vendorId), {
            vendorId,
            claimedResponseTime,
            totalContacts,
            feedbackCount,
            averageResponseMinutes,
            responseRate,
            helpfulRate,
            purchaseRate,
            activityScore,
            responsivenessScore,
            trustScore,
            badges,
            lastCalculated: serverTimestamp(),
            lastActive: vendorData?.lastActive || null,
            isActiveNow: vendorData?.isActiveNow || false,
            loginFrequency: 0, // TODO: Calculate from login history
            productUpdateFrequency: 0 // TODO: Calculate from product updates
        });

        // Update vendor document for quick access
        const verificationLevel = (trustScore >= 90 && feedbackCount >= 10) ? 'pro' :
            (vendorData?.verificationLevel || (vendorData?.isVerified ? "verified" : "basic"));

        await updateDoc(doc(db, 'vendors', vendorId), {
            metrics: {
                responsivenessScore,
                trustScore,
                averageResponseMinutes,
                responseRate
            },
            verificationLevel,
            badges
        });

        logger.log('[Metrics] Updated metrics for vendor:', vendorId, {
            responsivenessScore,
            trustScore,
            badges: badges.map(b => b.type)
        });
    } catch (error) {
        console.error('[Metrics] Error updating metrics:', error);
        throw error;
    }
};

/**
 * Calculate activity score based on platform engagement (0-100)
 */
const calculateActivityScore = async (vendorId: string, vendorData?: any): Promise<number> => {
    try {
        if (!vendorData) {
            const vendorDoc = await getDoc(doc(db, 'vendors', vendorId));
            vendorData = vendorDoc.data();
        }

        if (!vendorData) return 0;

        const lastActive = vendorData.lastActive?.toDate ? vendorData.lastActive.toDate() : null;
        const now = new Date();

        // Score based on last active time
        let activityScore = 0;

        if (lastActive) {
            const minsSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60);

            if (minsSinceActive < 30) activityScore = 100;        // Active in last 30 mins (Online)
            else if (minsSinceActive < 120) activityScore = 80;   // Active last 2 hours
            else if (minsSinceActive < 1440) activityScore = 60;  // Active in last 24 hours
            else if (minsSinceActive < 4320) activityScore = 40;  // Active in last 3 days
            else activityScore = 20;                               // Inactive
        }

        return activityScore;
    } catch (error) {
        console.error('[Metrics] Error calculating activity score:', error);
        return 0;
    }
};

/**
 * Calculate responsiveness score (0-100)
 * Weighted combination of speed, response rate, and activity
 */
const calculateResponsivenessScore = (data: {
    averageResponseMinutes: number;
    responseRate: number;
    activityScore: number;
    claimedResponseTime: string;
}): number => {
    const { averageResponseMinutes, responseRate, activityScore } = data;

    // Response speed score (0-100)
    let speedScore = 0;
    if (averageResponseMinutes < 30) speedScore = 100;
    else if (averageResponseMinutes < 60) speedScore = 90;
    else if (averageResponseMinutes < 120) speedScore = 75;
    else if (averageResponseMinutes < 360) speedScore = 60;
    else if (averageResponseMinutes < 1440) speedScore = 40;
    else speedScore = 20;

    // Weighted combination
    const responsivenessScore = (
        speedScore * 0.4 +
        responseRate * 0.4 +
        activityScore * 0.2
    );

    return Math.round(responsivenessScore);
};

/**
 * Calculate overall trust score (0-100)
 * Combines responsiveness, helpfulness, and purchase conversion
 */
const calculateTrustScore = (data: {
    responsivenessScore: number;
    helpfulRate: number;
    purchaseRate: number;
    feedbackCount: number;
}): number => {
    const { responsivenessScore, helpfulRate, purchaseRate, feedbackCount } = data;

    // Confidence factor (more feedback = more confident)
    const confidenceFactor = Math.min(feedbackCount / 10, 1); // Max at 10 feedback

    const trustScore = (
        responsivenessScore * 0.4 +
        helpfulRate * 0.3 +
        purchaseRate * 0.3
    ) * confidenceFactor;

    return Math.round(trustScore);
};

/**
 * Calculate which badges vendor has earned
 */
const calculateBadges = (data: {
    averageResponseMinutes: number;
    responseRate: number;
    trustScore: number;
    activityScore: number;
    feedbackCount: number;
}): VendorBadge[] => {
    const badges: VendorBadge[] = [];
    const { averageResponseMinutes, responseRate, trustScore, activityScore, feedbackCount } = data;

    // Quick Response badge (⚡)
    if (averageResponseMinutes < 30 && responseRate > 80 && feedbackCount >= 5) {
        badges.push({
            type: 'quick_response',
            label: 'Quick Response',
            icon: '⚡',
            color: 'yellow',
            earnedAt: new Date(),
            criteria: 'Responds in under 30 minutes'
        });
    }

    // Reliable badge (✅)
    if (responseRate > 90 && feedbackCount >= 5) {
        badges.push({
            type: 'reliable',
            label: 'Reliable',
            icon: '✅',
            color: 'green',
            earnedAt: new Date(),
            criteria: '90%+ response rate'
        });
    }

    // Top Rated badge (🏆)
    if (trustScore > 80 && feedbackCount >= 10) {
        badges.push({
            type: 'top_rated',
            label: 'Top Rated',
            icon: '🏆',
            color: 'gold',
            earnedAt: new Date(),
            criteria: 'Excellent overall performance'
        });
    }

    // Active Now badge (🟢)
    if (activityScore === 100) {
        badges.push({
            type: 'active_now',
            label: 'Active Now',
            icon: '🟢',
            color: 'green',
            earnedAt: new Date(),
            criteria: 'Online in the last hour'
        });
    }

    return badges;
};

/**
 * Get vendor metrics (from cache or calculate if needed)
 */
export const getVendorMetrics = async (vendorId: string): Promise<VendorMetrics | null> => {
    try {
        const metricsDoc = await getDoc(doc(db, 'vendorMetrics', vendorId));

        if (metricsDoc.exists()) {
            const data = metricsDoc.data();
            return {
                ...data,
                lastActive: data.lastActive?.toDate ? data.lastActive.toDate() : new Date(),
                lastCalculated: data.lastCalculated?.toDate ? data.lastCalculated.toDate() : new Date(),
                badges: data.badges || []
            } as VendorMetrics;
        }

        return null;
    } catch (error) {
        console.error('[Metrics] Error getting vendor metrics:', error);
        return null;
    }
};

/**
 * Format response time for display
 */
export const formatResponseTime = (minutes: number): string => {
    if (minutes < 60) {
        return `${Math.round(minutes)} min`;
    } else if (minutes < 1440) {
        const hours = Math.round(minutes / 60);
        return `${hours} hr${hours > 1 ? 's' : ''}`;
    } else {
        const days = Math.round(minutes / 1440);
        return `${days} day${days > 1 ? 's' : ''}`;
    }
};
