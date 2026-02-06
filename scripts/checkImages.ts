import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function auditImages() {
    console.log('--- Auditing Product Images ---');
    const productsRef = collection(db, 'products');
    const productsSnap = await getDocs(productsRef);

    productsSnap.docs.forEach(docSnap => {
        const data = docSnap.data();
        const image = data.image;
        if (!image) {
            console.log(`[MISSING] Product: ${data.name} (ID: ${docSnap.id}) has no image property.`);
        } else if (typeof image !== 'string' || !image.startsWith('http')) {
            console.log(`[RELATIVE/INVALID] Product: ${data.name} (ID: ${docSnap.id}) has invalid image URL: ${image}`);
        } else {
            console.log(`[OK?] Product: ${data.name} (ID: ${docSnap.id}) Image: ${image}`);
        }
    });

    console.log('\n--- Auditing Announcement Images ---');
    const announcementsRef = collection(db, 'announcements');
    const announcementsSnap = await getDocs(announcementsRef);

    announcementsSnap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.type === 'image') {
            const imageUrl = data.imageUrl;
            if (!imageUrl) {
                console.log(`[MISSING] Announcement: ${data.title} (ID: ${docSnap.id}) has no imageUrl.`);
            } else {
                console.log(`[OK?] Announcement: ${data.title} (ID: ${docSnap.id}) ImageUrl: ${imageUrl}`);
            }
        }
    });

    console.log('\nAudit complete.');
    process.exit(0);
}

auditImages().catch((err: any) => {
    console.error(err);
    process.exit(1);
});
