import * as dotenv from 'dotenv';

import { ABSeeRequest, getSession, useSessionId } from './session';
import { ComparableObjectModel, ComparisonModel, UserModel } from './types/model';
import { ComparisonSelectionResponse, IPAddress, SnowflakeType, UserId } from "./types";
import { storeComparisonRequest, verifyComparisonOwner } from "./comparison";

import { AuthenticationRestResult } from './types/apicalls';
import { CollectionTypeLoader } from './datainfo';
import SuperJSON from 'superjson';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createComparableObjectList } from "./comparableobjects";
import { createComparisonSelection } from "./datastore";
import { createComparisonSelectionResponse } from './restresponse';
import express from 'express';
import { getDbUserByEmail } from './database/mysql';
import { getRandomId } from "..";
import { getSnowflake } from "./snowflake";
import { getUserId } from "./utils";
import { initialisePassportToExpressApp } from './auth/passport';
import passport from 'passport';
import requestIp from 'request-ip';
import { saveComparisonSelection } from './comparisonresponse';

dotenv.config();

const HTTP_PORT:number = process.env.HTTP_PORT !== undefined ? parseInt(process.env.HTTP_PORT!) : 8280;

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
  'Access-Control-Expose-Headers': '*',
  // 'Access-Control-Allow-Origin': 'http://localhost:3000',
};

export const getIp = (req: Express.Request): IPAddress => {
  return (req as any).clientIp;
};



export const startApp = <T>(loader: CollectionTypeLoader<T>) => {
  const app = express();
  app.use(cors(corsOptions));
  app.use(requestIp.mw())
  app.set('trust proxy', true);

  app.use(function(req, res, next) {
    res.header('Access-Control-Expose-Headers', '*');
    next();
  });

  app.use(cookieParser());
  app.use(getSession());
  app.use(useSessionId);
  
  // initialisePassportToExpressApp(app);

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

  app.post('/login', async(req: ABSeeRequest, res: express.Response, next) => {
    try {
      const email: string = req.body.email;
      const user: UserModel = await getDbUserByEmail(email);

      if (!user) {
        const result: AuthenticationRestResult = {
          email: undefined,
          isLoggedIn: false,
          message: 'Invalid email',
        };
        req.session.userId = undefined;
        req.session.email = undefined;
        req.session.save((err) => {
          if (err) {
            console.error(`Failed saving session`, err);
          }
        });
  
        res.statusCode = 403;
        return res.send({ message: 'Invalid email' });
      }

      const result: AuthenticationRestResult = {
        email: email,
        isLoggedIn: true,
        sessionId: req.session.id,
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('x-session-id', req.session.id);
      res.cookie('sessionId', req.session.id);

      req.session.userId = user.userId;
      req.session.email = email;
      console.log(`User ${email} logged in and has userId ${user.userId}`);
      req.session.save((err) => {
        if (err) {
          console.error(`Failed saving session`, err);
        }
      });

      res.status(200);
      res.send(result);
    } catch (e) {
      res.status(500);
      console.log(e);
      return res.send();
    }
  });

  app.get("/logout", async(request: ABSeeRequest, res: express.Response, next) => {
    const userId: UserId = getUserId(request);
    console.log(`Got logout userId ${userId}`);
    const result: AuthenticationRestResult = {
      email: undefined,
      isLoggedIn: false,
    };
    try {
      request.session.userId = undefined;
      request.session.email = undefined;
      request.session.save((err) => {
        if (err) {
          console.error(`Failed saving session`, err);
        }
      });

      res.status(200);
      return res.send(result);
    } catch (e) {
      res.status(500);
      console.log(e);
      return res.send(result);
    }
  });

  app.get("/", (request: express.Request, response: express.Response) => {
    try {
      const userId: UserId = getUserId(request);
      const ipAddress = getIp(request);
      const comparisonId: SnowflakeType = getSnowflake();
      console.log(`Got request from userId ${userId}`);

      const candidateElemenets: [string[], string[]] = createCandidateElementList(loader.existingData?.length!,1, 1);

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

  app.post("/submit", (request: ABSeeRequest, response: express.Response) => {
    try {
      // const comparisonId = request.params.comparisonId;
      
      const userId: UserId = getUserId(request);
      const ipAddress = getIp(request);
      const comparisonId = request.body.comparisonId;

      const responseJson = {
        success: true
      }

      try {
        verifyComparisonOwner(comparisonId, userId, ipAddress).then(() => {
          const elementId = request.body.selectedElementId;
          saveComparisonSelection(comparisonId, elementId);
          console.debug(`Saved response: ${elementId} for ${comparisonId} by ${userId}.`);
          // Now write the user selected element to the DB.
          response.status(200);
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

  app.get('/session', (request: ABSeeRequest, response: express.Response) => {
    request.session.save();
    response.status(200);
    response.send({
      sessionId: request.session.id
    });
    response.end();
  });

  app.use((req, res, next) => {
    res.set("Set-Cookie", `sessionId=${req.session.id}`);
    next();
  });

  app.use(express.static("public"));
  
  app.listen(HTTP_PORT, () => {
    console.log(`Listening on port ${HTTP_PORT}`);
  });

  return app;
}
