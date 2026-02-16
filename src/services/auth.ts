import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
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
    return await handleAuthResult(result.user);
  } catch (error) {
    console.error("Google Identity Verification Error (Popup):", error);
    throw error; // Re-throw to allow component to handle specific error codes
  }
};

export const verifyGoogleIdentityWithRedirect = async (): Promise<void> => {
  const provider = new GoogleAuthProvider();
  await signInWithRedirect(auth, provider);
};

export const handleGoogleRedirectResult = async (): Promise<boolean | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null; // No redirect result found
    return await handleAuthResult(result.user);
  } catch (error) {
    console.error("Google Identity Verification Error (Redirect):", error);
    return false;
  }
};

const handleAuthResult = async (user: User): Promise<boolean> => {
  console.log("[Auth] Google sign-in successful. Email:", user.email);
  console.log("[Auth] Authorized email:", AUTHORIZED_GOOGLE_EMAIL);

  if (user.email?.toLowerCase().trim() === AUTHORIZED_GOOGLE_EMAIL.toLowerCase().trim()) {
    console.log("[Auth] Identity match confirmed.");
    sessionStorage.setItem(IDENTITY_VERIFIED_KEY, "true");
    await signOut(auth);
    return true;
  }

  console.warn("[Auth] Identity mismatch. Expected:", AUTHORIZED_GOOGLE_EMAIL.toLowerCase(), "Got:", user.email?.toLowerCase());
  await signOut(auth);
  return false;
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
