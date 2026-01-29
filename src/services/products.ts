import { Product } from "../types";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";

export const fetchProducts = async (): Promise<Product[]> => {
  const querySnapshot = await getDocs(collection(db, "products"));
  return querySnapshot.docs.map(
    (docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : undefined),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : undefined),
      } as Product;
    }
  );
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const docRef = doc(db, "products", id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists()
    ? ({ id: docSnap.id, ...docSnap.data() } as Product)
    : null;
};

export const addProduct = async (data: Product): Promise<Product> => {
  const { id, ...productData } = data;
  const now = new Date();
  const finalData = {
    ...productData,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(collection(db, "products"), finalData);
  return { id: docRef.id, ...finalData };
};

export const updateProduct = async (id: string, data: Partial<Product>) => {
  const docRef = doc(db, "products", id);
  const { id: _, ...updateData } = data;
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: new Date(),
  });
};

export const deleteProduct = async (id: string) => {
  const docRef = doc(db, "products", id);
  await deleteDoc(docRef);
};

export const getVendorProducts = async (vendorId: string): Promise<Product[]> => {
  const allProducts = await fetchProducts();
  return allProducts.filter((p) => p.vendorId === vendorId);
};

export const getAllProducts = fetchProducts;