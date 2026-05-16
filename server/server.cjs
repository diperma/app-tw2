const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const ExcelJS = require('exceljs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = 'simkopdes';
const collectionName = 'village_readiness';

app.use(cors());
app.use(express.json());

let db;
async function connectDb() {
  const client = new MongoClient(mongoUrl);
  await client.connect();
  db = client.db(dbName);
  console.log('Connected to MongoDB');
}

const formatID = (num, digits = 1) => {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

const formatIDInt = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString('id-ID');
};

app.get('/api/provinces', async (req, res) => {
  try {
    const provinces = await db.collection(collectionName).distinct('territorial_data.province');
    res.json(provinces.sort());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/districts', async (req, res) => {
  const { province } = req.query;
  const match = province && province !== 'All' ? { 'territorial_data.province': province } : {};
  try {
    const districts = await db.collection(collectionName).distinct('territorial_data.district', match);
    res.json(districts.sort());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const getMatch = (req) => {
  const { province, district } = req.query;
  const match = {};
  if (province && province !== 'All') match['territorial_data.province'] = province;
  if (district && district !== 'All') match['territorial_data.district'] = district;
  return match;
};

app.get('/api/stats', async (req, res) => {
  const match = getMatch(req);
  try {
    const stats = await db.collection(collectionName).aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total_villages: { $sum: 1 },
          has_npwp: { $sum: '$territorial_data.totals.npwp_count' },
          has_nib: { $sum: '$territorial_data.totals.nib_count' },
          rat_submitted: { $sum: { $add: ['$rat_summary.total_verified_rat', '$rat_summary.total_draft_rat'] } }
        }
      }
    ]).toArray();
    res.json(stats[0] || { total_villages: 0, has_npwp: 0, has_nib: 0, rat_submitted: 0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/highlights', async (req, res) => {
  const match = getMatch(req);
  try {
    const col = db.collection(collectionName);
    const savings = await col.aggregate([
      { $match: match },
      { $group: { _id: '$territorial_data.district', total: { $sum: '$savings_summary.total_amount' } } },
      { $sort: { total: -1 } }
    ]).toArray();
    const transactions = await col.aggregate([
      { $match: match },
      { $group: { _id: '$territorial_data.district', total: { $sum: '$economic_impact.total_value' } } },
      { $sort: { total: -1 } }
    ]).toArray();
    
    // Revised RAT Highlights: Sum of Verified + Draft
    const rat = await col.aggregate([
      { $match: match },
      { $group: { _id: '$territorial_data.district', total: { $sum: { $add: ['$rat_summary.total_verified_rat', '$rat_summary.total_draft_rat'] } } } },
      { $sort: { total: -1 } }
    ]).toArray();

    res.json([
      { type: "Simpanan", icon: "Wallet", districts: savings.map(d => ({ name: d._id, value: `Rp${formatID(d.total / 1000000)} Jt` })) },
      { type: "Transaksi", icon: "ArrowUpRight", districts: transactions.map(d => ({ name: d._id, value: `Rp${formatID(d.total / 1000000)} Jt` })) },
      { type: "Penyelesaian RAT", icon: "CheckCircle", districts: rat.map(d => ({ name: d._id, value: `${formatIDInt(d.total)} RAT` })) }
    ]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/charts', async (req, res) => {
  const match = getMatch(req);
  try {
    const col = db.collection(collectionName);
    const storeData = await col.aggregate([
      { $match: match },
      { $unwind: '$store_readiness' },
      { $group: { _id: '$store_readiness.label', total: { $sum: '$store_readiness.value' } } }
    ]).toArray();
    const ratData = await col.aggregate([
      { $match: match },
      { $group: { _id: null, Verified: { $sum: '$rat_summary.total_verified_rat' }, Draft: { $sum: '$rat_summary.total_draft_rat' }, 'Belum RAT': { $sum: '$rat_summary.total_no_rat' } } }
    ]).toArray();
    res.json({
      store: storeData.map(d => ({ label: d._id, value: d.total })),
      rat: ratData[0] || { Verified: 0, Draft: 0, 'Belum RAT': 0 }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/regional-data', async (req, res) => {
  const match = getMatch(req);
  const { province, district } = req.query;
  let groupField = '$territorial_data.province';
  if (province && province !== 'All') groupField = '$territorial_data.district';
  if (district && district !== 'All') groupField = '$territorial_data.subdistrict';

  try {
    const data = await db.collection(collectionName).aggregate([
      { $match: match },
      {
        $group: {
          _id: groupField,
          total_koperasi: { $sum: 1 },
          has_npwp: { $sum: '$territorial_data.totals.npwp_count' },
          has_nib: { $sum: '$territorial_data.totals.nib_count' },
          rat_verified: { $sum: '$rat_summary.total_verified_rat' },
          total_simpanan: { $sum: '$savings_summary.total_amount' },
          total_transaksi: { $sum: '$economic_impact.total_value' }
        }
      },
      { $sort: { total_koperasi: -1 } }
    ]).toArray();

    res.json(data.map((d, i) => ({
      id: i,
      name: d._id,
      ...d,
      total_koperasi_fmt: formatIDInt(d.total_koperasi),
      has_npwp_fmt: formatIDInt(d.has_npwp),
      has_nib_fmt: formatIDInt(d.has_nib),
      rat_verified_fmt: formatIDInt(d.rat_verified),
      total_simpanan_fmt: `Rp${formatID(d.total_simpanan / 1000000)} Jt`,
      total_transaksi_fmt: `Rp${formatID(d.total_transaksi / 1000000)} Jt`,
      _id: undefined
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/district-detail', async (req, res) => {
  const { district, type } = req.query;
  try {
    const query = { 'territorial_data.district': district };
    let sort = {};
    if (type === 'Simpanan') sort = { 'savings_summary.total_amount': -1 };
    else if (type === 'Transaksi') sort = { 'economic_impact.total_value': -1 };
    else if (type === 'Penyelesaian RAT') sort = { 'rat_summary.total_verified_rat': -1 };
    else sort = { 'territorial_data.village': 1 };

    const details = await db.collection(collectionName).find(query).sort(sort).limit(200).toArray();
    
    res.json(details.map(d => ({
      village: d.territorial_data.village,
      koperasi: `Koperasi Desa ${d.territorial_data.village}`,
      value: type === 'Simpanan' 
        ? `Rp${formatID(d.savings_summary.total_amount / 1000000)} Jt`
        : (type === 'Transaksi' 
            ? `Rp${formatID(d.economic_impact.total_value / 1000000)} Jt`
            : (d.rat_summary.total_verified_rat > 0 ? 'Terverifikasi' : (d.rat_summary.total_draft_rat > 0 ? 'Draf' : 'Belum RAT'))),
      status: d.rat_summary.total_verified_rat > 0 ? 'Verified' : 'Draft'
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/export', async (req, res) => {
  const match = getMatch(req);
  try {
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
      { header: 'RAT Terverifikasi', key: 'rat_verified', width: 15 }
    ];
    const cursor = db.collection(collectionName).find(match);
    while (await cursor.hasNext()) {
      const d = await cursor.next();
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
        rat_verified: d.rat_summary.total_verified_rat
      });
    }
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'Export_Kesiapan_Desa.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

if (process.env.VERCEL) {
  connectDb();
} else {
  connectDb().then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  });
}

module.exports = app;
