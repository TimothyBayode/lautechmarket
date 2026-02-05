import { Vendor } from "../types";
import { auth, db } from "../firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    sendEmailVerification,
    User,
} from "firebase/auth";
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    getDocs,
    query,
    where,
} from "firebase/firestore";

// Current vendor state
let currentVendor: Vendor | null = null;
let vendorAuthListeners: ((vendor: Vendor | null) => void)[] = [];

// Notify all listeners of auth state change
const notifyVendorAuthListeners = () => {
    vendorAuthListeners.forEach((callback) => callback(currentVendor));
};

// Fetch vendor data from Firestore
const fetchVendorData = async (userId: string): Promise<Vendor | null> => {
    try {
        const vendorDoc = await getDoc(doc(db, "vendors", userId));
        if (vendorDoc.exists()) {
            const data = vendorDoc.data();
            return {
                id: vendorDoc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                verifiedAt: data.verifiedAt?.toDate() || null,
            } as Vendor;
        }
    } catch (error) {
        console.error("Error fetching vendor data:", error);
    }
    return null;
};

// Register a new vendor
export const registerVendor = async (
    name: string,
    email: string,
    password: string,
    whatsappNumber: string,
    businessName: string,
    description?: string,
    storeAddress?: string
): Promise<Vendor> => {
    try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );
        const user = userCredential.user;

        // Send email verification
        await sendEmailVerification(user);

        // Create vendor document in Firestore
        const baseSlug = businessName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
        const vendorData: Omit<Vendor, "id"> = {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: "", // Don't store password in Firestore
            whatsappNumber: whatsappNumber.trim(),
            businessName: businessName.trim(),
            slug: baseSlug,
            tagline: "",
            description: description?.trim() || "",
            storeAddress: storeAddress?.trim() || "",
            createdAt: new Date(),
        };

        await setDoc(doc(db, "vendors", user.uid), vendorData);

        const newVendor: Vendor = {
            id: user.uid,
            ...vendorData,
        };

        currentVendor = newVendor;
        notifyVendorAuthListeners();

        return newVendor;
    } catch (error: any) {
        console.error("Registration error:", error);
        if (error.code === "auth/email-already-in-use") {
            throw new Error("An account with this email already exists");
        }
        if (error.code === "auth/weak-password") {
            throw new Error("Password should be at least 6 characters");
        }
        throw new Error(error.message || "Registration failed");
    }
};

// Login an existing vendor
export const loginVendor = async (
    email: string,
    password: string
): Promise<Vendor> => {
    try {
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );
        const user = userCredential.user;

        // Fetch vendor data from Firestore
        const vendorData = await fetchVendorData(user.uid);

        if (!vendorData) {
            // User exists in Auth but not as a vendor
            await signOut(auth);
            throw new Error("No vendor account found. Please register first.");
        }

        currentVendor = vendorData;
        notifyVendorAuthListeners();

        return vendorData;
    } catch (error: any) {
        console.error("Login error:", error);
        if (error.code === "auth/user-not-found") {
            throw new Error("No account found with this email");
        }
        if (error.code === "auth/wrong-password") {
            throw new Error("Invalid password");
        }
        if (error.code === "auth/invalid-credential") {
            throw new Error("Invalid email or password");
        }
        throw new Error(error.message || "Login failed");
    }
};

// Logout current vendor
export const logoutVendor = async (): Promise<void> => {
    try {
        await signOut(auth);
        currentVendor = null;
        notifyVendorAuthListeners();
    } catch (error) {
        console.error("Logout error:", error);
        throw error;
    }
};

// Listen for vendor auth state changes
export const vendorAuthStateListener = (
    callback: (vendor: Vendor | null) => void
) => {
    vendorAuthListeners.push(callback);

    // Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
        if (user) {
            const vendorData = await fetchVendorData(user.uid);
            currentVendor = vendorData;
            callback(vendorData);
        } else {
            currentVendor = null;
            callback(null);
        }
    });

    return () => {
        vendorAuthListeners = vendorAuthListeners.filter((cb) => cb !== callback);
        unsubscribe();
    };
};

// Get current logged in vendor
export const getCurrentVendor = (): Vendor | null => {
    return currentVendor;
};

// Check if a vendor is logged in
export const isVendorLoggedIn = (): boolean => {
    return currentVendor !== null;
};

// Update vendor profile
export const updateVendorProfile = async (
    vendorId: string,
    updates: Partial<Vendor>
): Promise<Vendor> => {
    try {
        const vendorRef = doc(db, "vendors", vendorId);
        await updateDoc(vendorRef, updates);

        const updatedVendor = await fetchVendorData(vendorId);
        if (updatedVendor && currentVendor && currentVendor.id === vendorId) {
            currentVendor = updatedVendor;
            notifyVendorAuthListeners();
        }

        return updatedVendor!;
    } catch (error) {
        console.error("Update profile error:", error);
        throw error;
    }
};

// Get vendor by ID
export const getVendorById = async (vendorId: string): Promise<Vendor | null> => {
    return fetchVendorData(vendorId);
};

// Get vendor by slug
export const getVendorBySlug = async (slug: string): Promise<Vendor | null> => {
    try {
        const q = query(collection(db, "vendors"), where("slug", "==", slug));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                verifiedAt: data.verifiedAt?.toDate() || null,
            } as Vendor;
        }
    } catch (error) {
        console.error("Error fetching vendor by slug:", error);
    }
    return null;
};


// Get all vendors from Firestore
export const getAllVendors = async (): Promise<Vendor[]> => {
    try {
        const vendorsSnapshot = await getDocs(collection(db, "vendors"));
        const vendors: Vendor[] = [];

        vendorsSnapshot.forEach((doc) => {
            const data = doc.data();
            vendors.push({
                id: doc.id,
                name: data.name,
                email: data.email,
                password: "",
                whatsappNumber: data.whatsappNumber,
                businessName: data.businessName,
                description: data.description || "",
                storeAddress: data.storeAddress || "",
                bannerImage: data.bannerImage,
                profileImage: data.profileImage,
                isVerified: data.isVerified || false,
                verifiedAt: data.verifiedAt?.toDate() || undefined,
                createdAt: data.createdAt?.toDate() || new Date(),
            } as Vendor);
        });

        return vendors;
    } catch (error) {
        console.error("Error fetching all vendors:", error);
        throw error;
    }
};

// Delete a vendor and all their products (admin only)
export const deleteVendor = async (vendorId: string): Promise<void> => {
    try {
        // First, delete all products belonging to this vendor
        const productsQuery = query(
            collection(db, "products"),
            where("vendorId", "==", vendorId)
        );
        const productsSnapshot = await getDocs(productsQuery);

        // Delete each product
        const deletePromises = productsSnapshot.docs.map((docSnapshot) =>
            deleteDoc(doc(db, "products", docSnapshot.id))
        );
        await Promise.all(deletePromises);

        console.log(`Deleted ${productsSnapshot.size} products for vendor ${vendorId}`);

        // Then, delete the vendor document
        await deleteDoc(doc(db, "vendors", vendorId));

        console.log(`Deleted vendor ${vendorId}`);
    } catch (error) {
        console.error("Error deleting vendor:", error);
        throw error;
    }
};

// Send password reset email
export const sendVendorPasswordReset = async (email: string): Promise<void> => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        console.error("Password reset error:", error);
        if (error.code === "auth/user-not-found") {
            throw new Error("No account found with this email");
        }
        if (error.code === "auth/invalid-email") {
            throw new Error("Invalid email address");
        }
        throw new Error("Failed to send password reset email. Please try again.");
    }
};
