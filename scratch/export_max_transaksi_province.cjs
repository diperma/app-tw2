const { MongoClient } = require('mongodb');
const ExcelJS = require('exceljs');
require('dotenv').config();

async function exportMaxTransactions() {
  const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(mongoUrl);
  try {
    console.log('Connecting to database...');
    await client.connect();
    const db = client.db('simkopdes');
    const collection = db.collection('village_readiness');

    console.log('Querying top KDKMP transactions by province...');
    // We sort descending by transaction value first so that $group $first picks the maximum one correctly
    const results = await collection.aggregate([
      { $sort: { "economic_impact.total_value": -1 } },
      {
        $group: {
          _id: "$territorial_data.province",
          max_transaction_value: { $first: "$economic_impact.total_value" },
          cooperative_name: { $first: { $arrayElemAt: ["$territorial_data.cooperatives.name", 0] } },
          district: { $first: "$territorial_data.district" },
          subdistrict: { $first: "$territorial_data.subdistrict" },
          village: { $first: "$territorial_data.village" }
        }
      },
      { $sort: { max_transaction_value: -1 } }
    ]).toArray();

    console.log(`Fetched ${results.length} provinces.`);

    console.log('Generating Excel sheet...');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Max Transaksi KDKMP');

    worksheet.columns = [
      { header: 'Provinsi', key: 'province', width: 25 },
      { header: 'Nama Koperasi (KDKMP)', key: 'cooperative', width: 45 },
      { header: 'Kabupaten/Kota', key: 'district', width: 25 },
      { header: 'Kecamatan', key: 'subdistrict', width: 20 },
      { header: 'Desa', key: 'village', width: 20 },
      { header: 'Maksimal Total Transaksi', key: 'max_transaction', width: 25 }
    ];

    // Format header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { name: 'Arial', family: 4, size: 11, bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2F4F4F' } // Dark Slate Gray
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    results.forEach(r => {
      // Fallback name if none found in cooperatives array
      const coopName = r.cooperative_name || (r.village ? `Koperasi Desa ${r.village}` : 'Belum Terdaftar');
      
      const row = worksheet.addRow({
        province: r._id || 'N/A',
        cooperative: coopName,
        district: r.district || 'N/A',
        subdistrict: r.subdistrict || 'N/A',
        village: r.village || 'N/A',
        max_transaction: r.max_transaction_value || 0
      });

      // Format transaction column as currency
      row.getCell('max_transaction').numFmt = '"Rp"#,##0';
    });

    const outputPath = 'max_transaksi_kdkmp_per_provinsi.xlsx';
    console.log(`Saving Excel file to ${outputPath}...`);
    await workbook.xlsx.writeFile(outputPath);
    console.log('Export completed successfully!');
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await client.close();
  }
}

exportMaxTransactions();
