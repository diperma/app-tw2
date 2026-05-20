const ExcelJS = require('exceljs');

async function checkRows() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('scratch/test_export_jawa_tengah.xlsx');
  const worksheet = workbook.getWorksheet('Kesiapan Desa');
  console.log(`Excel sheet 'Kesiapan Desa' loaded.`);
  console.log(`Total Rows (including header): ${worksheet.rowCount}`);
  if (worksheet.rowCount > 1) {
    console.log('First data row preview:');
    const firstRow = worksheet.getRow(2);
    const values = [];
    firstRow.eachCell(cell => {
      values.push(cell.value);
    });
    console.log(values);
  }
}

checkRows().catch(err => console.error(err));
