import React, { useEffect, useState } from 'react';
import { useDataQuery, useDataEngine } from '@dhis2/app-runtime';
import { formatColumns, formatDataElements, createExport } from '../lib/export';
import { DatePicker, Form, Table, Button, Empty } from 'antd';
import moment from 'moment';
import CardItem from '../components/Card';
import { createUseStyles } from 'react-jss';
import { CloudDownloadOutlined } from '@ant-design/icons';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';

const { RangePicker } = DatePicker;

const useStyles = createUseStyles({
  '@global': {
    '.ant-btn-primary': {
      backgroundColor: '#012f6c',
      '&:hover': {
        backgroundColor: '#0067B9 !important',
      },
    },
    '.ant-table': {
      margin: '1rem 0 !important',
      width: '100% !important',
      overflow: 'auto !important',
      fontSize: '11px !important',
      borderRadius: '0px !important',
    },
    '.ant-table-thead': {
      '& .ant-table-cell': {
        whiteSpace: 'pre-wrap',
        fontSize: '11px !important',
        fontWeight: '500 !important',
        width: '100% !important',
        textAlign: 'center !important',
        borderRadius: '0px !important',
        padding: '3px 5px !important',
      },

      '& tr:first-child': {
        '& th': {
          backgroundColor: '#012f6c',
          color: 'white',
        },
      },
      '& tr:nth-child(2)': {
        '& th': {
          backgroundColor: '#a7c6ec',
        },
      },
      '& tr:nth-child(3)': {
        '& th': {
          backgroundColor: '#a7c6ec',
        },
      },
    },
  },

  exportHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  exportTable: {
    width: '100%',
    overflow: 'auto',
  },
});

export default function Export({
  data: { dataElements, indicators, me, programs },
}) {
  const [data, setData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [headers, setHeaders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState(null);
  const [benchmarks, setBenchmarks] = useState([]);
  const [filteredElements, setFilteredElements] = useState([]);
  const [filteredIndicators, setFilteredIndicators] = useState([]);

  useEffect(() => {
    if (dataElements && indicators) {
      const filtered = dataElements?.dataElements?.filter(
        element =>
          !element?.code?.includes('Benchmark') &&
          !element?.code?.includes('Comment') &&
          !element?.code?.includes('Upload')
      );

      const filteredInd = indicators?.indicators?.filter(
        indicator =>
          !indicator?.code?.includes('Benchmark') &&
          !indicator?.code?.includes('Comment') &&
          !indicator?.code?.includes('Upload')
      );

      setFilteredIndicators(filteredInd);
      setFilteredElements(filtered);
    }
  }, [dataElements, indicators]);

  const engine = useDataEngine();

  const classes = useStyles();

  const query = {
    events: {
      resource: 'tracker/events',
      params: ({ page }) => ({
        program: programs.programs[0].id,
        orgUnit: me.organisationUnits[0].id,
        pageSize: 20000,
        fields:
          'dataValues,occurredAt,event,status,orgUnit,program,updatedAt,createdAt,assignedUser,completedAt,completedBy,trackedEntityInstance,trackedEntityType',
      }),
    },
  };

  const { loading: loadingData, error, data: eventData } = useDataQuery(query);

  const queryBenchmarks = async () => {
    // get dataSets
    const { data } = await engine.query({
      data: {
        resource: 'dataSets',
        params: {
          fields: 'id,name',
          paging: false,
          filter: 'name:ilike:Benchmark',
        },
      },
    });

    const { data: benchmarkElements } = await engine.query({
      data: {
        resource: 'dataElements',
        params: {
          fields: 'id,name,displayName',
          paging: false,
          filter: 'name:like:Benchmark',
        },
      },
    });

    if (
      data?.dataSets?.length > 0 &&
      benchmarkElements?.dataElements?.length > 0
    ) {
      const dataSetId = data?.dataSets[0]?.id;
      const { data: dataValues } = await engine.query({
        data: {
          resource: 'dataValueSets',
          params: {
            orgUnit: me?.organisationUnits[0]?.id,
            period: new Date().getFullYear() - 1,
            dataSet: dataSetId,
            paging: false,
            fields: 'dataElement,value,displayName',
          },
        },
      });
      const benchmarkData = benchmarkElements?.dataElements?.map(element => {
        const dataValue = dataValues?.dataValues?.find(
          value => value.dataElement === element.id
        );
        return {
          id: element.id,
          name: element.displayName?.replace('Benchmark', '')?.replace('_', ''),
          value: dataValue?.value || 0,
        };
      });
      setBenchmarks(benchmarkData);
      return benchmarkData;
    }
    return [];
  };

  useEffect(() => {
    queryBenchmarks();
  }, []);

  useEffect(() => {
    if (eventData && dataElements && period) {
      const selectedEvents = eventData?.events?.instances?.filter(event => {
        const [start, end] = period;
        const eventYear = event.occurredAt.substring(0, 4);
        return eventYear >= start && eventYear <= end;
      });

      setFilteredData(selectedEvents);

      const formattedDataElements = formatDataElements(
        filteredIndicators,
        filteredElements,
        selectedEvents,
        benchmarks
      );

      setData(formattedDataElements?.data);

      setHeaders(formattedDataElements?.headers);
    }
  }, [eventData, dataElements, period]);

  const handleFetch = values => {
    if (eventData && dataElements) {
      const [start, end] = values?.period;

      const formattedStart = start.format('YYYY');
      const formattedEnd = end.format('YYYY');

      setPeriod([formattedStart, formattedEnd]);
    }
  };

  const handleDownload = () => {
    // create sheet using headers and data and xlsx
    if (filteredData && indicators && dataElements) {
      const exportPayload = createExport(
        filteredIndicators,
        filteredElements,
        filteredData,
        benchmarks
      );

      const cols = exportPayload[0];
      const rows = exportPayload.slice(1);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data');

      worksheet.columns = cols;

      worksheet.addRows(rows);

      const border = {
        top: { style: 'thin', color: { argb: 'FFF0F0F0' } },
        left: { style: 'thin', color: { argb: 'FFF0F0F0' } },
        bottom: { style: 'thin', color: { argb: 'FFF0F0F0' } },
        right: { style: 'thin', color: { argb: 'FFF0F0F0' } },
      };

      const darkBlue = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF012F6C' },
      };

      worksheet.mergeCells('A1:A3');
      worksheet.getCell('A1').value = 'Reporting Year';

      worksheet.getRow(1).eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF012F6C' },
        };
        cell.colSpan = 3;
        cell.border = border;
        cell.width = 30;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true,
        };
      });

      let colIndex = 2;
      while (colIndex <= cols.length) {
        worksheet.mergeCells(1, colIndex, 1, colIndex + 2);
        worksheet.mergeCells(2, colIndex, 2, colIndex + 2);
        colIndex += 3;
      }

      worksheet.getRow(2).eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFA7C6EC' },
        };
        cell.border = border;
        cell.font = { bold: true, color: { argb: 'FF000000' } };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true,
        };
      });

      worksheet.getRow(3).eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFA7C6EC' },
        };
        cell.border = border;
        cell.width = 30;
        cell.font = { bold: true, color: { argb: 'FF000000' } };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true,
        };
      });

      ['A1', 'A2', 'A3'].forEach(cell => {
        worksheet.getCell(cell).fill = darkBlue;
        worksheet.getCell(cell).font = {
          bold: true,
          color: { argb: 'FFFFFFFF' },
        };
      });

      workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        saveAs(blob, 'export.xlsx');
      });
    }
  };

  const columns = formatColumns(filteredIndicators, filteredElements);

  const header = (
    <div className={classes.exportHeader}>
      <h5>EXPORT DATA</h5>
      {data && (
        <Button
          icon={<CloudDownloadOutlined />}
          size='small'
          onClick={handleDownload}
          loading={loading}
        >
          Download
        </Button>
      )}
    </div>
  );

  return (
    <div className={classes.root}>
      <CardItem title={header}>
        <Form layout='inline' onFinish={handleFetch}>
          <Form.Item name='period'>
            <RangePicker
              size='large'
              picker='year'
              disabledDate={current =>
                current && current > moment().endOf('year')
              }
            />
          </Form.Item>
          <Form.Item>
            <Button
              type='primary'
              htmlType='submit'
              loading={loadingData}
              disabled={loadingData}
              size='large'
            >
              Filter
            </Button>
          </Form.Item>
        </Form>
        <div className={classes.exportTable}>
          {data && (
            <Table
              bordered
              dataSource={data}
              columns={columns}
              pagination={data.length > 20 ? { pageSize: 20 } : false}
              size='small'
            />
          )}
          {!data && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description='No data to display'
            />
          )}
        </div>
      </CardItem>
    </div>
  );
}
