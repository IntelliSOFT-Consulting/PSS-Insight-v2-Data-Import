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
    resource: 'tracker',
    type: 'create',
    params: _data => ({
      async: 'false',
    }),

    data: _data => {
      console.log('dataPayload: ', _data);
      return { events: Object.values(_data) };
    },
  };

  const [mutate, { loading: mutationLoading, error: mutationError }] =
    useDataMutation(mutation, {
      onComplete: ({ data }) => {
        console.log(data);
        setSuccess('Data imported successfully');
      },
    });

  const {
    loading,
    error,
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

  const handleImport = async () => {
    const indicators = await getIndicators(selected, country);

    const orgUnit = orgUnits?.organisationUnits?.find(
      ({ code }) => code === country
    )?.id;

    const formattedData = indicators.map((indicator, i) => {
      const { value } = indicator;
      console.log('value: ', value);
      return value.map(v => {
        return {
          occurredAt: `${v.TimeDim}-01-01`,
          status: 'COMPLETED',
          notes: [],
          completedAt: new Date(),
          program: programs?.programs[0]?.id,
          programStage: programs?.programs[0]?.programStages[0]?.id,
          orgUnit,
          dataValues: [
            {
              dataElement: getIndicatorId(selected[i]),
              value: v.Value,
            },
          ],
        };
      });
    });

    const payload = formattedData.flat();

    await mutate(payload);
  };

  return (
    <Card
      title='GLOBAL HEALTH OBSERVATORY'
      footer={
        <div className={classes.footer}>
          <Button
            type='primary'
            disabled={selected.length === 0 || country === null}
            onClick={handleImport}
          >
            Import
          </Button>
        </div>
      }
    >
      {loading ? (
        <Loader />
      ) : (
        <>
          {mutationLoading && <Loader />}
          {mutationError && (
            <Notification
              title='Error'
              message={mutationError?.message}
              status='error'
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
              onChange={handleChange}
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {orgUnits?.organisationUnits?.map(({ code, name }) => (
                <Option key={CodeBracketIcon} value={code}>
                  {name}
                </Option>
              ))}
            </Select>
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
            {/* <div className='border-dashed border-gray-300 rounded-lg p-4'>
              <CheckBadgeIcon className='h-6 w-6 text-gray-400' />
              <p className='text-gray-400'>
                Data will be imported into the selected country.
              </p>
            </div> */}
          </div>
        </>
      )}
    </Card>
  );
}
