
async function run() {
  const apiBase = 'http://localhost:5000/api';
  console.log('1. Starting national export job...');
  const startRes = await fetch(`${apiBase}/export/national/start`, { method: 'POST' });
  if (!startRes.ok) {
    throw new Error(`Start failed: ${startRes.statusText}`);
  }
  const { jobId } = await startRes.json();
  console.log(`Job started with ID: ${jobId}`);

  let attempts = 0;
  while (attempts < 60) {
    console.log(`Polling status (attempt ${attempts + 1})...`);
    const statusRes = await fetch(`${apiBase}/export/national/status?jobId=${jobId}`);
    if (!statusRes.ok) {
      throw new Error(`Status query failed: ${statusRes.statusText}`);
    }
    const data = await statusRes.json();
    console.log(`Status: ${data.status}, Progress: ${data.progress}%, Error: ${data.error}`);
    
    if (data.status === 'completed') {
      console.log('Job completed successfully!');
      break;
    } else if (data.status === 'failed') {
      throw new Error(`Job failed: ${data.error}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }

  console.log('2. Trying to download the generated file...');
  const downloadUrl = `${apiBase}/export/national/download?jobId=${jobId}`;
  const downloadRes = await fetch(downloadUrl);
  if (!downloadRes.ok) {
    throw new Error(`Download failed: ${downloadRes.status} ${downloadRes.statusText}`);
  }
  
  const buffer = await downloadRes.arrayBuffer();
  console.log(`Downloaded file successfully. Size: ${buffer.byteLength} bytes.`);
}

run().catch(console.error);
