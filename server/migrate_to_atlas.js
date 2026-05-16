import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const LOCAL_URI = 'mongodb://localhost:27017';
const ATLAS_URI = process.env.MONGO_URI;
const DB_NAME = 'simkopdes';
const COLLECTION = 'village_readiness';

async function migrate() {
  console.log('--- Migration Debug Start ---');
  console.log('Local URI:', LOCAL_URI);
  console.log('Atlas URI (partial):', ATLAS_URI ? ATLAS_URI.substring(0, 30) + '...' : 'MISSING');

  if (!ATLAS_URI || ATLAS_URI.includes('<db_password>')) {
    console.error('Error: Please set a valid MONGO_URI in .env with your actual password.');
    return;
  }

  const localClient = new MongoClient(LOCAL_URI, { connectTimeoutMS: 5000 });
  const atlasClient = new MongoClient(ATLAS_URI, { connectTimeoutMS: 10000 });

  try {
    console.log('Connecting to Local MongoDB...');
    await localClient.connect();
    console.log('Local Connected.');

    console.log('Connecting to Atlas MongoDB...');
    await atlasClient.connect();
    console.log('Atlas Connected!');

    const localDb = localClient.db(DB_NAME);
    const atlasDb = atlasClient.db(DB_NAME);

    const localCol = localDb.collection(COLLECTION);
    const atlasCol = atlasDb.collection(COLLECTION);

    console.log('Fetching local data...');
    const data = await localCol.find({}).toArray();
    console.log(`Found ${data.length} records. Uploading to Atlas...`);

    if (data.length > 0) {
      await atlasCol.deleteMany({});
      const chunkSize = 1000;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await atlasCol.insertMany(chunk);
        console.log(`Progress: ${Math.min(i + chunkSize, data.length)}/${data.length}`);
      }
      console.log('Data migration complete!');
      console.log('Creating indexes on Atlas...');
      await atlasCol.createIndex({ 'territorial_data.province': 1 });
      await atlasCol.createIndex({ 'territorial_data.district': 1 });
      console.log('Indexes created successfully!');
    } else {
      console.log('No data found in local database.');
    }

  } catch (e) {
    console.error('\n--- MIGRATION ERROR ---');
    console.error('Error Message:', e.message);
    console.error('Error Code:', e.code);
    if (e.message.includes('authentication failed')) {
      console.error('HINT: Your password in .env might be incorrect.');
    } else if (e.message.includes('ETIMEOUT') || e.message.includes('Server selection timed out')) {
      console.error('HINT: This usually means your IP is NOT whitelisted in Atlas or a firewall is blocking the connection.');
    }
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

migrate();
