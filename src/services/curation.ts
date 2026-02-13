/**
 * Curation Service
 * Manages "Top 3", "Featured", and "Certified Best" lists
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
    deleteDoc,
    serverTimestamp,
    orderBy
} from 'firebase/firestore';
import { CuratedList, Vendor } from '../types';
import { normalizeVendorData } from './vendorAuth';

/**
 * Get all active curated lists
 */
export const getActiveCuratedLists = async (): Promise<CuratedList[]> => {
    try {
        const q = query(
            collection(db, 'curatedLists'),
            where('active', '==', true),
            orderBy('order', 'asc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as CuratedList));
    } catch (error) {
        console.error('[Curation] Error fetching active lists:', error);
        return [];
    }
};

/**
 * Get curated lists by type
 */
export const getCuratedListsByType = async (type: 'top_3' | 'featured' | 'certified'): Promise<CuratedList[]> => {
    try {
        const q = query(
            collection(db, 'curatedLists'),
            where('active', '==', true),
            where('type', '==', type),
            orderBy('order', 'asc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as CuratedList));
    } catch (error) {
        console.error('[Curation] Error fetching lists by type:', error);
        return [];
    }
};

/**
 * Get a specific curated list with populated vendor data
 */
export const getCuratedListWithVendors = async (listId: string): Promise<{ list: CuratedList, vendors: Vendor[] } | null> => {
    try {
        // Get list
        const listDoc = await getDoc(doc(db, 'curatedLists', listId));
        if (!listDoc.exists()) return null;

        const list = { id: listDoc.id, ...listDoc.data() } as CuratedList;

        // Get vendors
        const vendors: Vendor[] = [];
        for (const vendorId of list.vendorIds) {
            const vendorDoc = await getDoc(doc(db, 'vendors', vendorId));
            if (vendorDoc.exists()) {
                vendors.push(normalizeVendorData(vendorDoc));
            }
        }

        return { list, vendors };
    } catch (error) {
        console.error('[Curation] Error fetching list details:', error);
        return null;
    }
};

/**
 * Create a new curated list (Admin)
 */
export const createCuratedList = async (data: Omit<CuratedList, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const docRef = doc(collection(db, 'curatedLists'));
        await setDoc(docRef, {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error('[Curation] Error creating list:', error);
        throw error;
    }
};

/**
 * Update a curated list (Admin)
 */
export const updateCuratedList = async (listId: string, data: Partial<CuratedList>): Promise<void> => {
    try {
        await updateDoc(doc(db, 'curatedLists', listId), {
            ...data,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('[Curation] Error updating list:', error);
        throw error;
    }
};

/**
 * Delete a curated list (Admin)
 */
export const deleteCuratedList = async (listId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'curatedLists', listId));
    } catch (error) {
        console.error('[Curation] Error deleting list:', error);
        throw error;
    }
};
