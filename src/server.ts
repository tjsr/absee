import * as dotenv from 'dotenv';

import { ComparableObjectModel, ComparisonModel } from './types/model';
import { ComparisonSelectionResponse, IPAddress, SnowflakeType, UserId } from "./types";

import { CollectionTypeLoader } from './datainfo';
import { Pin } from './pins/pinpanion';
import cors from 'cors';
import { createComparableObjectList } from "./comparableobjects";
import { createComparisonSelection } from "./datastore";
import { createComparisonSelectionResponse } from './restresponse';
import express from 'express';
import { getRandomId } from "..";
import { getSnowflake } from "./snowflake";
import { getUserId } from "./utils";
import requestIp from 'request-ip';
import session from 'express-session';
import { storeComparisonRequest } from "./comparison";

dotenv.config();

const HTTP_PORT:number = process.env.HTTP_PORT !== undefined ? parseInt(process.env.HTTP_PORT!) : 8280;

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};

export const getIp = (req: Express.Request): IPAddress => {
  let ip = undefined;
  ip = (req as any).ipInfo !== undefined ? (req as any).ipInfo : ip;
  ip = (req as any).clientIp !== undefined ? (req as any).clientIp : ip;
  console.log(`ipInfo=> ${JSON.stringify((req as any).ipInfo!)}`);
  console.log(`clientIp=> ${JSON.stringify((req as any).clientIp!)}`);
  return ip;
};

export const startApp = <T>(loader: CollectionTypeLoader<T>) => {
  const app = express();
  app.use(cors(corsOptions));
  app.use(requestIp.mw())
  app.set('trust proxy', true);

  app.get("/", (request: Express.Request, response) => {
    const userId: UserId = getUserId();
    const ipAddress = getIp(request);
    const comparisonId: SnowflakeType = getSnowflake();
    const left: ComparableObjectModel<T>[] = createComparableObjectList<T>([getRandomId().toString()], comparisonId);
    const right: ComparableObjectModel<T>[] = createComparableObjectList<T>([getRandomId().toString()], comparisonId);
    const comparisonRequest: ComparisonModel<T> = createComparisonSelection<T>(comparisonId, userId, ipAddress, left, right);
    storeComparisonRequest(comparisonRequest).then(() => {
      response.contentType('application/json');
      const responseJson: ComparisonSelectionResponse<T> = createComparisonSelectionResponse<T>(comparisonRequest, loader);
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
  return app;
}
