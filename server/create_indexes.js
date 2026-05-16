import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function createIndexes() {
  const url = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db('simkopdes');
    const col = db.collection('village_readiness');
    
    console.log('Creating indexes...');
    await col.createIndex({ 'territorial_data.province': 1 });
    await col.createIndex({ 'territorial_data.district': 1 });
    console.log('Indexes created successfully!');
  } finally {
    await client.close();
  }
}

createIndexes().catch(console.error);
