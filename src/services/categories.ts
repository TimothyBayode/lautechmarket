import { db } from "../firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";

export interface Bucket {
  id: string;
  name: string;
  createdAt: Date;
  manualPosition?: number;
}

export interface Category {
  id: string;
  name: string;
  bucketId: string;
  createdAt: Date;
  productCount: number;
  manualPosition?: number;
}

// BUCKET OPERATIONS

export const fetchBuckets = async (): Promise<Bucket[]> => {
  try {
    const q = query(collection(db, "buckets"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (docSnap) =>
      ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        manualPosition: docSnap.data().manualPosition || 0,
      } as Bucket)
    );
  } catch (error) {
    console.error("CRITICAL: Error in fetchBuckets service:", error);
    throw error;
  }
};

export const addBucket = async (name: string): Promise<Bucket> => {
  console.log("Attempting to add bucket:", name);
  try {
    const docRef = await addDoc(collection(db, "buckets"), {
      name: name.trim(),
      createdAt: new Date(),
      manualPosition: 0,
    });
    console.log("Bucket added successfully with ID:", docRef.id);
    return {
      id: docRef.id,
      name: name.trim(),
      createdAt: new Date(),
      manualPosition: 0,
    };
  } catch (error) {
    console.error("Error in addBucket service:", error);
    throw error;
  }
};

export const updateBucket = async (id: string, updates: Partial<Bucket>): Promise<void> => {
  const docRef = doc(db, "buckets", id);
  const data: any = { ...updates };
  if (updates.createdAt) delete data.createdAt; // Don't update creation date
  await updateDoc(docRef, data);
};

export const deleteBucket = async (id: string): Promise<void> => {
  // Note: Usually we should prevent deletion if subcategories exist
  const docRef = doc(db, "buckets", id);
  await deleteDoc(docRef);
};

// CATEGORY (SUBCATEGORY) OPERATIONS

export const fetchCategories = async (bucketId?: string): Promise<Category[]> => {
  let q;
  if (bucketId) {
    q = query(
      collection(db, "categories"),
      where("bucketId", "==", bucketId)
    );
  } else {
    q = query(collection(db, "categories"));
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (docSnap) => {
      const data = docSnap.data() as any;
      return {
        id: docSnap.id,
        name: data.name || "",
        bucketId: data.bucketId || "",
        createdAt: data.createdAt?.toDate() || new Date(),
        productCount: data.productCount || 0,
        manualPosition: data.manualPosition || 0,
      } as Category;
    }
  );
};

export const addCategory = async (name: string, bucketId: string): Promise<Category> => {
  const docRef = await addDoc(collection(db, "categories"), {
    name: name.trim(),
    bucketId,
    createdAt: new Date(),
    productCount: 0,
    manualPosition: 0,
  });
  return {
    id: docRef.id,
    name: name.trim(),
    bucketId,
    createdAt: new Date(),
    productCount: 0,
    manualPosition: 0,
  };
};

export const updateCategory = async (
  id: string,
  updates: Partial<Category>
): Promise<void> => {
  const docRef = doc(db, "categories", id);
  const data: any = { ...updates };
  if (updates.createdAt) delete data.createdAt;
  await updateDoc(docRef, data);
};

export const deleteCategory = async (id: string): Promise<void> => {
  const docRef = doc(db, "categories", id);
  await deleteDoc(docRef);
};

export const categoryExists = async (name: string, bucketId: string): Promise<boolean> => {
  const q = query(
    collection(db, "categories"),
    where("bucketId", "==", bucketId),
    where("name", "==", name.trim())
  );
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};
