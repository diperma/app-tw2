const fs = require('fs');

async function testExport() {
  console.log('Testing Province export (JAWA TENGAH)...');
  try {
    const res = await fetch('http://localhost:5005/api/export?province=JAWA%20TENGAH');
    if (!res.ok) {
      console.error(`Province export failed with status ${res.status}:`, await res.text());
    } else {
      const buffer = await res.arrayBuffer();
      console.log(`Province export successful! Size: ${buffer.byteLength} bytes.`);
      console.log(`Content-Disposition:`, res.headers.get('content-disposition'));
      fs.writeFileSync('scratch/test_export_jawa_tengah.xlsx', Buffer.from(buffer));
    }
  } catch (err) {
    console.error('Province export error:', err.message);
  }

  console.log('\nTesting Kecamatan export (Banjarmangu)...');
  try {
    const res = await fetch('http://localhost:5005/api/export?province=JAWA%20TENGAH&district=KAB.%20BANJARNEGARA&subdistrict=Banjarmangu');
    if (!res.ok) {
      console.error(`Kecamatan export failed with status ${res.status}:`, await res.text());
    } else {
      const buffer = await res.arrayBuffer();
      console.log(`Kecamatan export successful! Size: ${buffer.byteLength} bytes.`);
      console.log(`Content-Disposition:`, res.headers.get('content-disposition'));
    }
  } catch (err) {
    console.error('Kecamatan export error:', err.message);
  }

  console.log('\nTesting National export block...');
  try {
    const res = await fetch('http://localhost:5005/api/export?province=All');
    if (res.status === 400) {
      const text = await res.json();
      console.log('National export successfully blocked! Error returned:', text);
    } else {
      console.error(`National export check returned unexpected status ${res.status}`);
    }
  } catch (err) {
    console.error('National export block check error:', err.message);
  }
}

testExport();
