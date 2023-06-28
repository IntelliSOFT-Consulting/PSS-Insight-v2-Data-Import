import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { Transfer, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import { createUseStyles } from 'react-jss';
import { Button, Select, Form } from 'antd';
import { useDataQuery, useDataMutation } from '@dhis2/app-runtime';
import localIndicators from '../data/indicators.json';
import { CheckBadgeIcon, CodeBracketIcon } from '@heroicons/react/24/solid';
import { getIndicators } from '../lib/gho';
import Loader from '../components/Loader';
import Notification from '../components/Notification';

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
  const [selected, setSelected] = useState([]);
  const [countries, setCountries] = useState([]);
  const [country, setCountry] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const classes = useStyles();
  const [form] = Form.useForm();

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
        setCountry(null);
      },
    });

  const {
    loading: queryLoading,
    erro: queryError,
    data: { orgUnits, programs } = {},
  } = useDataQuery(query);

  const onChange = ({ selected }) => {
    setSelected(selected);
  };

  const handleChange = value => {
    console.log(value);
    setCountry(value);
  };

  const getIndicatorId = value => {
    const indicator = localIndicators.find(({ value: v }) => v === value);
    return indicator?.id;
  };

  const handleImport = async values => {
    console.log('formValues', values);
    const indicators = await getIndicators(
      values.indicators?.selected,
      values.country
    );

    const orgUnit = orgUnits?.organisationUnits?.find(
      ({ code }) => code === values.country || 'UGA'
    )?.id;

    const formattedData = indicators.map((indicator, i) => {
      const { value } = indicator;
      return value.map(v => {
        return {
          period: v.TimeDim,
          orgUnit,
          dataElement: getIndicatorId(values.indicators?.selected[i]),
          value: v.Value,
        };
      });
    });

    const payload = formattedData.flat();
    console.log('payload', payload);
    await mutate(payload);
    setLoading(false);
  };

  useEffect(() => {
    if (mutationError || queryError) {
      setError(mutationError?.message || queryError?.messages);

      const timeout = setTimeout(() => {
        setError(null);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [mutationError, queryError]);

  useEffect(() => {
    if (orgUnits?.organisationUnits) {
      setCountries(orgUnits?.organisationUnits);
    }
  }, [orgUnits]);

  return (
    <Card
      title='GLOBAL HEALTH OBSERVATORY'
      footer={
        <div className={classes.footer}>
          <Button
            type='primary'
            // disabled={selected.length === 0 || country === null}
            onClick={() => {
              form.submit();
            }}
            loading={mutationLoading || loading}
          >
            Import
          </Button>
        </div>
      }
    >
      {queryLoading ? (
        <Loader />
      ) : (
        <>
          {error && (
            <Notification
              title='Error'
              message={error}
              status='error'
              onClose={() => setError(null)}
            />
          )}
          {success && (
            <Notification
              title='Success'
              message={success}
              status='success'
              onClose={() => setSuccess(null)}
            />
          )}
          <Form form={form} layout='vertical' onFinish={handleImport}>
            <Form.Item
              label='Country'
              name='country'
              rules={[
                {
                  required: true,
                  message: 'Please select a country',
                },
              ]}
            >
              
              <Select
                showSearch
                style={{ width: 200 }}
                placeholder='Select a country'
                optionFilterProp='children'
                // value={country}
                onChange={handleChange}
                filterOption={(input, option) =>
                  (option?.label ?? '').includes(input)
                }
                filterSort={(optionA, optionB) =>
                  (optionA?.label ?? '')
                    .toLowerCase()
                    .localeCompare((optionB?.label ?? '').toLowerCase())
                }
                options={
                  countries?.map(({ code, name }) => ({
                    label: name,
                    value: code,
                  })) ?? []
                }
              />
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
                    onChange={onChange}
                    options={localIndicators}
                  />
                </Form.Item>
              </div>
            </div>
          </Form>
        </>
      )}
    </Card>
  );
}