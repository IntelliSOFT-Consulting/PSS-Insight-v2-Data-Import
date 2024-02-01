import axios from "axios";
import delay from "./delay";

// remove paths from the url

const gho = axios.create({
  baseURL: `${window.location.origin}/api/v1/redirect/`,
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
