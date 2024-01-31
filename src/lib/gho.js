import axios from "axios";
import delay from "./delay";

// remove paths from the url
let url = new URL(process.env.REACT_APP_SERVER_URL);
let newUrl = url.protocol && url.host ? `${url.protocol}//${url.host}` : window.location.origin;

const gho = axios.create({
  baseURL: `${newUrl}/api/v1/redirect/`,
  headers: { "Content-Type": "application/json" },
});
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
