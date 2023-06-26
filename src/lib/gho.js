import axios from 'axios';
import delay from './delay';

const gho = axios.create({
  baseURL: 'http://localhost:3030',
  headers: { 'Content-Type': 'application/json' },
});
// https://1e4c-105-161-211-230.ngrok-free.app/api/v1/redirect/
export const getIndicators = async (indicators, countryCode) => {
  const indicatorCodes = await Promise.all(
    indicators.map(async (indicator, i) => {
      await delay(i, 1000);
      const value = await gho.get(
        `${indicator}?$filter=SpatialDim eq '${countryCode}'&$select=Value,TimeDimType,TimeDim,SpatialDimType,SpatialDim`
      );
      return { ...value?.data, indicator };
    })
  );
  return indicatorCodes;
};

export const formatData = (data, country, indicators) => {
  const dataElements = data.map((d, i) => {
    const { indicator, value } = d;
    return value.map(v => {
      return {
        dataElement: indicators.find(i => i.value === indicator).code,
        value: v.value,
        period: v.TimeDim,
        orgUnit: country,
      };
    });
  });
  return dataElements;
};
