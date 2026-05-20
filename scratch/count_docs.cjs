const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run() {
  const url = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(url);
  try {
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db('simkopdes');
    const collection = db.collection('village_readiness');
    const count = await collection.countDocuments();
    console.log(`Document count in village_readiness: ${count}`);
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  } finally {
    await client.close();
  }
}

run();
