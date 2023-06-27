import React from 'react';
import { Card } from '../components/Card';
import { useDataQuery, useDataMutation } from '@dhis2/app-runtime';
import { Form } from 'antd';

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

  return (
    <Card title='GHO' footer='footer'>
      <Form layout='vertical'>
        <Form.Item label='Country'>
          <Select
            showSearch
            placeholder='Select a country'
            optionFilterProp='children'
            onChange={onChange}
            value={country}
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
      </Form>
    </Card>
  );
}
