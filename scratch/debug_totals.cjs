const { MongoClient } = require('mongodb');

async function checkData() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('simkopdes');
  const col = db.collection('village_readiness');

  const totals = await col.aggregate([
    {
      $group: {
        _id: null,
        total_koperasi: { $sum: '$territorial_data.totals.count' },
        accounts: { $sum: '$territorial_data.totals.accounts_count' },
        npwp: { $sum: '$territorial_data.totals.npwp_count' },
        nib: { $sum: '$territorial_data.totals.nib_count' },
        rat: { $sum: '$territorial_data.totals.rat_count' },
        village_count: { $sum: 1 }
      }
    }
  ]).toArray();
  
  console.log('--- Totals from territorial_data.totals ---');
  console.log(totals[0]);

  await client.close();
}

checkData();
