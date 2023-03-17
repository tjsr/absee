import * as dotenv from 'dotenv';

import { ComparableObjectModel, ComparisonModel } from './types/model';
import { ComparisonSelectionResponse, IPAddress, SnowflakeType, UserId } from "./types";
import { storeComparisonRequest, verifyComparisonOwner } from "./comparison";

import { CollectionTypeLoader } from './datainfo';
import SuperJSON from 'superjson';
import cors from 'cors';
import { createComparableObjectList } from "./comparableobjects";
import { createComparisonSelection } from "./datastore";
import { createComparisonSelectionResponse } from './restresponse';
import express from 'express';
import { getRandomId } from "..";
import { getSnowflake } from "./snowflake";
import { getUserId } from "./utils";
import requestIp from 'request-ip';
import { saveComparisonSelection } from './comparisonresponse';
import session from 'express-session';

dotenv.config();

const HTTP_PORT:number = process.env.HTTP_PORT !== undefined ? parseInt(process.env.HTTP_PORT!) : 8280;

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};

export const getIp = (req: Express.Request): IPAddress => {
  return (req as any).clientIp;
};

export const startApp = <T>(loader: CollectionTypeLoader<T>) => {
  const app = express();
  app.use(cors(corsOptions));
  app.use(requestIp.mw())
  app.set('trust proxy', true);

  app.use( session( {
    resave: true,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || ''
  }));

  app.use(express.urlencoded({
    extended: true
  }));
  app.use(express.json());

  const createCandidateElementList = (maxId: number, maxLeft?: number, maxRight?: number): [string[], string[]] => {
    const arra: string[] = [];

    let sizea = Math.floor(Math.random() * (maxLeft == undefined ? 4 : maxLeft))+1;
    while (sizea > 0) {
      let newRandom: string = getRandomId(loader.existingData?.length!).toString();
      if (!arra.includes(newRandom)) {
        arra.push(newRandom);
        sizea--;
      }
    }

    const arrb: string[] = [];
    let sizeb = Math.floor(Math.random() * (maxRight == undefined ? 4 : maxRight))+1;
    while (sizeb > 0) {
      let newRandom: string = getRandomId(loader.existingData?.length!).toString();
      if (!arra.includes(newRandom) && !arrb.includes(newRandom)) {
        arrb.push(newRandom);
        sizeb--;
      }
    }
    return [arra, arrb];
  }

  app.get("/", (request: Express.Request, response) => {
    try {
      const userId: UserId = getUserId();
      const ipAddress = getIp(request);
      const comparisonId: SnowflakeType = getSnowflake();

      const candidateElemenets: [string[], string[]] = createCandidateElementList(loader.existingData?.length!);

      const left: ComparableObjectModel<T>[] = createComparableObjectList<T>(candidateElemenets[0], comparisonId);
      const right: ComparableObjectModel<T>[] = createComparableObjectList<T>(candidateElemenets[1], comparisonId);
      const comparisonRequest: ComparisonModel<T> = createComparisonSelection<T>(comparisonId, userId, ipAddress, left, right);
      storeComparisonRequest(comparisonRequest).then(() => {
        response.contentType('application/json');
        const responseJson: ComparisonSelectionResponse<T> = createComparisonSelectionResponse<T>(comparisonRequest, loader);
        response.send(SuperJSON.stringify(responseJson));
      }).catch((err: Error) => {
        console.error('Failed while storing comparisonRequest in DB');
        console.error(SuperJSON.stringify(comparisonRequest));
        response.status(500);
        console.error(err);
        response.send(err.message);
      });
      // Return two random options from the configured collection.
    } catch (err) {
      console.warn(`Failure in GET /`, err);
    }
  });

  app.post("/submit", (request, response) => {
    try {
      // const comparisonId = request.params.comparisonId;
      response.status(200);
      
      const userId: UserId = getUserId();
      const ipAddress = getIp(request);
      const comparisonId = request.body.comparisonId;

      const responseJson = {
        success: true
      }

      try {
        verifyComparisonOwner(comparisonId, userId, ipAddress).then(() => {
          const elementId = request.body.selectedElementId;
          saveComparisonSelection(comparisonId, elementId);
          console.debug(`Saved respnse: ${elementId} for ${comparisonId} by ${userId}.`);
          // Now write the user selected element to the DB.
        }).catch((err) => {
          responseJson.success = false;
          response.status(401);
        })
      } catch (err) {
        responseJson.success = false;
        response.status(500);
      }

      response.send(responseJson);
      // getComparisonData(comparisonId);
      // verify that this comparison has the correct owner

      // verify that it comes from the same IP
    } catch (err) {
      console.error(`Failure in POST /submit`, err);
    }
  });

  app.use(express.static("public"));

  app.listen(HTTP_PORT, () => {
    console.log(`Listening on port ${HTTP_PORT}`);
  });

  // app.use(bodyParser.urlencoded({ extended: true }));
  // app.use(bodyParser.json());
  return app;
}
