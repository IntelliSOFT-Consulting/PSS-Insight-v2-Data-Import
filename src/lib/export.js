import { da } from 'date-fns/locale';

export const formatDataElements = (indicators, dataElements, events) => {
  const header1 = [''];
  const header2 = ['Reporting Year'];
  const header3 = [''];

  const data = [];
  const groupedData = {};
  for (const indicator of indicators) {
    groupedData[indicator?.code] = dataElements?.filter(
      element =>
        element.code?.startsWith(indicator.code) &&
        !element.code?.includes('Comments') &&
        !element.code?.includes('Uploads')
    );
  }

  const headers = Object.values(groupedData);
  for (const header of headers) {
    for (const element of header) {
      header1.push({ label: element.displayName, colspan: 3 });
      header2.push({ label: element.code, colspan: 3 });
      header3.push('value', 'National Benchmark', 'International Benchmark');
    }
  }

  //   populate data with events
  const headersText = headers.flat().map(header => header.id);
  const flatHeaders = headers.flat();
  for (const event of events) {
    const dataValues = {};
    for (const dataValue of event.dataValues) {
      const index = headersText.indexOf(dataValue.dataElement);

      const dataItem = flatHeaders[index];

      if (index > -1) {
        dataValues[dataItem?.code] =
          dataValue.value === 'true'
            ? 'Yes'
            : dataValue.value === 'false'
            ? 'No'
            : dataValue.value;

        dataValues[`${dataItem?.code} National Benchmark`] = null;
        dataValues[`${dataItem?.code} International Benchmark`] = null;
      }
    }

    data.push({
      reportingYear: event.occurredAt.substring(0, 4),
      ...dataValues,
    });
  }

  return { headers: [header1, header2, header3], data: data };
};

export const formatColumns = (indicators, dataElements) => {
  const groupedData = {};
  for (const indicator of indicators) {
    groupedData[indicator?.code] = dataElements?.filter(
      element =>
        element.code?.startsWith(indicator.code) &&
        !element.code?.includes('Comments') &&
        !element.code?.includes('Uploads')
    );
  }

  const headers = Object.values(groupedData).flat();

  const columns = headers.map(header => {
    return {
      title: header.displayName,
      children: [
        {
          title: header.code,
          key: header.code,
          width: 150,
          children: [
            {
              title: 'Value',
              dataIndex: header.code,
              key: 'value',
              width: 150,
            },
            {
              title: 'National Benchmark',
              dataIndex: `${header.code} National Benchmark`,
              key: `${header.code} National Benchmark`,
              width: 150,
            },
            {
              title: 'International Benchmark',
              dataIndex: `${header.code} International Benchmark`,
              key: `${header.code} International Benchmark`,
              width: 150,
            },
          ],
        },
      ],
    };
  });
  columns.unshift({
    title: 'Reporting Year',
    dataIndex: 'reportingYear',
    key: 'reportingYear',
    width: 150,
  });

  return columns;
};
