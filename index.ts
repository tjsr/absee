import * as dotenv from 'dotenv';

import { ComparableObjectMetadata, ComparableObjectPutBody, ComparableObjectResponse, ComparisonRequestPutBody, ComparisonSelection, ComparisonSelectionResponse, IPAddress, ISO8601Date, PinInfo, SnowflakeType, UserId, uuid } from './src/types';

import cors from 'cors';
import express from 'express';
import { getSnowflake } from './src/snowflake';
import requestIp from 'request-ip';
import session from 'express-session';
import { storeComparisonRequest } from './src/comparison';
import { v5 as uuidv5 } from 'uuid';

dotenv.config();

const ID_UUID_NAMESPACE = process.env.ID_UUID_NAMESPACE || 'f345a1f6-ee55-4621-a46d-77e663c7a775';
const USERID_UUID_NAMESPACE = process.env.USERID_UUID_NAMESPACE || 'd850e0d9-a02c-4a25-9ade-9711b942b8ba';
const COMPARISON_UUID_NAMESPACE = process.env.COMPARISON_UUID_NAMESPACE || 'd1012c53-7978-4fd8-a10a-faf15d050242';

const HTTP_PORT:number = process.env.HTTP_PORT !== undefined ? parseInt(process.env.HTTP_PORT!) : 8280;

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};

const app = express();
app.use(cors(corsOptions));
app.use(requestIp.mw())
app.set('trust proxy', true);

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

const iso8601Now = (): ISO8601Date => {
  return (new Date()).toISOString();
};

const createComparisonSelection = <T>(comparisonId: SnowflakeType, userId: UserId, ipAddress: IPAddress, left: ComparableObjectMetadata<T>[], right: ComparableObjectMetadata<T>[]): ComparisonSelection<T> => {
  return {
    id: comparisonId,
    userId,
    requestTime: iso8601Now(),
    requestIp: ipAddress,
    a: left,
    b: right,
  }
};

const getElementData = <T>(objectId: string): T => {
  return {
    id: objectId,
  } as T;
};

const createComparableObject = <T>(objectId: string, elementId: SnowflakeType): ComparableObjectMetadata<T> => {
  return {
    id: getSnowflake(),
    elementId: elementId,
    objectId: objectId,
    data: getElementData(objectId),
  };
};

const createComparableObjectList = <T>(objectIdList: string[], comparisonId: SnowflakeType): ComparableObjectMetadata<T>[] => {
  const elementId = getSnowflake();
  return objectIdList.map((objectId) => createComparableObject(objectId, elementId))
};

const getUserId = (): UserId => {
  return uuidv5('1', USERID_UUID_NAMESPACE);
};

const getIp = (req: Express.Request): IPAddress => {
  let ip = undefined;
  ip = (req as any).ipInfo !== undefined ? (req as any).ipInfo : ip;
  ip = (req as any).clientIp !== undefined ? (req as any).clientIp : ip;
  console.log(`ipInfo=> ${JSON.stringify((req as any).ipInfo!)}`);
  console.log(`clientIp=> ${JSON.stringify((req as any).clientIp!)}`);
  return ip;
};

const createComparableObjectResponse = <T>(comparableObject: ComparableObjectMetadata<T>[]): ComparableObjectResponse<T> => {
  if (comparableObject === undefined || comparableObject.length == 0) {
    throw Error("Can't pass an empty array of comparable left/right elements to convert to a JSON Response object");
  }
  return {
    elementId: comparableObject[0].elementId,
    objects: comparableObject.map((co) => co.objectId),
    data: comparableObject.map((co) => co.data)
  };
};

const createComparisonSelectionResponse = <T>(comparisonRequest: ComparisonSelection<T>): ComparisonSelectionResponse<T> => {
  return {
    id: comparisonRequest.id,
    userId: comparisonRequest.userId,
    a: createComparableObjectResponse(comparisonRequest.a),
    b: createComparableObjectResponse(comparisonRequest.b),
  }
}

app.get("/", (request: Express.Request, response) => {
  const userId: UserId = getUserId();
  const ipAddress = getIp(request);
  const comparisonId: SnowflakeType = getSnowflake();
  const left: ComparableObjectMetadata<PinInfo>[] = createComparableObjectList<PinInfo>([getRandomId().toString()], comparisonId);
  const right: ComparableObjectMetadata<PinInfo>[] = createComparableObjectList<PinInfo>([getRandomId().toString()], comparisonId);
  const comparisonRequest: ComparisonSelection<PinInfo> = createComparisonSelection<PinInfo>(comparisonId, userId, ipAddress, left, right);
  storeComparisonRequest(comparisonRequest).then(() => {
    response.contentType('application/json');
    const responseJson: ComparisonSelectionResponse<PinInfo> = createComparisonSelectionResponse(comparisonRequest);
    response.send(responseJson);
  }).catch((err: Error) => {
    console.error('Failed while storing comparisonRequest in DB');
    console.error(comparisonRequest);
    response.status(500);
    console.error(err);
    response.send(err.message);
  });
  // Return two random options from the configured collection.
});

app.post("/:comparisonId/:elementId", (request: Express.Request, response) => {
  // const comparisonId = request.params.comparisonId;
  // getComparisonData(comparisonId);
  // verify that this comparison has the correct owner

  // verify that it comes from the same IP


});

app.use( session( {
  resave: true,
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET || ''
}));

app.use(express.static("public"));

app.listen(HTTP_PORT, () => {
  console.log(`Listening on port ${HTTP_PORT}`);
});