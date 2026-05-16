const { MongoClient } = require('mongodb');

async function checkData() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('simkopdes');
  const col = db.collection('village_readiness');

  const count2 = await col.countDocuments({ 'rat_summary.total_rat': { $gte: 2 } });
  console.log('Villages with total_rat >= 2:', count2);

  const sample = await col.findOne({ 'rat_summary.total_rat': { $gte: 2 } });
  if (sample) {
      console.log('Sample village with 2 RAT:', sample.territorial_data.village, sample.rat_summary);
  }

  await client.close();
}

checkData();
