const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const ExcelJS = require('exceljs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

const supabaseUrl = process.env.SUPABASE_URL || 'https://qgavvzqwokypczdjopor.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnYXZ2enF3b2t5cGN6ZGpvcG9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkwNzM4NSwiZXhwIjoyMDk0NDgzMzg1fQ.YetVEqyYsSbmtTv6aY5t2LufA1GwRTO4SXPx0FjK9b4';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

const formatID = (num, digits = 1) => {
  if (num === undefined || num === null) return '0';
  return Number(num).toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

const formatIDInt = (num) => {
  if (num === undefined || num === null) return '0';
  return Number(num).toLocaleString('id-ID');
};

app.get('/api/provinces', async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('get_provinces');
    if (error) throw error;
    res.json(data.map(d => d.name));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/districts', async (req, res) => {
  const { province } = req.query;
  try {
    const { data, error } = await supabase.rpc('get_districts', { p_province: province || 'All' });
    if (error) throw error;
    res.json(data.map(d => d.name));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/stats', async (req, res) => {
  const { province, district } = req.query;
  try {
    const { data, error } = await supabase.rpc('get_stats', { 
      p_province: province || 'All', 
      p_district: district || 'All' 
    });
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/highlights', async (req, res) => {
  const { province, district } = req.query;
  try {
    const query = supabase.from('village_readiness').select('district, savings_total, economic_impact_total, rat_verified, rat_draft');
    if (province && province !== 'All') query.eq('province', province);
    if (district && district !== 'All') query.eq('district', district);
    
    const { data, error } = await query;
    if (error) throw error;

    const group = (arr, key, valKey) => {
      const g = arr.reduce((acc, d) => {
        acc[d[key]] = (acc[d[key]] || 0) + Number(d[valKey]);
        return acc;
      }, {});
      return Object.entries(g).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    };

    const savings = group(data, 'district', 'savings_total');
    const transactions = group(data, 'district', 'economic_impact_total');
    const rat = data.reduce((acc, d) => {
      acc[d.district] = (acc[d.district] || 0) + (d.rat_verified + d.rat_draft);
      return acc;
    }, {});
    const ratSorted = Object.entries(rat).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    res.json([
      { type: "Simpanan", icon: "Wallet", districts: savings.map(d => ({ name: d.name, value: `Rp${formatID(d.value / 1000000)} Jt` })) },
      { type: "Transaksi", icon: "ArrowUpRight", districts: transactions.map(d => ({ name: d.name, value: `Rp${formatID(d.value / 1000000)} Jt` })) },
      { type: "Penyelesaian RAT", icon: "CheckCircle", districts: ratSorted.map(d => ({ name: d.name, value: `${formatIDInt(d.value)} RAT` })) }
    ]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/charts', async (req, res) => {
  const { province, district } = req.query;
  try {
    const query = supabase.from('village_readiness').select('store_readiness, rat_verified, rat_draft, rat_none');
    if (province && province !== 'All') query.eq('province', province);
    if (district && district !== 'All') query.eq('district', district);
    
    const { data, error } = await query;
    if (error) throw error;

    const storeMap = {};
    let verified = 0, draft = 0, none = 0;
    
    data.forEach(d => {
      d.store_readiness?.forEach(s => {
        storeMap[s.label] = (storeMap[s.label] || 0) + s.value;
      });
      verified += d.rat_verified;
      draft += d.rat_draft;
      none += d.rat_none;
    });

    res.json({
      store: Object.entries(storeMap).map(([label, value]) => ({ label, value })),
      rat: { Verified: verified, Draft: draft, 'Belum RAT': none }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/regional-data', async (req, res) => {
  const { province, district } = req.query;
  try {
    const { data, error } = await supabase.rpc('get_regional_data', { 
      p_province: province || 'All', 
      p_district: district || 'All' 
    });
    if (error) throw error;

    res.json(data.map((d, i) => ({
      id: i,
      name: d.name,
      total_koperasi: Number(d.total_koperasi),
      has_npwp: Number(d.has_npwp),
      has_nib: Number(d.has_nib),
      rat_verified: Number(d.rat_verified),
      total_simpanan: Number(d.total_simpanan),
      total_transaksi: Number(d.total_transaksi),
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

app.get('/api/district-detail', async (req, res) => {
  const { district, type } = req.query;
  try {
    let query = supabase.from('village_readiness').select('village, savings_total, economic_impact_total, rat_verified, rat_draft');
    query.eq('district', district);
    
    if (type === 'Simpanan') query.order('savings_total', { ascending: false });
    else if (type === 'Transaksi') query.order('economic_impact_total', { ascending: false });
    else if (type === 'Penyelesaian RAT') query.order('rat_verified', { ascending: false });
    else query.order('village', { ascending: true });

    const { data, error } = await query.limit(200);
    if (error) throw error;
    
    res.json(data.map(d => ({
      village: d.village,
      koperasi: `Koperasi Desa ${d.village}`,
      value: type === 'Simpanan' 
        ? `Rp${formatID(d.savings_total / 1000000)} Jt`
        : (type === 'Transaksi' 
            ? `Rp${formatID(d.economic_impact_total / 1000000)} Jt`
            : (d.rat_verified > 0 ? 'Terverifikasi' : (d.rat_draft > 0 ? 'Draf' : 'Belum RAT'))),
      status: d.rat_verified > 0 ? 'Verified' : 'Draft'
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/export', async (req, res) => {
  const { province, district } = req.query;
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

    let query = supabase.from('village_readiness').select('*');
    if (province && province !== 'All') query.eq('province', province);
    if (district && district !== 'All') query.eq('district', district);

    const { data, error } = await query;
    if (error) throw error;

    data.forEach(d => {
      worksheet.addRow({
        province: d.province,
        district: d.district,
        subdistrict: d.subdistrict,
        village: d.village,
        koperasi: `Koperasi Desa ${d.village}`,
        savings: d.savings_total,
        transactions: d.economic_impact_total,
        npwp: d.npwp_count > 0 ? 'Y' : 'N',
        nib: d.nib_count > 0 ? 'Y' : 'N',
        rat_draft: d.rat_draft,
        rat_verified: d.rat_verified
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

if (process.env.VERCEL) {
  // No connectDb needed for Supabase
} else {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;
