import { de } from 'date-fns/locale';
import ExcelJS from 'exceljs';

function generateExcelColumns(arrLength) {
  const columns = [];
  function getExcelColumnName(number) {
    let columnName = '';
    while (number > 0) {
      let remainder = (number - 1) % 26;
      columnName = String.fromCharCode(65 + remainder) + columnName;
      number = Math.floor((number - 1) / 26);
    }
    return columnName;
  }

  for (let i = 1; i <= arrLength; i++) {
    columns.push(getExcelColumnName(i));
  }

  return columns;
}

const generateTemplate = (indicators, dataElements, orgUnits) => {
  const groupedData = {};
  for (const indicator of indicators) {
    groupedData[indicator?.code] = dataElements?.filter(
      element =>
        element.code?.startsWith(indicator.code) &&
        !element.code?.includes('Comments') &&
        !element.code?.includes('Uploads')
    );
  }

  const firstRow = [];
  const secondRow = {
    'Reporting Year': 'Reporting Year',
  };

  firstRow.push({
    header: '',
    key: 'Reporting Year',
    width: 20,
  });

  const row1 = Object.values(groupedData);
  for (const row of row1) {
    for (const element of row) {
      firstRow.push({
        header: element.displayName,
        key: element.code,
        width: 30,
        wrapText: true,
      });
      secondRow[element.code] = element.code;
    }
  }

  const begin = 3;
  const end = 1000;

  const columnNames = generateExcelColumns(Object.keys(secondRow).length);

  const flattenedData = Object.values(groupedData).flat();

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');

  worksheet.columns = firstRow;

  worksheet.addRow(secondRow);

  worksheet.getRow(1).eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF012F6C' },
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
  });

  worksheet.getRow(2).eachCell(cell => {
    cell.font = { bold: true };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.height = 20;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFA7C6EC' },
    };
  });

  worksheet.eachRow(row => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCFCDC8' } },
        left: { style: 'thin', color: { argb: 'FFCFCDC8' } },
        bottom: { style: 'thin', color: { argb: 'FFCFCDC8' } },
        right: { style: 'thin', color: { argb: 'FFCFCDC8' } },
      };
    });
  });

  for (let i = begin; i <= end; i++) {
    columnNames.forEach((column, index) => {
      let validation = {
        type: 'custom',
        allowBlank: false,
        formulae: [],
        showErrorMessage: true,
        errorStyle: 'error',
        errorTitle: 'Invalid Value',
        error: 'Please enter a valid value',
      };
      if (index === 0) {
        validation.type = 'custom';
        validation.allowBlank = false;

        validation.formulae = [
          `=AND(COUNTIF(${column}${begin}:${column}${end},${column}${i})=1,ISNUMBER(${column}${i}),${column}${i}>=1900,${column}${i}<=YEAR(TODAY()))`,
        ];
        validation.errorTitle = 'Invalid Year';
        validation.error =
          'Please enter a valid year (data entry for future years and duplicates are not allowed)';
      } else {
        if (flattenedData[index - 1].valueType === 'NUMBER') {
          validation.type = 'decimal';
          validation.error = 'Please enter a valid numeric value';
          delete validation.formulae;
        } else if (flattenedData[index - 1].valueType === 'BOOLEAN') {
          validation.type = 'list';
          validation.allowBlank = true;
          validation.formulae = ['"Yes,No"'];
          validation.error = 'Please enter a Yes or No';
        }
      }
      const cell = worksheet.getCell(`${column}${i}`);
      cell.dataValidation = validation;
    });
  }

  return worksheet;
};

export default generateTemplate;
