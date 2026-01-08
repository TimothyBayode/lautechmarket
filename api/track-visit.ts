import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

// Initialize Firebase Admin (only once)
if (getApps().length === 0) {
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const db = getFirestore();

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
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
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
        const vendorVisitsRef = db.collection('vendorVisits').doc(vendorId);
        const ipRef = vendorVisitsRef.collection('ips').doc(ipHash);
        const ipDoc = await ipRef.get();

        if (ipDoc.exists) {
            // Already counted this IP for this vendor
            return res.status(200).json({ counted: false, reason: 'Already counted' });
        }

        // New unique visit - save IP and increment count
        const batch = db.batch();

        // Save IP hash
        batch.set(ipRef, {
            firstVisit: new Date(),
        });

        // Increment visit count
        batch.set(vendorVisitsRef, {
            count: (await vendorVisitsRef.get()).data()?.count + 1 || 1,
            lastUpdated: new Date(),
        }, { merge: true });

        await batch.commit();

        return res.status(200).json({ counted: true });
    } catch (error) {
        console.error('Error tracking visit:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
