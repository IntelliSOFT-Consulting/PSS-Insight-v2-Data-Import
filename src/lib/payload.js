import { format } from 'date-fns';

export const createPayload = (jsonData, dataElements, orgUnit, programs) => {
  const payload = [];
  for (const row of jsonData) {
    const dataValues = [];
    for (const [key, value] of Object.entries(row)) {
      if (key !== 'reportingYear') {
        const dataElement = dataElements.find(element => element.code === key);
        if (dataElement) {
          dataValues.push({
            dataElement: dataElement.id,
            value: value?.response,
          });
        }
      }
    }
    payload.push({
      occurredAt: format(
        new Date(`${row.reportingYear.response}-01-01`),
        'yyyy-MM-dd'
      ),
      status: 'COMPLETED',
      notes: [],
      completedAt: format(new Date(), 'yyyy-MM-dd'),
      program: programs[0].id,
      programStage: programs[0].programStages[0].id,
      orgUnit,
      dataValues,
    });
  }
  return payload;
};