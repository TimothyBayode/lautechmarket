async function testWorker() {
    const base = 'https://lautechmarket-uploader.lautechmarket-help.workers.dev';
    const fileParam = '20250502_131553-1770368377291.webp';

    console.log(`Testing Worker with: ${fileParam}`);

    try {
        const r1 = await fetch(`${base}?file=${fileParam}`, { method: 'HEAD' });
        const r2 = await fetch(`${base}?filename=${fileParam}`, { method: 'HEAD' });

        console.log({
            file_param_status: r1.status,
            filename_param_status: r2.status
        });

        if (r1.status === 200 && r2.status === 401) {
            console.log('Worker ONLY supports "file" parameter.');
        } else if (r1.status === 401 && r2.status === 200) {
            console.log('Worker ONLY supports "filename" parameter.');
        } else if (r1.status === 200 && r2.status === 200) {
            console.log('Worker supports BOTH parameters.');
        } else {
            console.log('Worker returned unexpected statuses or image not found.');
        }
    } catch (err: any) {
        console.error('Error during worker test:', err?.message || 'Unknown error');
    }
}

testWorker();
