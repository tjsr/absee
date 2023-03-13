import * as dotenv from 'dotenv';

import { ComparableObjectMetadata, ComparisonRequestPutBody, ComparisonSelection, ConfigType, UserId, uuid } from './src/types';

import axios from 'axios';
import { dateToISO8601String } from 'date-to-iso-8601-string';
import express from 'express';
import session from 'express-session';
import { v5 as uuidv5 } from 'uuid';

dotenv.config();

// const ID_UUID_NAMESPACE = 'abc123';
// const USERID_UUID_NAMESPACE = 'bcd234';
// const COMPARISON_UUID_NAMESPACE = 'cde345';

const ID_UUID_NAMESPACE = process.env.ID_UUID_NAMESPACE || 'f345a1f6-ee55-4621-a46d-77e663c7a775';
const USERID_UUID_NAMESPACE = process.env.USERID_UUID_NAMESPACE || 'd850e0d9-a02c-4a25-9ade-9711b942b8ba';
const COMPARISON_UUID_NAMESPACE = process.env.COMPARISON_UUID_NAMESPACE || 'd1012c53-7978-4fd8-a10a-faf15d050242';

const SQLITE_HOST = process.env.SQLITE_HOST || 'http://localhost:8085/';

const HTTP_PORT:number = process.env.HTTP_PORT !== undefined ? parseInt(process.env.HTTP_PORT!) : 8280;

const app = express();

const getValues = (elements: number): any[] => {
  let arr: any[] = [];
  for (let i = 1;i <= elements;i++) {
    arr.push({ id: i });
  }
  return arr;
};

const getRandomId = (): number => {
  return Math.floor(Math.random() * COMPARABLE_OBJECTS.length);
};

const COMPARABLE_OBJECTS:any[] = getValues(64);

const getInitialComparisonId = (): number => {
  return 1;
};

let nextComparisonId = getInitialComparisonId();

const createComparisonSelection = (comparisonId: uuid, userId: UserId, left: ComparableObjectMetadata, right: ComparableObjectMetadata): ComparisonSelection => {
  return {
    id: uuidv5(comparisonId, COMPARISON_UUID_NAMESPACE),
    userId,
    requestTime: dateToISO8601String(new Date()),
    a: left,
    b: right,
  }
}

const createComparableObject = (targetId: string): ComparableObjectMetadata => {
  return {
    id: uuidv5(targetId, ID_UUID_NAMESPACE),
  };
};

const getUserId = (): UserId => {
  return uuidv5('1', USERID_UUID_NAMESPACE);
};

const getNextComparisonId = (): uuid => {
  return uuidv5((nextComparisonId++).toString(), USERID_UUID_NAMESPACE);
};

const storeComparisonRequest = async (comparisonRequest: ComparisonSelection): Promise<void> => {
  const postRequest: ComparisonRequestPutBody = {
    id: comparisonRequest.id,
    userId: comparisonRequest.userId,
    requestTime: comparisonRequest.requestTime,
    a: comparisonRequest.a.id,
    b: comparisonRequest.b.id,
  }
  return new Promise((resolve, reject) => {
    axios.post(`${SQLITE_HOST}/comparison`, postRequest, { headers: {
      'Content-Type': 'application/json'
    }}).then(response => {
      resolve();
    }).catch ((error) => {
      reject(error);
    });
  });
};

app.get("/", (request: Express.Request, response) => {
  const userId: UserId = getUserId();
  const comparisonId: uuid = getNextComparisonId();
  const left: ComparableObjectMetadata = createComparableObject(getRandomId().toString());
  const right: ComparableObjectMetadata = createComparableObject(getRandomId().toString());
  const comparisonRequest: ComparisonSelection = createComparisonSelection(comparisonId, userId, left, right);
  storeComparisonRequest(comparisonRequest).then(() => {
    response.contentType('application/json');
    response.send(comparisonRequest);
  }).catch((err: Error) => {
    console.error(comparisonRequest);
    response.status(500);
    console.error(err);
    response.send(err.message);
  });
  // Return two random options from the configured collection.

});

app.use( session( {
  resave: true,
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET || ''
}))

app.listen(HTTP_PORT, () => {
  console.log(`Listening on port ${HTTP_PORT}`);
});