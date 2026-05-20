const { MongoClient } = require('mongodb');
const ExcelJS = require('exceljs');
require('dotenv').config();

const getStoreProgress = (storeReadiness) => {
  if (!storeReadiness || !Array.isArray(storeReadiness)) return 'Belum pembangunan';

  const mapping = {
    'Total Pembangunan 100%': '100%',
    'Total Pembangunan 76% - 99%': '76 - 99%',
    'Total Pembangunan 51% - 75%': '51 - 75%',
    'Total Pembangunan 21% - 50%': '21 - 50%',
    'Total Pembangunan hingga 20%': '0 - 20%'
  };

  const categories = Object.keys(mapping);
  for (const cat of categories) {
    const item = storeReadiness.find(s => s.label === cat);
    if (item && item.value > 0) return mapping[cat];
  }

  return 'Belum pembangunan';
};

async function exportToExcel() {
  const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(mongoUrl);
  try {
    console.log('Connecting to database...');
    await client.connect();
    const db = client.db('simkopdes');
    const collection = db.collection('village_readiness');

    console.log('Fetching all documents from village_readiness collection...');
    const data = await collection.find({}).toArray();
    console.log(`Successfully fetched ${data.length} documents.`);

    console.log('Generating Excel sheet...');
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

    data.forEach((d, index) => {
      if (index % 5000 === 0 && index > 0) {
        console.log(`Processed ${index} rows...`);
      }
      worksheet.addRow({
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
    });

    const outputPath = 'export_village_readiness_all.xlsx';
    console.log(`Saving Excel workbook to ${outputPath}...`);
    await workbook.xlsx.writeFile(outputPath);
    console.log('Export completed successfully!');
  } catch (error) {
    console.error('An error occurred during export:', error);
  } finally {
    await client.close();
  }
}

exportToExcel();
