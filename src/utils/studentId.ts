import { auth } from "../firebase";

const STORAGE_KEY = 'lautech_market_student_id';

export const getStudentId = (): string => {
    // If user is logged in, use their UID
    if (auth.currentUser) {
        return auth.currentUser.uid;
    }

    // Otherwise check local storage
    let storedId = localStorage.getItem(STORAGE_KEY);

    // If no stored ID, generate one
    if (!storedId) {
        storedId = 'anon_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem(STORAGE_KEY, storedId);
    }

    return storedId;
};
