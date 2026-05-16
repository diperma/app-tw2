import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = 'simkopdes';

async function refresh() {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection('village_readiness');
    const summaryCol = db.collection('summaries');

    console.log('Fetching unique provinces and districts...');
    const provinces = await col.distinct('territorial_data.province');
    const pairs = []; // { province, district }
    
    // Add National
    pairs.push({ province: 'All', district: 'All' });
    
    // Add each province
    for (const p of provinces) {
      if (!p) continue;
      pairs.push({ province: p, district: 'All' });
      const districts = await col.distinct('territorial_data.district', { 'territorial_data.province': p });
      for (const d of districts) {
        if (!d) continue;
        pairs.push({ province: p, district: d });
      }
    }

    console.log(`Generating ${pairs.length} summaries...`);
    
    for (let i = 0; i < pairs.length; i++) {
      const { province, district } = pairs[i];
      const match = {};
      if (province !== 'All') match['territorial_data.province'] = province;
      if (district !== 'All') match['territorial_data.district'] = district;

      const result = await col.aggregate([
        { $match: match },
        { $facet: {
          stats: [
            { $group: {
              _id: null,
              total_villages: { $sum: 1 },
              total_simpanan: { $sum: '$savings_summary.total_amount' },
              total_transaksi: { $sum: '$economic_impact.total_value' },
              rat_submitted: { $sum: { $add: ['$rat_summary.total_verified_rat', '$rat_summary.total_draft_rat'] } },
              has_npwp: { $sum: { $cond: [{ $gt: ['$territorial_data.totals.npwp_count', 0] }, 1, 0] } },
              has_nib: { $sum: { $cond: [{ $gt: ['$territorial_data.totals.nib_count', 0] }, 1, 0] } }
            }}
          ],
          highlights_savings: [
            { $group: {
              _id: '$territorial_data.district',
              province: { $first: '$territorial_data.province' },
              savings_total: { $sum: '$savings_summary.total_amount' },
              economic_impact_total: { $sum: '$economic_impact.total_value' },
              rat_total: { $sum: { $add: ['$rat_summary.total_verified_rat', '$rat_summary.total_draft_rat'] } }
            }},
            { $sort: { savings_total: -1 } },
            { $limit: 10 }
          ],
          highlights_transactions: [
            { $group: {
              _id: '$territorial_data.district',
              province: { $first: '$territorial_data.province' },
              savings_total: { $sum: '$savings_summary.total_amount' },
              economic_impact_total: { $sum: '$economic_impact.total_value' },
              rat_total: { $sum: { $add: ['$rat_summary.total_verified_rat', '$rat_summary.total_draft_rat'] } }
            }},
            { $sort: { economic_impact_total: -1 } },
            { $limit: 10 }
          ],
          highlights_rat: [
            { $group: {
              _id: '$territorial_data.district',
              province: { $first: '$territorial_data.province' },
              savings_total: { $sum: '$savings_summary.total_amount' },
              economic_impact_total: { $sum: '$economic_impact.total_value' },
              rat_total: { $sum: { $add: ['$rat_summary.total_verified_rat', '$rat_summary.total_draft_rat'] } }
            }},
            { $sort: { rat_total: -1 } },
            { $limit: 10 }
          ],
          chart_rat: [
            { $group: {
              _id: null,
              Verified: { $sum: '$rat_summary.total_verified_rat' },
              Draft: { $sum: '$rat_summary.total_draft_rat' },
              'Belum RAT': { $sum: '$rat_summary.total_no_rat' }
            }}
          ],
          chart_store: [
            { $unwind: '$store_readiness' },
            { $group: {
              _id: '$store_readiness.label',
              value: { $sum: '$store_readiness.value' }
            }}
          ],
          regional: [
             { $group: {
                _id: (district !== 'All') ? '$territorial_data.subdistrict' : (province !== 'All') ? '$territorial_data.district' : '$territorial_data.province',
                total_koperasi: { $sum: 1 },
                has_npwp: { $sum: { $cond: [{ $gt: ['$territorial_data.totals.npwp_count', 0] }, 1, 0] } },
                has_nib: { $sum: { $cond: [{ $gt: ['$territorial_data.totals.nib_count', 0] }, 1, 0] } },
                rat_verified: { $sum: '$rat_summary.total_verified_rat' },
                total_simpanan: { $sum: '$savings_summary.total_amount' },
                total_transaksi: { $sum: '$economic_impact.total_value' }
             }},
             { $sort: { total_simpanan: -1 } }
          ]
        }}
      ]).toArray();

      const r = result[0];
      const summary = {
        province,
        district,
        stats: r.stats[0] || { total_villages: 0, total_simpanan: 0, total_transaksi: 0, rat_submitted: 0, has_npwp: 0, has_nib: 0 },
        highlights: {
          savings: r.highlights_savings.map(h => ({ ...h, province: h.province })),
          transactions: r.highlights_transactions.map(h => ({ ...h, province: h.province })),
          rat: r.highlights_rat.map(h => ({ ...h, province: h.province }))
        },
        charts: {
          store: r.chart_store.map(s => ({ label: s._id, value: s.value })),
          rat: r.chart_rat[0] || { Verified: 0, Draft: 0, 'Belum RAT': 0 }
        },
        regional: r.regional,
        updated_at: new Date()
      };

      await summaryCol.updateOne(
        { province, district },
        { $set: summary },
        { upsert: true }
      );

      if (i % 50 === 0) console.log(`Progress: ${i}/${pairs.length}`);
    }

    console.log('Creating index on summaries collection...');
    await summaryCol.createIndex({ province: 1, district: 1 });
    
    console.log('Refresh complete!');
  } finally {
    await client.close();
  }
}

refresh().catch(console.error);
