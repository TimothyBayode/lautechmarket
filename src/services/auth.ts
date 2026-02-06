import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

// Authorized Admin Credentials Email
export const ADMIN_EMAILS = [
  "admin@lautech.edu.ng",
];

// Authorized Google Identity for Verification
const AUTHORIZED_GOOGLE_EMAIL = "lautechmarket.help@gmail.com";
const IDENTITY_VERIFIED_KEY = "admin_identity_verified";

export const verifyGoogleIdentity = async (): Promise<boolean> => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (user.email?.toLowerCase() === AUTHORIZED_GOOGLE_EMAIL.toLowerCase()) {
      sessionStorage.setItem(IDENTITY_VERIFIED_KEY, "true");
      // Sign out immediately to clear the Google session from Firebase Auth
      // but keep our local verification flag
      await signOut(auth);
      return true;
    }

    await signOut(auth);
    return false;
  } catch (error) {
    console.error("Google Identity Verification Error:", error);
    return false;
  }
};

export const isGoogleIdentityVerified = (): boolean => {
  return sessionStorage.getItem(IDENTITY_VERIFIED_KEY) === "true";
};

export const isAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase()) && isGoogleIdentityVerified();
};

export const loginUser = async (
  email: string,
  password: string
): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const authStateListener = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const isUserLoggedIn = (): boolean => {
  return auth.currentUser !== null;
};
