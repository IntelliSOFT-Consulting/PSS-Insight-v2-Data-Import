import { utils, writeFile } from 'xlsx';

const generateTemplate = (indicators, dataElements) => {
  console.log('indicators', indicators);
  console.log('dataElements', dataElements);
  const groupedData = {};
  for (const indicator of indicators) {
    groupedData[indicator?.code] = dataElements?.filter(
      element =>
        element.code?.startsWith(indicator.code) &&
        !element.code?.includes('Comments') &&
        !element.code?.includes('Uploads')
    );
  }

  const worksheetData = [];
  const firstRow = [];
  const secondRow = [];
  firstRow.push('');
  secondRow.push('Reporting year');
  const row1 = Object.values(groupedData);
  for (const row of row1) {
    for (const element of row) {
      firstRow.push({ t: 's', v: element.displayName, wch: 30 });
      secondRow.push({ t: 's', v: element.code, wch: 30 });

      secondRow.push(element.code);
    }
  }
  worksheetData.push(firstRow);
  worksheetData.push(secondRow);

  const workbook = utils.book_new();
  const worksheet = utils.aoa_to_sheet(worksheetData);

  utils.book_append_sheet(workbook, worksheet, 'Data');

  writeFile(workbook, 'data-import-template.xlsx');

  return workbook;
};

export default generateTemplate;
