import { compressImage } from './imageCompression';

const WORKER_URL = import.meta.env.VITE_CLOUDFLARE_WORKER_URL;
const UPLOAD_SECRET = import.meta.env.VITE_UPLOAD_SECRET;

export interface UploadResult {
    url: string;
}

/**
 * Upload an image to Cloudflare R2 via our Worker
 * Includes automatic client-side compression
 */
export const uploadImage = async (file: File): Promise<UploadResult> => {
    if (!WORKER_URL || !UPLOAD_SECRET) {
        throw new Error("Cloudflare configuration missing in .env");
    }

    try {
        // 1. Compress first
        const compressedFile = await compressImage(file);

        // 2. Upload via Worker
        const response = await fetch(`${WORKER_URL}?filename=${compressedFile.name}`, {
            method: 'POST',
            headers: {
                'X-Upload-Secret': UPLOAD_SECRET,
                'Content-Type': compressedFile.type,
            },
            body: compressedFile,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed: ${errorText}`);
        }

        const data = await response.json();
        return { url: data.url };
    } catch (error: any) {
        console.error('[Storage] Upload error:', error);
        throw error;
    }
};
