import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = 'simkopdes';
const collectionName = 'village_readiness';

let client;
let db;

export async function connectDb() {
  if (db) return db;
  client = new MongoClient(url);
  await client.connect();
  db = client.db(dbName);
  console.log('Connected to MongoDB');
  return db;
}

export function getCollection() {
  if (!db) throw new Error('Database not connected. Call connectDb() first.');
  return db.collection(collectionName);
}
