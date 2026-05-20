const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testMaxTrans() {
  const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(mongoUrl);
  try {
    await client.connect();
    const db = client.db('simkopdes');
    const collection = db.collection('village_readiness');

    // Run an aggregation to find the document with max economic_impact.total_value for each province
    const result = await collection.aggregate([
      {
        $group: {
          _id: "$territorial_data.province",
          max_val: { $max: "$economic_impact.total_value" },
          doc: { $first: "$$ROOT" } // we'll sort first to make sure we get the correct doc matching the max value
        }
      }
    ]).toArray();

    console.log("Raw grouping check (without sort):");
    result.slice(0, 5).forEach(r => {
      console.log(`Province: ${r._id}, Max Value: ${r.max_val}`);
    });

    console.log("\nCorrect aggregation with sort to find the specific cooperative for max transaction value:");
    const correctResult = await collection.aggregate([
      { $sort: { "economic_impact.total_value": -1 } },
      {
        $group: {
          _id: "$territorial_data.province",
          max_transaction_value: { $first: "$economic_impact.total_value" },
          cooperative_name: { $first: { $arrayElemAt: ["$territorial_data.cooperatives.name", 0] } },
          district: { $first: "$territorial_data.district" },
          subdistrict: { $first: "$territorial_data.subdistrict" },
          village: { $first: "$territorial_data.village" }
        }
      },
      { $sort: { max_transaction_value: -1 } }
    ]).toArray();

    correctResult.forEach(r => {
      console.log(`Province: ${r._id}`);
      console.log(`  Cooperative: ${r.cooperative_name} (Desa: ${r.village}, Kec: ${r.subdistrict}, Kab: ${r.district})`);
      console.log(`  Max Transaction: Rp ${r.max_transaction_value.toLocaleString('id-ID')}`);
    });

  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

testMaxTrans();
