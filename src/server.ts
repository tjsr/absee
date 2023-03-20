import * as dotenv from 'dotenv';

import { ABSeeRequest, getSession, useSessionId } from './session';

import { CollectionTypeLoader } from './datainfo';
import { IPAddress } from './types';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { login } from './api/login';
import { logout } from './api/logout';
import requestIp from 'request-ip';
import { serveComparison } from './api/serveComparison';
import { session } from './api/session';
import { submit } from './api/submit';

dotenv.config();

const HTTP_PORT: number =
  process.env.HTTP_PORT !== undefined ? parseInt(process.env.HTTP_PORT!) : 8280;

const corsOptions = {
  'Access-Control-Expose-Headers': '*',
  'optionsSuccessStatus': 200,
  'origin': '*',
  // 'Access-Control-Allow-Origin': 'http://localhost:3000',
};

export const getIp = (req: Express.Request): IPAddress => {
  return (req as any).clientIp;
};

export const startApp = <T, D>(loader: CollectionTypeLoader<T, D>) => {
  const app = express();
  app.use(cors(corsOptions));
  app.use(requestIp.mw());
  app.set('trust proxy', true);

  app.use(function (req, res, next) {
    res.header('Access-Control-Expose-Headers', '*');
    next();
  });

  app.use(cookieParser());
  app.use(getSession());
  app.use(useSessionId);

  // initialisePassportToExpressApp(app);

  app.use(
    express.urlencoded({
      extended: true,
    })
  );
  app.use(express.json());

  app.get('/session', session);
  app.post('/login', login);
  app.get('/logout', logout);
  app.get(
    '/collection/:collectionId',
    (request: ABSeeRequest, response: express.Response) => {
      const collectionId = request.params.collectionId;
      if (collectionId == '83fd0b3e-dd08-4707-8135-e5f138a43f00') {
        serveComparison(loader, request, response);
      } else {
        response.status(401);
        response.end();
      }
    }
  );
  app.post('/submit', submit);

  app.use((req, res, next) => {
    res.set('Set-Cookie', `sessionId=${req.session.id}`);
    next();
  });

  app.use(express.static('public'));

  app.listen(HTTP_PORT, () => {
    console.log(`Listening on port ${HTTP_PORT}`);
  });

  return app;
};
