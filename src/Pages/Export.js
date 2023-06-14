import React, { useEffect, useState } from 'react';
import { useDataQuery } from '@dhis2/app-runtime';
import { Button } from 'antd';
import {
  formatColumns,
  formatData,
  formatDataElements,
  createExport,
} from '../lib/export';
// import { read, utils, writeFileXLSX } from 'xlsx';
import 'handsontable/dist/handsontable.full.min.css';
import { registerAllModules } from 'handsontable/registry';
import { DatePicker, Form, Table } from 'antd';
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
    },
    '.ant-table-thead': {
      '& .ant-table-cell': {
        whiteSpace: 'pre-wrap',
        fontSize: '12px !important',
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

registerAllModules();

export default function Export({
  data: { dataElements, indicators, me, programs },
}) {
  const [data, setData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [headers, setHeaders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState(null);

  const classes = useStyles();

  const query = {
    events: {
      resource: 'tracker/events',
      params: ({ page }) => ({
        program: programs.programs[0].id,
        orgUnit: me.organisationUnits[0].id,
        pagination: false,
        fields:
          'dataValues,occurredAt,event,status,orgUnit,program,updatedAt,createdAt,assignedUser,completedAt,completedBy,trackedEntityInstance,trackedEntityType',
      }),
    },
  };

  const { loading: loadingData, error, data: eventData } = useDataQuery(query);

  useEffect(() => {
    if (eventData && dataElements && period) {
      const selectedEvents = eventData?.events?.instances?.filter(event => {
        const [start, end] = period;
        const eventYear = event.occurredAt.substring(0, 4);
        return eventYear >= start && eventYear <= end;
      });

      setFilteredData(selectedEvents);

      const formattedDataElements = formatDataElements(
        indicators?.indicators,
        dataElements?.dataElements,
        selectedEvents
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
        indicators?.indicators,
        dataElements?.dataElements,
        filteredData
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

      ['A1', 'A2', 'A3'].forEach(cell => {
        worksheet.getCell(cell).fill = darkBlue;
      });

      worksheet.mergeCells('A1:A3');
      // give the merged A1:A3 cell a value and background color
      worksheet.getCell('A1').value = 'Reporting Year';
      worksheet.getCell('A3').fill = worksheet.getCell('A1').font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      worksheet.getCell('A1').alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };

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

      workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        saveAs(blob, 'export.xlsx');
      });
    }
  };

  const columns = formatColumns(
    indicators?.indicators,
    dataElements?.dataElements
  );

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
        </div>
      </CardItem>
    </div>
  );
}
