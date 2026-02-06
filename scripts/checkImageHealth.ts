import fs from 'fs';

interface ImageItem {
    type: string;
    id: string;
    name: string;
    url: string;
    status?: number;
    statusText?: string;
    error?: string;
}

async function checkImageHealth() {
    const data: ImageItem[] = JSON.parse(fs.readFileSync('image_urls_audit.json', 'utf8'));
    console.log(`Checking ${data.length} images...`);

    const results: ImageItem[] = [];
    const BATCH_SIZE = 10;

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map(async (item) => {
            try {
                // Node 18+ has native fetch
                const response = await fetch(item.url, { method: 'HEAD' });
                if (response.ok) {
                    return null; // OK
                } else {
                    return { ...item, status: response.status, statusText: response.statusText };
                }
            } catch (err: any) {
                return { ...item, error: err?.message || 'Unknown error' };
            }
        }));

        const failures = batchResults.filter(r => r !== null);
        results.push(...failures);
        console.log(`Progress: ${i + batch.length}/${data.length} checked. Found ${results.length} failures so far.`);
    }

    fs.writeFileSync('image_failures_report.json', JSON.stringify(results, null, 2));
    console.log(`Found ${results.length} problematic images. Report saved to image_failures_report.json`);
}

checkImageHealth();
