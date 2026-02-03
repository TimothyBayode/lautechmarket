import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File): Promise<File> => {
    const options = {
        maxSizeMB: 0.1, // Max size 100KB
        maxWidthOrHeight: 1000,
        useWebWorker: true,
        fileType: 'image/webp' as const,
    };

    try {
        console.log(`[Compression] Starting compression for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        const compressedFile = await imageCompression(file, options);
        console.log(`[Compression] Finished. New size: ${(compressedFile.size / 1024).toFixed(2)} KB`);

        // Rename to .webp and remove spaces/special chars from name
        const baseName = file.name.split('.')[0].replace(/\s+/g, '-');
        return new File([compressedFile], `${baseName}-${Date.now()}.webp`, {
            type: 'image/webp',
        });
    } catch (error) {
        console.error('[Compression] Error:', error);
        return file; // Return original if compression fails
    }
};
