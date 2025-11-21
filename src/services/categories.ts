import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";

export interface Category {
  id: string;
  name: string;
  createdAt: Date;
  productCount: number;
}

export const fetchCategories = async (): Promise<Category[]> => {
  const q = query(collection(db, "categories"), orderBy("name"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as Category)
  );
};

export const addCategory = async (name: string): Promise<Category> => {
  const docRef = await addDoc(collection(db, "categories"), {
    name: name.trim(),
    createdAt: new Date(),
    productCount: 0,
  });
  return {
    id: docRef.id,
    name: name.trim(),
    createdAt: new Date(),
    productCount: 0,
  };
};

export const updateCategory = async (
  id: string,
  name: string
): Promise<void> => {
  const docRef = doc(db, "categories", id);
  await updateDoc(docRef, {
    name: name.trim(),
  });
};

export const deleteCategory = async (id: string): Promise<void> => {
  const docRef = doc(db, "categories", id);
  await deleteDoc(docRef);
};

export const categoryExists = async (name: string): Promise<boolean> => {
  const categories = await fetchCategories();
  return categories.some(
    (cat) => cat.name.toLowerCase() === name.toLowerCase().trim()
  );
};
