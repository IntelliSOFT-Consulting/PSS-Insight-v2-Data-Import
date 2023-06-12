import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { Upload, Button } from 'antd';
import { createUseStyles } from 'react-jss';
import Sheet from 'sheet-happens';
import { read, utils } from 'xlsx';
import Notification from '../components/Notification';
import { dataToJson, getErrors } from '../lib/validate';

const useStyles = createUseStyles({
  button: {
    backgroundColor: '#002F6C',
    color: 'white',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#005DA5',
      color: 'white !',
      '& > span': {
        color: 'white !important',
      },
    },
  },
  uploadSection: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '1rem',
    '& .ant-upload-list': {
      width: 'fit-content !important',
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
    '& > button': {
      marginLeft: '10px',
    },
  },
});

export default function UploadTemplate({ data: { dataElements } }) {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [errors, setErrors] = useState([['Row No.', 'Column', 'Error']]);
  const [alert, setAlert] = useState(null);
  const [valid, setValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const classes = useStyles();
  const uploadFile = ({ file, onSuccess, onError, onProgress }) => {
    setErrors([['Row No.', 'Column', 'Error']]);
    setFile(file);
    onSuccess('ok');
  };

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.readAsBinaryString(file);
      reader.onload = e => {
        const bstr = e.target.result;
        const wb = read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const datas = utils.sheet_to_json(ws, { header: 1 });
        if (
          datas[1][1] !== 'Reporting Year' ||
          datas[1][0] !== 'Organisation Unit'
        ) {
          setAlert({
            status: 'error',
            message: 'Invalid template file',
            description: 'Please upload a valid template file',
            onClose: () => setAlert(null),
          });
          return;
        }
        setData(datas);
      };
    }
  }, [file]);

  const props = {
    name: 'file',
    customRequest: uploadFile,
    accept: '.xlsx, .xls, .csv',
    maxCount: 1,
    onRemove: () => {
      setData(null);
      setErrors([['Row No.', 'Column', 'Error']]);
      setFile(null);
    },
  };

  const displayData = (x, y) => {
    return data?.[y]?.[x];
  };

  const displayErrors = (x, y) => {
    return errors?.[y]?.[x];
  };

  const handleValidate = () => {
    const jsonData = dataToJson(data, dataElements?.dataElements);
    const validationErrors = getErrors(jsonData, dataElements?.dataElements);

    if (validationErrors.length > 0) {
      setErrors([...errors, ...validationErrors]);
      setAlert({
        status: 'error',
        message:
          'Errors have been found in the template. Please fix the errors and try again.',
        onClose: () => setAlert(null),
      });
    } else {
      setAlert({
        status: 'success',
        message: 'No errors found in the template.',
        onClose: () => setAlert(null),
      });

      setValid(true);

      setTimeout(() => {
        setAlert(null);
      }, 2000);
    }
    setLoading(false);
  };

  const deepFlatten = arr =>
    [].concat(...arr.map(v => (Array.isArray(v) ? deepFlatten(v) : v)));

  const lengthToPixels = length => {
    const pixelsPerCharacter = 6;
    const pixelsPerCellPadding = 10;
    return length * pixelsPerCharacter + pixelsPerCellPadding;
  };

  const getlongest = arr => {
    const col2 = deepFlatten(arr.map(row => row[1]));
    const col3 = deepFlatten(arr.map(row => row[2]));

    const longest2 = col2.reduce((a, b) =>
      a?.length > b?.length ? a : b
    )?.length;
    const longest3 = col3.reduce((a, b) =>
      a?.length > b?.length ? a : b
    )?.length;

    return [100, lengthToPixels(longest2), lengthToPixels(longest3)];
  };

  const footer = (
    <div className={classes.footer}>
      <Button
        type='primary'
        className={classes.button}
        onClick={() => {
          setLoading(true);
          handleValidate();
        }}
        disabled={!data || loading || data?.length < 3 || errors.length > 1}
      >
        Validate
      </Button>
      <Button type='primary' disabled={!valid} className={classes.button}>
        Submit
      </Button>
    </div>
  );
  return (
    <Card title='UPLOAD DATA IMPORT TEMPLATE' footer={footer}>
      {alert && <Notification {...alert} />}

      <div className={classes.uploadSection}>
        <p>Upload data import file</p>
        <Upload {...props}>
          <Button className={classes.button}>Select file</Button>
        </Upload>
      </div>
      <>
        {data && errors.length === 1 && (
          <Sheet
            id='Data'
            sourceData={data}
            readOnly={true}
            displayData={displayData}
            sheetStyle={{
              freezeColumns: 1,
              freezeRows: 2,
            }}
            cellStyle={(x, y) => {
              if (x === 0 && y > 1) {
                return {
                  backgroundColor: 'rgba(2, 102, 185,0.1)',
                };
              }
              if (y == 0) {
                return {
                  backgroundColor: '#012f6c',
                  color: 'white',
                };
              }
              if (y == 1) {
                return {
                  backgroundColor: '#0266B9',
                  color: 'white',
                };
              }

              return {};
            }}
          />
        )}
        {errors.length > 1 && (
          <Sheet
            id='Errors'
            sourceData={errors}
            readOnly={true}
            displayData={displayErrors}
            cellWidth={getlongest(errors)}
            cellStyle={(x, y) => {
              if (y == 0) {
                return {
                  backgroundColor: '#BB0C2F',
                  color: 'white',
                };
              }

              const longest =
                errors &&
                errors.length > 0 &&
                errors
                  .map(row => row[x])
                  .reduce((a, b) => (a?.length > b?.length ? a : b));

              const width = longest?.length * 8 + 20;

              return {
                color: '#BB0C2F',
                whiteSpace: 'pre-wrap',
                wrapText: true,
                width,
              };
            }}
          />
        )}
      </>
    </Card>
  );
}
