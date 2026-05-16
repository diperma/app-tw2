const { MongoClient } = require('mongodb');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = 'simkopdes';
const collectionName = 'village_readiness';

const supabaseUrl = 'https://qgavvzqwokypczdjopor.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnYXZ2enF3b2t5cGN6ZGpvcG9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkwNzM4NSwiZXhwIjoyMDk0NDgzMzg1fQ.YetVEqyYsSbmtTv6aY5t2LufA1GwRTO4SXPx0FjK9b4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  const mongoClient = new MongoClient(mongoUrl);
  await mongoClient.connect();
  const db = mongoClient.db(dbName);
  const collection = db.collection(collectionName);

  console.log('Fetching data from MongoDB...');
  const data = await collection.find({}).toArray();
  console.log(`Found ${data.length} records.`);

  const transformed = data.map(d => ({
    province: d.territorial_data?.province,
    district: d.territorial_data?.district,
    subdistrict: d.territorial_data?.subdistrict,
    village: d.territorial_data?.village,
    npwp_count: d.territorial_data?.totals?.npwp_count || 0,
    nib_count: d.territorial_data?.totals?.nib_count || 0,
    rat_verified: d.rat_summary?.total_verified_rat || 0,
    rat_draft: d.rat_summary?.total_draft_rat || 0,
    rat_none: d.rat_summary?.total_no_rat || 0,
    savings_total: d.savings_summary?.total_amount || 0,
    economic_impact_total: d.economic_impact?.total_value || 0,
    store_readiness: d.store_readiness || []
  }));

  console.log('Uploading to Supabase in batches...');
  const batchSize = 100;
  for (let i = 0; i < transformed.length; i += batchSize) {
    const batch = transformed.slice(i, i + batchSize);
    const { error } = await supabase.from('village_readiness').insert(batch);
    if (error) {
      console.error('Error uploading batch:', error);
    } else {
      console.log(`Uploaded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(transformed.length / batchSize)}`);
    }
  }

  await mongoClient.close();
  console.log('Migration complete!');
}

migrate().catch(console.error);
