/**
 * Production-Safe Logger Utility
 * 
 * Logs messages only in development mode to prevent information leakage
 * and improve production performance.
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
    log: (...args: unknown[]) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },

    warn: (...args: unknown[]) => {
        if (isDevelopment) {
            console.warn(...args);
        }
    },

    error: (...args: unknown[]) => {
        // Always log errors, even in production, as they're critical
        console.error(...args);
    },

    info: (...args: unknown[]) => {
        if (isDevelopment) {
            console.info(...args);
        }
    },

    debug: (...args: unknown[]) => {
        if (isDevelopment) {
            console.debug(...args);
        }
    },
};
