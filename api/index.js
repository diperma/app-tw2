import express from 'express';
import cors from 'cors';
import ExcelJS from 'exceljs';
import dotenv from 'dotenv';
import { connectDb, getCollection } from '../server/db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Robust CORS configuration
app.use(cors({
  origin: '*', // Allow all during debugging
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

const formatID = (num, digits = 1) => {
  if (num === undefined || num === null) return '0';
  return Number(num).toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

const formatIDInt = (num) => {
  if (num === undefined || num === null) return '0';
  return Number(num).toLocaleString('id-ID');
};

const getStoreProgress = (storeReadiness) => {
  if (!storeReadiness || !Array.isArray(storeReadiness)) return 'Belum pembangunan';
  
  const mapping = {
    'Total Pembangunan 100%': '100%',
    'Total Pembangunan 76% - 99%': '76 - 99%',
    'Total Pembangunan 51% - 75%': '51 - 75%',
    'Total Pembangunan 21% - 50%': '21 - 50%',
    'Total Pembangunan hingga 20%': '0 - 20%'
  };

  // Check from highest to lowest
  const categories = Object.keys(mapping);
  for (const cat of categories) {
    const item = storeReadiness.find(s => s.label === cat);
    if (item && item.value > 0) return mapping[cat];
  }

  return 'Belum pembangunan';
};

// Use a router to handle paths more flexibly
const router = express.Router();

router.get('/provinces', async (req, res) => {
  try {
    await connectDb();
    const col = getCollection();
    const data = await col.distinct('territorial_data.province');
    res.json(data.filter(Boolean).sort());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/districts', async (req, res) => {
  const { province } = req.query;
  try {
    await connectDb();
    const col = getCollection();
    const query = {};
    if (province && province !== 'All') query['territorial_data.province'] = province;
    const data = await col.distinct('territorial_data.district', query);
    res.json(data.filter(Boolean).sort());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/stats', async (req, res) => {
  const { province = 'All', district = 'All' } = req.query;
  try {
    const db = await connectDb();
    const summaryCol = db.collection('summaries');
    const summary = await summaryCol.findOne({ province, district });

    if (summary) {
      return res.json(summary.stats);
    }

    const col = getCollection();
    const match = {};
    if (province !== 'All') match['territorial_data.province'] = province;
    if (district !== 'All') match['territorial_data.district'] = district;

    const data = await col.aggregate([
      { $match: match },
      { $group: {
        _id: null,
        total_villages: { $sum: 1 },
        total_simpanan: { $sum: '$savings_summary.total_amount' },
        total_transaksi: { $sum: '$economic_impact.total_value' },
        rat_submitted: { $sum: { $add: ['$rat_summary.total_verified_rat', '$rat_summary.total_draft_rat'] } },
        has_npwp: { $sum: { $cond: [{ $gt: ['$territorial_data.totals.npwp_count', 0] }, 1, 0] } },
        has_nib: { $sum: { $cond: [{ $gt: ['$territorial_data.totals.nib_count', 0] }, 1, 0] } }
      }}
    ]).toArray();

    res.json(data[0] || { total_villages: 0, total_simpanan: 0, total_transaksi: 0, rat_submitted: 0, has_npwp: 0, has_nib: 0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/highlights', async (req, res) => {
  const { province = 'All', district = 'All' } = req.query;
  try {
    const db = await connectDb();
    const summaryCol = db.collection('summaries');
    const summary = await summaryCol.findOne({ province, district });

    if (summary) {
      const h = summary.highlights;
      // Handle new structure (object with categories) or old structure (array)
      const savingsList = Array.isArray(h) ? h : (h.savings || []);
      const transList = Array.isArray(h) ? h : (h.transactions || []);
      const ratList = Array.isArray(h) ? h : (h.rat || []);

      return res.json([
        { type: "Simpanan", icon: "Wallet", districts: savingsList.map(d => ({ name: d._id, province: d.province, value: `Rp${formatID(d.savings_total / 1000000)} Jt` })) },
        { type: "Transaksi", icon: "ArrowUpRight", districts: transList.map(d => ({ name: d._id, province: d.province, value: `Rp${formatID(d.economic_impact_total / 1000000)} Jt` })).sort((a,b) => parseFloat(b.value.replace(/[^\d]/g,'')) - parseFloat(a.value.replace(/[^\d]/g,''))) },
        { type: "Penyelesaian RAT", icon: "CheckCircle", districts: ratList.map(d => ({ name: d._id, province: d.province, value: `${formatIDInt(d.rat_total)} RAT` })).sort((a,b) => parseInt(b.value) - parseInt(a.value)) }
      ]);
    }

    const col = getCollection();
    const match = {};
    if (province !== 'All') match['territorial_data.province'] = province;
    if (district !== 'All') match['territorial_data.district'] = district;

    const data = await col.aggregate([
      { $match: match },
      { $group: {
        _id: '$territorial_data.district',
        province: { $first: '$territorial_data.province' },
        savings_total: { $sum: '$savings_summary.total_amount' },
        economic_impact_total: { $sum: '$economic_impact.total_value' },
        rat_total: { $sum: { $add: ['$rat_summary.total_verified_rat', '$rat_summary.total_draft_rat'] } }
      }},
      { $sort: { savings_total: -1 } }
    ]).toArray();

    const group = (arr, valKey) => {
      return arr.map(d => ({ name: d._id, province: d.province, value: d[valKey] })).sort((a, b) => b.value - a.value);
    };

    const savings = group(data, 'savings_total');
    const transactions = group(data, 'economic_impact_total');
    const ratSorted = group(data, 'rat_total');

    res.json([
      { type: "Simpanan", icon: "Wallet", districts: savings.slice(0, 10).map(d => ({ name: d.name, province: d.province, value: `Rp${formatID(d.value / 1000000)} Jt` })) },
      { type: "Transaksi", icon: "ArrowUpRight", districts: transactions.slice(0, 10).map(d => ({ name: d.name, province: d.province, value: `Rp${formatID(d.value / 1000000)} Jt` })) },
      { type: "Penyelesaian RAT", icon: "CheckCircle", districts: ratSorted.slice(0, 10).map(d => ({ name: d.name, province: d.province, value: `${formatIDInt(d.value)} RAT` })) }
    ]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/charts', async (req, res) => {
  const { province = 'All', district = 'All' } = req.query;
  try {
    const db = await connectDb();
    const summaryCol = db.collection('summaries');
    const summary = await summaryCol.findOne({ province, district });

    if (summary) {
      return res.json(summary.charts);
    }

    const col = getCollection();
    const match = {};
    if (province !== 'All') match['territorial_data.province'] = province;
    if (district !== 'All') match['territorial_data.district'] = district;

    const results = await col.aggregate([
      { $match: match },
      { $facet: {
        rat: [
          { $group: {
            _id: null,
            Verified: { $sum: '$rat_summary.total_verified_rat' },
            Draft: { $sum: '$rat_summary.total_draft_rat' },
            'Belum RAT': { $sum: '$rat_summary.total_no_rat' }
          }}
        ],
        store: [
          { $unwind: '$store_readiness' },
          { $group: {
            _id: '$store_readiness.label',
            value: { $sum: '$store_readiness.value' }
          }},
          { $project: { label: '$_id', value: 1, _id: 0 } }
        ]
      }}
    ]).toArray();

    const data = results[0];
    res.json({
      store: data.store || [],
      rat: data.rat[0] || { Verified: 0, Draft: 0, 'Belum RAT': 0 }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/regional-data', async (req, res) => {
  const { province = 'All', district = 'All' } = req.query;
  try {
    const db = await connectDb();
    const summaryCol = db.collection('summaries');
    const summary = await summaryCol.findOne({ province, district });

    if (summary && summary.regional) {
      return res.json(summary.regional.map((d, i) => ({
        id: i,
        name: d._id,
        total_koperasi: d.total_koperasi,
        has_npwp: d.has_npwp,
        has_nib: d.has_nib,
        rat_verified: d.rat_verified,
        total_simpanan: d.total_simpanan,
        total_transaksi: d.total_transaksi,
        total_koperasi_fmt: formatIDInt(d.total_koperasi),
        has_npwp_fmt: formatIDInt(d.has_npwp),
        has_nib_fmt: formatIDInt(d.has_nib),
        rat_verified_fmt: formatIDInt(d.rat_verified),
        total_simpanan_fmt: `Rp${formatID(d.total_simpanan / 1000000)} Jt`,
        total_transaksi_fmt: `Rp${formatID(d.total_transaksi / 1000000)} Jt`
      })));
    }

    const col = getCollection();
    const match = {};
    if (province !== 'All') match['territorial_data.province'] = province;
    if (district !== 'All') match['territorial_data.district'] = district;

    const groupKey = (district !== 'All') ? '$territorial_data.subdistrict' : (province !== 'All') ? '$territorial_data.district' : '$territorial_data.province';

    const data = await col.aggregate([
      { $match: match },
      { $group: {
        _id: groupKey,
        total_koperasi: { $sum: 1 },
        has_npwp: { $sum: { $cond: [{ $gt: ['$territorial_data.totals.npwp_count', 0] }, 1, 0] } },
        has_nib: { $sum: { $cond: [{ $gt: ['$territorial_data.totals.nib_count', 0] }, 1, 0] } },
        rat_verified: { $sum: '$rat_summary.total_verified_rat' },
        total_simpanan: { $sum: '$savings_summary.total_amount' },
        total_transaksi: { $sum: '$economic_impact.total_value' }
      }},
      { $sort: { total_simpanan: -1 } }
    ]).toArray();

    res.json(data.map((d, i) => ({
      id: i,
      name: d._id,
      total_koperasi: d.total_koperasi,
      has_npwp: d.has_npwp,
      has_nib: d.has_nib,
      rat_verified: d.rat_verified,
      total_simpanan: d.total_simpanan,
      total_transaksi: d.total_transaksi,
      total_koperasi_fmt: formatIDInt(d.total_koperasi),
      has_npwp_fmt: formatIDInt(d.has_npwp),
      has_nib_fmt: formatIDInt(d.has_nib),
      rat_verified_fmt: formatIDInt(d.rat_verified),
      total_simpanan_fmt: `Rp${formatID(d.total_simpanan / 1000000)} Jt`,
      total_transaksi_fmt: `Rp${formatID(d.total_transaksi / 1000000)} Jt`
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/district-detail', async (req, res) => {
  const { district, type } = req.query;
  try {
    await connectDb();
    const col = getCollection();
    const sort = {};
    if (type === 'Simpanan') sort['savings_summary.total_amount'] = -1;
    else if (type === 'Transaksi') sort['economic_impact.total_value'] = -1;
    else if (type === 'Penyelesaian RAT') sort['rat_summary.total_verified_rat'] = -1;
    else sort['territorial_data.village'] = 1;

    const data = await col.find({ 'territorial_data.district': district })
      .sort(sort)
      .limit(200)
      .toArray();
    
    res.json(data.map(d => ({
      village: d.territorial_data.village,
      koperasi: `Koperasi Desa ${d.territorial_data.village}`,
      value: type === 'Simpanan' 
        ? `Rp${formatID(d.savings_summary.total_amount / 1000000)} Jt`
        : (type === 'Transaksi' 
            ? `Rp${formatID(d.economic_impact.total_value / 1000000)} Jt`
            : (d.rat_summary.total_verified_rat > 0 ? 'Terverifikasi' : (d.rat_summary.total_draft_rat > 0 ? 'Draf' : 'Belum RAT'))),
      status: d.rat_summary.total_verified_rat > 0 ? 'Verified' : 'Draft',
      progress: getStoreProgress(d.store_readiness)
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/export', async (req, res) => {
  const { province, district, subdistrict } = req.query;
  try {
    await connectDb();
    const col = getCollection();
    const match = {};
    if (province && province !== 'All') match['territorial_data.province'] = province;
    if (district && district !== 'All') match['territorial_data.district'] = district;
    if (subdistrict && subdistrict !== 'All') match['territorial_data.subdistrict'] = subdistrict;

    const data = await col.find(match).toArray();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Village Readiness');
    worksheet.columns = [
      { header: 'Provinsi', key: 'province', width: 20 },
      { header: 'Kabupaten', key: 'district', width: 20 },
      { header: 'Kecamatan', key: 'subdistrict', width: 20 },
      { header: 'Desa', key: 'village', width: 20 },
      { header: 'Nama Koperasi', key: 'koperasi', width: 30 },
      { header: 'Simpanan Total', key: 'savings', width: 15 },
      { header: 'Total Transaksi', key: 'transactions', width: 15 },
      { header: 'Status NPWP', key: 'npwp', width: 15 },
      { header: 'Status NIB', key: 'nib', width: 15 },
      { header: 'Pengajuan RAT', key: 'rat_draft', width: 15 },
      { header: 'RAT Terverifikasi', key: 'rat_verified', width: 15 },
      { header: 'Progres Pembangunan Gerai', key: 'store_progress', width: 25 }
    ];

    data.forEach(d => {
      worksheet.addRow({
        province: d.territorial_data.province,
        district: d.territorial_data.district,
        subdistrict: d.territorial_data.subdistrict,
        village: d.territorial_data.village,
        koperasi: `Koperasi Desa ${d.territorial_data.village}`,
        savings: d.savings_summary.total_amount,
        transactions: d.economic_impact.total_value,
        npwp: d.territorial_data.totals.npwp_count > 0 ? 'Y' : 'N',
        nib: d.territorial_data.totals.nib_count > 0 ? 'Y' : 'N',
        rat_draft: d.rat_summary.total_draft_rat,
        rat_verified: d.rat_summary.total_verified_rat,
        store_progress: getStoreProgress(d.store_readiness)
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'Export_Kesiapan_Desa.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Mount the router at /api and also at root to handle both direct and rewritten requests
app.use('/api', router);
app.use('/', router);

if (!process.env.VERCEL) {
  await connectDb();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;
