import React from 'react';
import Card from '../components/Card';
import instructions from '../data/instructions.json';
import { createUseStyles } from 'react-jss';
import generateTemplate from '../lib/genarateTemplate';

const useStyles = createUseStyles({
  title: {
    fontSize: '16px',
  },
  button: {
    backgroundColor: '#002F6C',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer',
    margin: '1rem 0px',
    '&:hover': {
      backgroundColor: '#005DA5',
      color: 'white',
    },
  },
  instructions: {
    margin: '2rem 0px',
    fontSize: '15px',
    '& > div': {
      margin: '2rem 0px',
      '& h4': {
        margin: '10px 0px',
      },
      '& p': {
        margin: '0px',
        fontWeight: '300',
      },
    },
  },
});

export default function Template({ data }) {
  const classes = useStyles();

  return (
    <Card title='DOWNLOAD DATA IMPORT TEMPLATE'>
      <div className={classes.title}>Instructions:</div>
      <div className={classes.instructions}>
        {instructions.map((instruction, index) => (
          <div key={index}>
            <h4>{instruction.title}:</h4>
            <p>{instruction.description}</p>
          </div>
        ))}
      </div>
      {data?.indicators && (
        <div>
          <p>National Master Template Version</p>
          <button
            className={classes.button}
            onClick={() => {
              const template = generateTemplate(
                data.indicators.indicators,
                data.dataElements.dataElements
              );
              const element = document.createElement('a');

              element.href = template;

              element.download;
              document.body.appendChild(element);
              element.click();

              setTimeout(() => {
                document.body.removeChild(element);
              }, 1000);
            }}
          >
            Download Template
          </button>
        </div>
      )}
    </Card>
  );
}
