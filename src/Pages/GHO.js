import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { Transfer } from '@dhis2/ui';
import { createUseStyles } from 'react-jss';
import { Button, Select } from 'antd';
import { useDataQuery, useDataMutation } from '@dhis2/app-runtime';
import localIndicators from '../data/indicators.json';
import { CheckBadgeIcon, CodeBracketIcon } from '@heroicons/react/24/solid';
import { getIndicators } from '../lib/gho';
import Loader from '../components/Loader';
import Notification from '../components/Notification';
import { set } from 'date-fns';

const { Option } = Select;

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
});

export default function GHO() {
  const [selected, setSelected] = useState([]);
  const [country, setCountry] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const classes = useStyles();

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
    setCountry(value);
  };

  const getIndicatorId = value => {
    const indicator = localIndicators.find(({ value: v }) => v === value);
    return indicator?.id;
  };

  const handleImport = async () => {
    setLoading(true);
    const indicators = await getIndicators(selected, country);

    const orgUnit = orgUnits?.organisationUnits?.find(
      ({ code }) => code === country
    )?.id;

    const formattedData = indicators.map((indicator, i) => {
      const { value } = indicator;
      return value.map(v => {
        return {
          period: v.TimeDim,
          orgUnit,
          dataElement: getIndicatorId(selected[i]),
          value: v.Value,
        };
      });
    });

    const payload = formattedData.flat();

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

  return (
    <Card
      title='GLOBAL HEALTH OBSERVATORY'
      footer={
        <div className={classes.footer}>
          <Button
            type='primary'
            disabled={selected.length === 0 || country === null}
            onClick={handleImport}
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
          {/* {mutationLoading && <Loader />} */}
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
          <div>
            <Select
              showSearch
              style={{ width: 200 }}
              placeholder='Select a country'
              optionFilterProp='children'
              value={country}
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
                orgUnits?.organisationUnits?.map(({ code, name }) => ({
                  label: name,
                  value: code,
                })) ?? []
              }
            />
          </div>

          <div className={classes.transfer}>
            <div>
              <p>
                Select the data you want to download by clicking on the
                corresponding indicators.
              </p>

              <Transfer
                selected={selected}
                onChange={onChange}
                options={localIndicators}
              />
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
