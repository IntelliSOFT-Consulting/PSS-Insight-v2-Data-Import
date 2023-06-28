import React, { useState } from 'react';
import Card from '../components/Card';
import { useDataQuery, useDataMutation } from '@dhis2/app-runtime';
import { Form, Select, Button } from 'antd';
import { createUseStyles } from 'react-jss';
import { Transfer } from '@dhis2/ui';
import localIndicators from '../data/indicators.json';
import { getIndicators } from '../lib/gho';

const useStyles = createUseStyles({
  transfer: {
    '& button.icon-only': {
      background: '#012f6c !important',
      color: '#fff !important',
      '& span, svg': {
        color: '#fff !important',
        fill: '#fff !important',
      },
    },
    '& div.highlighted': {
      background: '#bb0c2f !important',
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
  },
  select: {
    marginBottom: 10,
    width: '30rem',
  },
});

export default function GHO() {
  const query = {
    orgUnits: {
      resource: 'organisationUnits',
      params: ({ page }) => ({
        fields: 'id,name,code, level',
        order: 'name:asc',
        filter: 'level:eq:3',
        pageSize: 1000,
      }),
    },
    programs: {
      resource: 'programs',
      params: ({ page }) => ({
        fields: 'id,name,code,programStages[id]',
        order: 'name:asc',
        pageSize: 10,
      }),
    },
  };

  const mutation = {
    resource: 'dataValueSets',
    type: 'create',
    data: _data => {
      return { dataValues: Object.values(_data) };
    },
  };

  const [mutate, { loading: mutationLoading, error: mutationError }] =
    useDataMutation(mutation, {
      onComplete: ({ data }) => {
        setSuccess('Data imported successfully');
        setSelected([]);
        // setCountry(null);
      },
    });

  const {
    loading: queryLoading,
    erro: queryError,
    data: { orgUnits, programs } = {},
  } = useDataQuery(query);

  const [form] = Form.useForm();

  const classes = useStyles();

  const [selected, setSelected] = useState([]);

  const onFinish = values => {
    const { indicators, country } = values;
    console.log('values', values);
  };

  return (
    <Card
      title='GHO'
      footer={
        <div className={classes.footer}>
          <Button
            type='primary'
            // disabled={selected.length === 0 || country === null}
            onClick={() => {
              form.submit();
            }}
            // loading={mutationLoading || loading}
          >
            Import
          </Button>
        </div>
      }
    >
      <Form layout='vertical' form={form} onFinish={onFinish}>
        <Form.Item label='Country' name='country'>
          <Select
            showSearch
            placeholder='Select a country'
            optionFilterProp='children'
            // onChange={(value, option) => {
            //   console.log(value, option);
            // }}
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {orgUnits?.organisationUnits?.map(({ code, name }) => (
              <Option key={code} value={code}>
                {name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <div className={classes.transfer}>
          <div>
            <p>
              Select the data you want to download by clicking on the
              corresponding indicators.
            </p>
            <Form.Item
              label='Indicators'
              name='indicators'
              rules={[
                {
                  required: true,
                  message: 'Please select at least one indicator',
                },
              ]}
            >
              <Transfer
                selected={selected}
                onChange={({selected}) => {
                  setSelected(selected);
                }}
                options={localIndicators}
              />
            </Form.Item>
          </div>
        </div>
      </Form>
    </Card>
  );
}
