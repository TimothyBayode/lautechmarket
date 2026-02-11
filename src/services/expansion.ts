import { db } from "../firebase";
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp
} from "firebase/firestore";
import { ExpansionResponse } from "../types";

const COLLECTION_NAME = "expansion_responses";

/**
 * Submit a new expansion response to Firestore
 */
export async function submitExpansionResponse(data: Omit<ExpansionResponse, 'id' | 'createdAt'>) {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            createdAt: serverTimestamp(),
            source: 'oja_form'
        });
        return docRef.id;
    } catch (error) {
        console.error("Error submitting expansion response:", error);
        throw error;
    }
}

/**
 * Get all expansion responses from Firestore
 */
export async function getExpansionResponses(): Promise<ExpansionResponse[]> {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
            } as ExpansionResponse;
        });
    } catch (error) {
        console.error("Error getting expansion responses:", error);
        throw error;
    }
}
/**
 * Delete an expansion response from Firestore
 */
export async function deleteExpansionResponse(id: string) {
    try {
        const { doc, deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
        console.error("Error deleting expansion response:", error);
        throw error;
    }
}
