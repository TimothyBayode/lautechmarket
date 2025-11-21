// src/services/auth.ts
import { auth } from "../firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";

export const loginUser = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const authStateListener = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Optional: Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Optional: Check if user is logged in
export const isUserLoggedIn = (): boolean => {
  return !!auth.currentUser;
};