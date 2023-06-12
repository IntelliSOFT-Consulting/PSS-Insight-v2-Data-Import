import ExcelJS from 'exceljs';

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
    'Organisation Unit': 'Organisation Unit',
    'Reporting Year': 'Reporting Year',
  };

  firstRow.push({
    header: '',
    key: 'Organisation Unit',
    width: 20,
  });
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

  const countries = orgUnits.map(orgUnit => `${orgUnit.name}`);
  const column = 'A';
  const startRow = 3;
  const endRow = 1000;


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
  const listSheet = workbook.addWorksheet('Sheet2');
  listSheet.protect('', { sheet: true });
  listSheet.state = 'veryHidden';
  countries.forEach((value, index) => {
    const cell = listSheet.getCell(`A${index + 1}`);
    cell.value = value;
  });

  const validation = {
    type: 'list',
    allowBlank: false,
    formulae: [`=Sheet2!$A$1:$A$${countries.length}`],
    showErrorMessage: true,
    errorStyle: 'error',
    errorTitle: 'Invalid Country',
    error: 'Please select a country from the list',
  };

  for (let i = startRow; i <= endRow; i++) {
    const cell = worksheet.getCell(`${column}${i}`);
    cell.dataValidation = validation;
  }


  return worksheet;
};

export default generateTemplate;
