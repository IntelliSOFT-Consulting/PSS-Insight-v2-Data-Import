import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { Upload, Button } from 'antd';
import { createUseStyles } from 'react-jss';
import Sheet from 'sheet-happens';
import { read, utils } from 'xlsx';

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

export default function UploadTemplate() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [errors, setErrors] = useState(null);
  const [valid, setValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const classes = useStyles();
  const uploadFile = ({ file, onSuccess, onError, onProgress }) => {
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
        setData(datas);
      };
    }
  }, [file]);

  const props = {
    name: 'file',
    customRequest: uploadFile,
    accept: '.xlsx, .xls, .csv',
    maxCount: 1,
  };

  const displayData = (x, y) => {
    return data?.[y]?.[x];
  };
  const footer = (
    <div className={classes.footer}>
      <Button
        type='primary'
        className={classes.button}
        onClick={() => {
          setLoading(true);
          setTimeout(() => {
            setLoading(false);
            setValid(true);
          }, 2000);
        }}
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
      <div className={classes.uploadSection}>
        <p>Upload data import file</p>
        <Upload {...props}>
          <Button className={classes.button}>Select file</Button>
        </Upload>
      </div>
      {data && (
        <Sheet sourceData={data} readOnly={true} displayData={displayData} />
      )}
    </Card>
  );
}
