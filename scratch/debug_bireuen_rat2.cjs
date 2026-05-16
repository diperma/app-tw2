const { MongoClient } = require('mongodb');

async function checkData() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('simkopdes');
  const col = db.collection('village_readiness');

  const countBireuen2 = await col.countDocuments({ 
    'territorial_data.district': 'KAB. BIREUEN', 
    $or: [
        { 'rat_summary.total_verified_rat': { $gte: 2 } },
        { 'rat_summary.total_draft_rat': { $gte: 2 } },
        { $and: [ { 'rat_summary.total_verified_rat': 1 }, { 'rat_summary.total_draft_rat': 1 } ] }
    ]
  });
  console.log('Villages in Bireuen with sum(Verified+Draft) >= 2:', countBireuen2);

  await client.close();
}

checkData();
