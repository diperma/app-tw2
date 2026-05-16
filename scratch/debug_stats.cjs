const { MongoClient } = require('mongodb');

async function checkData() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('simkopdes');
  const col = db.collection('village_readiness');

  const countWithStats = await col.countDocuments({ readiness_stats: { $exists: true } });
  const total = await col.countDocuments({});
  console.log(`Documents with readiness_stats: ${countWithStats} / ${total}`);

  const sampleWithStats = await col.findOne({ readiness_stats: { $exists: true } });
  if (sampleWithStats) {
      console.log('Sample with readiness_stats:', JSON.stringify(sampleWithStats.readiness_stats, null, 2));
  }

  const sampleWithoutStats = await col.findOne({ readiness_stats: { $exists: false } });
  if (sampleWithoutStats) {
      console.log('Sample without readiness_stats (Totals):', JSON.stringify(sampleWithoutStats.territorial_data.totals, null, 2));
  }

  await client.close();
}

checkData();
