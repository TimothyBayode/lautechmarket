/**
 * Vendor Contacts Service
 * Tracks student-vendor interactions and collects feedback
 */

import { db } from '../firebase';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    getDocs,
    getDoc,
    serverTimestamp,
    Timestamp,
    orderBy,
    limit
} from 'firebase/firestore';
import { ContactFeedback, VendorContact } from '../types';
import { updateVendorMetrics } from './vendorMetrics';

/**
 * Log when a student contacts a vendor
 */
export const logVendorContact = async (
    vendorId: string,
    studentId: string,
    contactMethod: 'whatsapp' | 'call' = 'whatsapp',
    productId?: string
): Promise<string> => {
    try {
        const contactRef = await addDoc(collection(db, 'vendorContacts'), {
            vendorId,
            studentId,
            contactedAt: serverTimestamp(),
            contactMethod,
            productId: productId || null,
            feedbackSubmitted: false
        });

        console.log('[Contact] Logged contact:', contactRef.id);
        return contactRef.id;
    } catch (error) {
        console.error('[Contact] Error logging contact:', error);
        throw error;
    }
};

/**
 * Submit feedback for a vendor contact
 */
export const submitContactFeedback = async (
    contactId: string,
    feedback: ContactFeedback
): Promise<void> => {
    try {
        await updateDoc(doc(db, 'vendorContacts', contactId), {
            feedbackSubmitted: true,
            responseTime: feedback.responseTime,
            wasHelpful: feedback.wasHelpful,
            purchaseMade: feedback.purchaseMade,
            feedbackNote: feedback.note || '',
            feedbackAt: serverTimestamp()
        });

        console.log('[Contact] Feedback submitted for:', contactId);

        // Get vendor ID and trigger metrics recalculation
        const contactDoc = await getDoc(doc(db, 'vendorContacts', contactId));
        if (contactDoc.exists()) {
            const vendorId = contactDoc.data().vendorId;
            await updateVendorMetrics(vendorId);
        }
    } catch (error) {
        console.error('[Contact] Error submitting feedback:', error);
        throw error;
    }
};

/**
 * Get pending feedback requests for a student
 * Returns contacts that are 24+ hours old and haven't received feedback
 */
export const getPendingFeedback = async (studentId: string): Promise<VendorContact[]> => {
    try {
        const q = query(
            collection(db, 'vendorContacts'),
            where('studentId', '==', studentId),
            where('feedbackSubmitted', '==', false)
        );

        const snapshot = await getDocs(q);
        const contacts: VendorContact[] = [];

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const contactedAt = (data.contactedAt as Timestamp)?.toDate();

            if (!contactedAt) continue;

            const hoursSince = (Date.now() - contactedAt.getTime()) / (1000 * 60 * 60);

            // Only request feedback if 15+ minutes have passed (for testing)
            if (hoursSince >= 0.25) {
                // Get vendor name for display
                const vendorDoc = await getDoc(doc(db, 'vendors', data.vendorId));
                const vendorName = vendorDoc.exists() ? vendorDoc.data().businessName : 'Unknown Vendor';

                contacts.push({
                    id: docSnap.id,
                    vendorId: data.vendorId,
                    studentId: data.studentId,
                    contactedAt,
                    contactMethod: data.contactMethod,
                    productId: data.productId,
                    feedbackSubmitted: false,
                    vendorName // Add for UI display
                } as any);
            }
        }

        return contacts;
    } catch (error) {
        console.error('[Contact] Error getting pending feedback:', error);
        return [];
    }
};

/**
 * Get contact statistics for a vendor
 */
export const getVendorContactStats = async (vendorId: string) => {
    try {
        const q = query(
            collection(db, 'vendorContacts'),
            where('vendorId', '==', vendorId)
        );

        const snapshot = await getDocs(q);
        const totalContacts = snapshot.size;
        const feedbackCount = snapshot.docs.filter(doc => doc.data().feedbackSubmitted).length;

        return {
            totalContacts,
            feedbackCount,
            feedbackRate: totalContacts > 0 ? (feedbackCount / totalContacts) * 100 : 0
        };
    } catch (error) {
        console.error('[Contact] Error getting contact stats:', error);
        return { totalContacts: 0, feedbackCount: 0, feedbackRate: 0 };
    }
};
/**
 * Get recent feedback notes from students
 */
export const getRecentFeedbackNotes = async (max: number = 20) => {
    try {
        const q = query(
            collection(db, 'vendorContacts'),
            where('feedbackSubmitted', '==', true),
            orderBy('feedbackAt', 'desc'),
            limit(max)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(),
            feedbackAt: docSnap.data().feedbackAt?.toDate() || new Date()
        }));
    } catch (error) {
        console.error('[Contact] Error fetching feedback notes:', error);
        return [];
    }
};
