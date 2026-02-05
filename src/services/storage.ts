import { compressImage } from './imageCompression';



export interface UploadResult {
    url: string;
}

/**
 * Upload an image to Cloudflare R2 via our Worker
 * Includes automatic client-side compression
 */
export const uploadImage = async (file: File): Promise<UploadResult> => {
    const WORKER_URL = (import.meta as any).env.VITE_CLOUDFLARE_WORKER_URL;
    const UPLOAD_SECRET = (import.meta as any).env.VITE_UPLOAD_SECRET;

    if (!WORKER_URL || !UPLOAD_SECRET) {
        throw new Error("Cloudflare configuration missing in .env");
    }

    try {
        // 1. Compress first
        const compressedFile = await compressImage(file);

        // 2. Upload via Worker
        console.log(`[Storage] Attempting upload to: ${WORKER_URL}`);

        const response = await fetch(`${WORKER_URL}?filename=${encodeURIComponent(compressedFile.name)}`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
            headers: {
                'X-Upload-Secret': UPLOAD_SECRET,
                'Content-Type': compressedFile.type,
            },
            body: compressedFile,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Storage] Server returned error (${response.status}):`, errorText);
            throw new Error(`Upload failed (${response.status}): ${errorText || "Unknown error"}`);
        }

        const data = await response.json();
        return { url: data.url };
    } catch (error: any) {
        console.error('[Storage] Upload error:', error);
        throw error;
    }
};
