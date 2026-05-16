const { MongoClient } = require('mongodb');
require('dotenv').config();

async function peek() {
  const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(mongoUrl);
  try {
    await client.connect();
    const db = client.db('simkopdes');
    const collection = db.collection('village_readiness');
    const record = await collection.findOne({});
    console.log(JSON.stringify(record, null, 2));
  } finally {
    await client.close();
  }
}

peek().catch(console.error);
