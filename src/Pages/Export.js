import React, { useEffect, useState } from 'react';
import { useDataQuery } from '@dhis2/app-runtime';
import { Button } from 'antd';
import { formatColumns, formatData, formatDataElements } from '../lib/export';
import { read, utils, writeFileXLSX } from 'xlsx';
import 'handsontable/dist/handsontable.full.min.css';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import { DatePicker, Form, Table } from 'antd';
import moment from 'moment';
import CardItem from '../components/Card';
import { createUseStyles } from 'react-jss';
import { da } from 'date-fns/locale';

const { RangePicker } = DatePicker;

const useStyles = createUseStyles({
  '@global': {
    '.ant-table': {
      margin: '1rem 0 !important',
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
  const [headers, setHeaders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState(null);

  const classes = useStyles();

  const query = {
    // query for all tracker events
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

      const formattedDataElements = formatDataElements(
        indicators?.indicators,
        dataElements?.dataElements,
        selectedEvents
      );

      setData(formattedDataElements?.data);

      setHeaders(formattedDataElements?.headers);
    }
  }, [eventData, dataElements, period]);

  console.log('headers', headers);
  console.log('data', data);
  const handleFetch = values => {
    if (eventData && dataElements) {
      const [start, end] = values?.period;

      const formattedStart = start.format('YYYY');
      const formattedEnd = end.format('YYYY');

      setPeriod([formattedStart, formattedEnd]);
    }
  };

  const handleDownload = () => {
    setLoading(true);
    data.download('tracker-data.xlsx');
    setLoading(false);
  };

  const columns = formatColumns(
    indicators?.indicators,
    dataElements?.dataElements
  );

  return (
    <div className={classes.root}>
      <CardItem title='EXPORT DATA'>
        <Form layout='inline' onFinish={handleFetch}>
          <Form.Item name='period'>
            <RangePicker
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
