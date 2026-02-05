/**
 * Image URL Utilities
 * Handles conversion between R2 public URLs and worker-proxied URLs
 */

const WORKER_URL = import.meta.env.VITE_CLOUDFLARE_WORKER_URL;

/**
 * Converts any image URL to a worker-proxied URL for CORS support
 * @param url - The original image URL (R2 public, worker-proxied, or external)
 * @returns Worker-proxied URL or original URL if not applicable
 */
export const getProxiedImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;

    // If it's already a worker URL, return as-is
    if (url.includes(WORKER_URL)) {
        return url;
    }

    // If it's an R2 public URL, convert to worker-proxied URL
    if (url.includes('.r2.dev/')) {
        const filename = url.split('/').pop();
        if (!filename) return url;
        return `${WORKER_URL}?file=${filename}`;
    }

    // For other URLs (Cloudinary, external, etc.), return as-is
    return url;
};
