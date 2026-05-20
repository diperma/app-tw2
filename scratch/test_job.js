const { MongoClient } = require('mongodb');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getStoreProgress = (storeReadiness) => {
  if (!storeReadiness || !Array.isArray(storeReadiness)) return 'Belum pembangunan';
  const mapping = {
    'Total Pembangunan 100%': '100%',
    'Total Pembangunan 76% - 99%': '76 - 99%',
    'Total Pembangunan 51% - 75%': '51 - 75%',
    'Total Pembangunan 21% - 50%': '21 - 50%',
    'Total Pembangunan hingga 20%': '0 - 20%'
  };
  for (const key of Object.keys(mapping)) {
    const item = storeReadiness.find(s => s.label === key);
    if (item && item.value > 0) return mapping[key];
  }
  return 'Belum pembangunan';
};

async function testExport() {
  const url = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(url);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db('simkopdes');
    const col = db.collection('village_readiness');

    const total = await col.countDocuments();
    console.log(`Total documents: ${total}`);

    const cursor = col.find({});
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Kesiapan Desa');
    worksheet.columns = [
      { header: 'Provinsi', key: 'province', width: 20 },
      { header: 'Kabupaten', key: 'district', width: 25 },
      { header: 'Kecamatan', key: 'subdistrict', width: 20 },
      { header: 'Desa', key: 'village', width: 20 },
      { header: 'Nama Koperasi', key: 'koperasi', width: 35 },
      { header: 'Simpanan Total', key: 'savings', width: 20 },
      { header: 'Total Transaksi', key: 'transactions', width: 20 },
      { header: 'Status NPWP', key: 'npwp', width: 15 },
      { header: 'Status NIB', key: 'nib', width: 15 },
      { header: 'Pengajuan RAT', key: 'rat_draft', width: 15 },
      { header: 'RAT Terverifikasi', key: 'rat_verified', width: 18 },
      { header: 'Progres Pembangunan Gerai', key: 'store_progress', width: 28 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '107C41' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    let processed = 0;
    while (await cursor.hasNext()) {
      const d = await cursor.next();
      
      const row = worksheet.addRow({
        province: d.territorial_data?.province || '',
        district: d.territorial_data?.district || '',
        subdistrict: d.territorial_data?.subdistrict || '',
        village: d.territorial_data?.village || '',
        koperasi: d.territorial_data?.village ? `Koperasi Desa ${d.territorial_data.village}` : '',
        savings: d.savings_summary?.total_amount || 0,
        transactions: d.economic_impact?.total_value || 0,
        npwp: d.territorial_data?.totals?.npwp_count > 0 ? 'Y' : 'N',
        nib: d.territorial_data?.totals?.nib_count > 0 ? 'Y' : 'N',
        rat_draft: d.rat_summary?.total_draft_rat || 0,
        rat_verified: d.rat_summary?.total_verified_rat || 0,
        store_progress: getStoreProgress(d.store_readiness)
      });

      row.getCell('savings').numFmt = '"Rp"#,##0';
      row.getCell('transactions').numFmt = '"Rp"#,##0';
      row.getCell('savings').alignment = { horizontal: 'right' };
      row.getCell('transactions').alignment = { horizontal: 'right' };
      row.getCell('npwp').alignment = { horizontal: 'center' };
      row.getCell('nib').alignment = { horizontal: 'center' };
      row.getCell('rat_draft').alignment = { horizontal: 'center' };
      row.getCell('rat_verified').alignment = { horizontal: 'center' };

      processed++;
      if (processed % 10000 === 0) {
        console.log(`Processed ${processed} / ${total} rows...`);
        await sleep(10);
      }
    }

    console.log(`Writing workbook for ${processed} rows...`);
    const scratchDir = path.join(process.cwd(), 'scratch');
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true });
    }
    const outputPath = path.join(scratchDir, `test_export.xlsx`);
    await workbook.xlsx.writeFile(outputPath);
    console.log(`Workbook written to ${outputPath}, file size: ${fs.statSync(outputPath).size} bytes`);
  } catch (err) {
    console.error('Export error:', err);
  } finally {
    await client.close();
  }
}

testExport();
