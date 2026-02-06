import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = {
    apiKey: "AIzaSyAkRD3f-LxUixzTemcqJ9E01lfhVrxJQUg",
    authDomain: "lautech-market-ed822.firebaseapp.com",
    projectId: "lautech-market-ed822",
    storageBucket: "lautech-market-ed822.firebasestorage.app",
    messagingSenderId: "280510344868",
    appId: "1:280510344868:web:d36a3afecaff0228ed4031",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface ImageAudit {
    type: string;
    id: string;
    name: string;
    url: string;
}

async function dumpImages() {
    const urls: ImageAudit[] = [];

    // Products
    const productsSnap = await getDocs(collection(db, 'products'));
    productsSnap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.image) urls.push({ type: 'product', id: docSnap.id, name: data.name, url: data.image });
    });

    // Announcements
    const announcementsSnap = await getDocs(collection(db, 'announcements'));
    announcementsSnap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.type === 'image' && data.imageUrl) {
            urls.push({ type: 'announcement', id: docSnap.id, name: data.title, url: data.imageUrl });
        }
    });

    // Vendors
    const vendorsSnap = await getDocs(collection(db, 'vendors'));
    vendorsSnap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.profileImage) urls.push({ type: 'vendor_profile', id: docSnap.id, name: data.businessName, url: data.profileImage });
        if (data.bannerImage) urls.push({ type: 'vendor_banner', id: docSnap.id, name: data.businessName, url: data.bannerImage });
    });

    fs.writeFileSync('image_urls_audit.json', JSON.stringify(urls, null, 2));
    console.log(`Dumped ${urls.length} URLs to image_urls_audit.json`);
    process.exit(0);
}

dumpImages().catch(err => {
    console.error(err);
    process.exit(1);
});
