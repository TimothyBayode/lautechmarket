import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export type AuditAction =
    | "vendor_verify"
    | "vendor_unverify"
    | "vendor_delete"
    | "product_delete"
    | "config_update"
    | "admin_login";

/**
 * Logs an administrative action for audit purposes
 */
export const logAdminAction = async (
    adminEmail: string,
    action: AuditAction,
    data: {
        targetId?: string;
        targetName?: string;
        details?: string;
    }
) => {
    try {
        await addDoc(collection(db, "audit_logs"), {
            adminEmail,
            action,
            ...data,
            timestamp: serverTimestamp(),
        });
        console.log(`[Audit] Action logged: ${action} by ${adminEmail}`);
    } catch (error) {
        console.error("[Audit] Error logging action:", error);
    }
};

/**
 * Fetches recent audit logs for the admin dashboard
 */
export const getRecentAuditLogs = async (maxLogs: number = 50) => {
    try {
        const q = query(
            collection(db, "audit_logs"),
            orderBy("timestamp", "desc"),
            limit(maxLogs)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
    } catch (error) {
        console.error("[Audit] Error fetching logs:", error);
        return [];
    }
};
