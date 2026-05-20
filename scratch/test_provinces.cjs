async function testProvinces() {
  try {
    const res = await fetch('https://api.simkopdes.go.id/api/provinces');
    const data = await res.json();
    console.log('Total Provinces:', data.data?.length);
    console.log('Provinces names list:');
    const names = (data.data || []).map(p => p.name);
    console.log(names);
    
    // Test resolution logic for "JAWA TENGAH"
    const target = "JAWA TENGAH";
    const normalizeName = (name) => {
      if (!name) return '';
      return name.toUpperCase()
        .replace(/^KAB\.\s+/, '')
        .replace(/^KOTA\s+/, '')
        .replace(/^KABUPATEN\s+/, '')
        .replace(/^KEC\.\s+/, '')
        .replace(/^KECAMATAN\s+/, '')
        .trim();
    };
    
    const matched = (data.data || []).find(p => normalizeName(p.name) === normalizeName(target));
    console.log(`\nMatching for '${target}':`, matched);
  } catch (err) {
    console.error('Error fetching provinces:', err);
  }
}

testProvinces();
