async function testJawaTengah() {
  try {
    const url = 'https://api.simkopdes.go.id/api/statistics/national-readiness/province/13?period=2026';
    console.log(`Fetching ${url}...`);
    const res = await fetch(url);
    const data = await res.json();
    console.log('Keys in data:', Object.keys(data));
    console.log('territorial_data keys:', Object.keys(data.territorial_data || {}));
    const districts = data.territorial_data?.districts || [];
    console.log('Total districts returned:', districts.length);
    if (districts.length > 0) {
      console.log('First district preview:', districts[0]);
    }
  } catch (err) {
    console.error('Error fetching statistics:', err);
  }
}

testJawaTengah();
