/// <reference types="vite/client" />
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
    // If it's already a worker URL, return it, BUT ensure it's clean
    if (url.includes(WORKER_URL)) {
        // Check if it has double query params or is malformed
        // Expected format: WORKER_URL?file=filename.ext
        // If it looks like WORKER_URL?file=filename.ext?foo=bar, we need to fix it.
        if (url.split('?').length > 2 || url.includes('&')) {
            try {
                const urlObj = new URL(url);
                const fileParam = urlObj.searchParams.get('file');
                if (fileParam) {
                    // Clean the file param if it has extra junk
                    const cleanFilename = fileParam.split('?')[0];
                    return `${WORKER_URL}?file=${cleanFilename}`;
                }
            } catch (e) {
                // If parsing fails, just return original
                return url;
            }
        }
        return url;
    }

    // If it's an R2 public URL, convert to worker-proxied URL
    if (url.includes('.r2.dev/')) {
        // Remove query params first
        const cleanUrl = url.split('?')[0];
        const filename = cleanUrl.split('/').pop();
        if (!filename) return url;
        // Use 'file' parameter to match worker expectation
        return `${WORKER_URL}?file=${filename}`;
    }

    // For other URLs (external, etc.), return as-is
    return url;
};
