const { MongoClient } = require('mongodb');

async function checkData() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('simkopdes');
  const col = db.collection('village_readiness');

  const anyStat = await col.countDocuments({ 
    $or: [
        { 'territorial_data.totals.accounts_count': { $gt: 0 } },
        { 'territorial_data.totals.npwp_count': { $gt: 0 } },
        { 'territorial_data.totals.nib_count': { $gt: 0 } }
    ]
  });
  
  console.log('Villages with at least one readiness stat (Acc, NPWP, or NIB):', anyStat);

  await client.close();
}

checkData();
