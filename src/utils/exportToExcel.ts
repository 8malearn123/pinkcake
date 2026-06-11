import * as XLSX from 'xlsx';

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  fileName: string,
  sheetName: string = 'Sheet1'
) {
  // Transform data based on columns
  const exportData = data.map((row) => {
    const newRow: Record<string, unknown> = {};
    columns.forEach((col) => {
      newRow[col.header] = row[col.key];
    });
    return newRow;
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  const colWidths = columns.map((col) => ({ wch: col.width || 20 }));
  worksheet['!cols'] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Export file
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function exportMultipleSheetsToExcel(
  sheets: { data: Record<string, unknown>[]; columns: ExportColumn[]; name: string }[],
  fileName: string
) {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const exportData = sheet.data.map((row) => {
      const newRow: Record<string, unknown> = {};
      sheet.columns.forEach((col) => {
        newRow[col.header] = row[col.key];
      });
      return newRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const colWidths = sheet.columns.map((col) => ({ wch: col.width || 20 }));
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
