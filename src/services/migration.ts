import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc, writeBatch } from "firebase/firestore";
import { addBucket, fetchBuckets } from "./categories";

export const migrateToBuckets = async () => {
    console.log("Starting category migration...");

    try {
        // 1. Create default buckets if they don't exist
        const existingBuckets = await fetchBuckets();
        let productsBucket = existingBuckets.find(b => b.name === "Products");
        let servicesBucket = existingBuckets.find(b => b.name === "Services");

        if (!productsBucket) {
            console.log("Creating 'Products' bucket...");
            productsBucket = await addBucket("Products");
        }

        if (!servicesBucket) {
            console.log("Creating 'Services' bucket...");
            servicesBucket = await addBucket("Services");
        }

        const productsBucketId = productsBucket.id;

        // 2. Update existing categories to have bucketId (mapped to "Products")
        const categoriesSnap = await getDocs(collection(db, "categories"));
        const categoryUpdates = [];

        for (const catDoc of categoriesSnap.docs) {
            if (!catDoc.data().bucketId) {
                categoryUpdates.push(
                    updateDoc(doc(db, "categories", catDoc.id), {
                        bucketId: productsBucketId
                    })
                );
            }
        }

        if (categoryUpdates.length > 0) {
            console.log(`Updating ${categoryUpdates.length} categories...`);
            await Promise.all(categoryUpdates);
        }

        // 3. Update all products to have bucketId (default to "Products" for now)
        const productsSnap = await getDocs(collection(db, "products"));
        const batch = writeBatch(db);
        let updatedProductsCount = 0;

        for (const prodDoc of productsSnap.docs) {
            if (!prodDoc.data().bucketId) {
                batch.update(doc(db, "products", prodDoc.id), {
                    bucketId: productsBucketId
                });
                updatedProductsCount++;
            }
        }

        if (updatedProductsCount > 0) {
            console.log(`Updating ${updatedProductsCount} products with bucketId...`);
            await batch.commit();
        }

        console.log("Migration completed successfully!");
        return { success: true, updatedCategories: categoryUpdates.length, updatedProducts: updatedProductsCount };

    } catch (error) {
        console.error("Migration failed:", error);
        throw error;
    }
};
