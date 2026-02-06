import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc, writeBatch } from "firebase/firestore";
import { addBucket, fetchBuckets } from "./categories";

const NEW_BUCKETS: Record<string, string[]> = {
    "Tech & Gadgets": ["phone", "laptop", "gadget", "charger", "computer", "airpod", "watch", "console", "game", "tech", "iphone", "samsung", "android", "pc", "headset", "speaker"],
    "Fashion & Lifestyle": ["wear", "cloth", "shoe", "bag", "hair", "wig", "cream", "oil", "perfume", "jewelry", "slide", "sandal", "unisex", "vintage", "totebag", "bracelet", "chain", "shades"],
    "Hostel & Student Essentials": ["kitchen", "bed", "mattress", "gas", "curtain", "fan", "food", "noodle", "provisions", "utensil", "room", "pillow", "rug", "bulb", "socket"],
    "Campus Services": ["barber", "data", "graphic", "design", "print", "delivery", "logistics", "assignment", "tutorial", "branding", "clean", "laundry", "media", "sub"],
    "Campus Life & Leisure": ["ticket", "event", "book", "novel", "game center", "recreation"],
    "Digital & Data": ["software", "vpn", "subscription", "course", "ebook", "template", "netflix"]
};

export const migrateToBuckets = async () => {
    console.log("Starting category migration 2.0...");
    const report = {
        createdBuckets: 0,
        movedCategories: 0,
        updatedProducts: 0,
        unsortedCategories: 0,
        success: false
    };

    try {
        // 1. Fetch or Create Buckets
        const existingBuckets = await fetchBuckets();
        const bucketMap: Record<string, string> = {}; // Name -> ID

        const getBucketId = async (name: string) => {
            const found = existingBuckets.find(b => b.name === name);
            if (found) return found.id;

            console.log(`Creating missing bucket: ${name}`);
            const newBucket = await addBucket(name);
            existingBuckets.push(newBucket); // Update local cache
            report.createdBuckets++;
            return newBucket.id;
        };

        // Initialize target buckets
        for (const bucketName of Object.keys(NEW_BUCKETS)) {
            bucketMap[bucketName] = await getBucketId(bucketName);
        }

        // Also get/create "Unsorted" for safety
        bucketMap["Unsorted"] = await getBucketId("Unsorted");

        // 2. Map Categories
        const categoriesSnap = await getDocs(collection(db, "categories"));
        const batchSize = 400; // Safe batch limit
        let batch = writeBatch(db);
        let operationCount = 0;

        const catNameToBucketId: Record<string, string> = {};

        for (const catDoc of categoriesSnap.docs) {
            const catData = catDoc.data();
            const catNameRaw = catData.name || "";
            const catName = catNameRaw.toLowerCase();

            let targetBucketId = bucketMap["Unsorted"];
            let matched = false;

            // Find matching bucket
            for (const [bucketName, keywords] of Object.entries(NEW_BUCKETS)) {
                if (keywords.some(k => catName.includes(k))) {
                    targetBucketId = bucketMap[bucketName];
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                console.log(`Unsorted Category: ${catNameRaw}`);
                report.unsortedCategories++;
            }

            // Update Category
            batch.update(doc(db, "categories", catDoc.id), { bucketId: targetBucketId });

            // Map for products
            catNameToBucketId[catNameRaw] = targetBucketId;

            report.movedCategories++;
            operationCount++;

            if (operationCount >= batchSize) {
                await batch.commit();
                batch = writeBatch(db);
                operationCount = 0;
            }
        }

        if (operationCount > 0) {
            await batch.commit();
            operationCount = 0;
            batch = writeBatch(db);
        }

        // 3. Update Products
        // We iterate all products to ensure they point to the correct bucket based on their category
        const productsSnap = await getDocs(collection(db, "products"));

        for (const prodDoc of productsSnap.docs) {
            const prodData = prodDoc.data();
            const prodCat = prodData.category;

            if (prodCat && catNameToBucketId[prodCat]) {
                const newBucketId = catNameToBucketId[prodCat];

                // Only update if it needs changing
                if (prodData.bucketId !== newBucketId) {
                    batch.update(doc(db, "products", prodDoc.id), { bucketId: newBucketId });
                    report.updatedProducts++;
                    operationCount++;
                }
            }

            if (operationCount >= batchSize) {
                await batch.commit();
                batch = writeBatch(db);
                operationCount = 0;
            }
        }

        if (operationCount > 0) {
            await batch.commit();
        }

        console.log("Migration completed successfully!", report);
        report.success = true;
        return report;

    } catch (error) {
        console.error("Migration failed:", error);
        throw error;
    }
};
