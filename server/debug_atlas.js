import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function debugConnect() {
  const uri = process.env.MONGO_URI;
  console.log('Testing connection to:', uri.split('@')[1]); // Log host part only
  
  const client = new MongoClient(uri, { 
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000
  });

  try {
    await client.connect();
    console.log('Successfully connected to Atlas!');
    const admin = client.db().admin();
    const info = await admin.serverStatus();
    console.log('Server version:', info.version);
    await client.close();
  } catch (e) {
    console.error('--- CONNECTION FAILED ---');
    console.error('Name:', e.name);
    console.error('Code:', e.code);
    console.error('Reason:', e.reason ? JSON.stringify(e.reason, null, 2) : 'No specific reason given');
    console.error('Full Message:', e.message);
  }
}

debugConnect();
