const { MongoClient } = require('mongodb');

async function checkData() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('simkopdes');
  const col = db.collection('village_readiness');

  const bireuen = await col.aggregate([
    { $match: { 'territorial_data.district': 'KAB. BIREUEN' } },
    {
      $group: {
        _id: null,
        total_done: { $sum: '$rat_summary.total_done_rat' },
        total_verified: { $sum: '$rat_summary.total_verified_rat' },
        total_draft: { $sum: '$rat_summary.total_draft_rat' },
        village_count: { $sum: 1 }
      }
    }
  ]).toArray();
  
  console.log('--- RAT Stats for Bireuen ---');
  console.log(bireuen[0]);

  const sample = await col.findOne({ 'territorial_data.district': 'KAB. BIREUEN', 'rat_summary.total_done_rat': { $gt: 1 } });
  if (sample) {
      console.log('\nFound village with total_done_rat > 1:');
      console.log(sample.territorial_data.village, sample.rat_summary);
  }

  const distribution = await col.aggregate([
    { $match: { 'territorial_data.district': 'KAB. BIREUEN' } },
    { $group: { _id: '$rat_summary.total_done_rat', count: { $sum: 1 } } }
  ]).toArray();
  console.log('\nDistribution of total_done_rat in Bireuen:');
  console.log(distribution);

  await client.close();
}

checkData();
