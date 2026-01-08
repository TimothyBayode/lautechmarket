import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

let app: App | null = null;
let db: Firestore | null = null;

// Lazy initialize Firebase Admin
function getDB(): Firestore {
    if (!db) {
        if (getApps().length === 0) {
            const privateKey = process.env.FIREBASE_PRIVATE_KEY;
            if (!privateKey) {
                throw new Error('FIREBASE_PRIVATE_KEY is not set');
            }

            // Handle both escaped and unescaped newlines
            const formattedKey = privateKey.includes('\\n')
                ? privateKey.replace(/\\n/g, '\n')
                : privateKey;

            app = initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: formattedKey,
                }),
            });
        }
        db = getFirestore();
    }
    return db;
}

// Hash IP for privacy
function hashIP(ip: string, vendorId: string): string {
    return crypto.createHash('sha256').update(`${ip}_${vendorId}`).digest('hex');
}

// Get client IP from various headers
function getClientIP(req: VercelRequest): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    const realIP = req.headers['x-real-ip'];
    if (typeof realIP === 'string') {
        return realIP;
    }
    return req.socket?.remoteAddress || 'unknown';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Allow GET for testing
    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'API is running',
            hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
            hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
            hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        });
    }

    // Only allow POST for tracking
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const firestore = getDB();
        const { vendorId, isExternal } = req.body;

        // Validate input
        if (!vendorId) {
            return res.status(400).json({ error: 'vendorId is required' });
        }

        // Only count external visits
        if (!isExternal) {
            return res.status(200).json({ counted: false, reason: 'Internal visit' });
        }

        // Get and hash IP
        const clientIP = getClientIP(req);
        if (clientIP === 'unknown') {
            return res.status(200).json({ counted: false, reason: 'Unknown IP' });
        }

        const ipHash = hashIP(clientIP, vendorId);

        // Check if this IP already visited this vendor
        const vendorVisitsRef = firestore.collection('vendorVisits').doc(vendorId);
        const ipRef = vendorVisitsRef.collection('ips').doc(ipHash);
        const ipDoc = await ipRef.get();

        if (ipDoc.exists) {
            // Already counted this IP for this vendor
            return res.status(200).json({ counted: false, reason: 'Already counted' });
        }

        // New unique visit - save IP and increment count
        const batch = firestore.batch();

        // Save IP hash
        batch.set(ipRef, {
            firstVisit: new Date(),
        });

        // Get current count and increment
        const vendorDoc = await vendorVisitsRef.get();
        const currentCount = vendorDoc.exists ? (vendorDoc.data()?.count || 0) : 0;

        batch.set(vendorVisitsRef, {
            count: currentCount + 1,
            lastUpdated: new Date(),
        }, { merge: true });

        await batch.commit();

        return res.status(200).json({ counted: true, newCount: currentCount + 1 });
    } catch (error: any) {
        console.error('Error tracking visit:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
