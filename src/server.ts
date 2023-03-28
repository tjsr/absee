import * as dotenv from 'dotenv';

import { ABSeeRequest, getSession, useSessionId } from './session';

import { CollectionTypeLoader } from './datainfo';
import { IPAddress } from './types';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { debugHeaders } from './api/debugHeaders';
import express from 'express';
import { login } from './api/login';
import { logout } from './api/logout';
import morgan from 'morgan';
import requestIp from 'request-ip';
import { serveComparison } from './api/serveComparison';
import { session } from './api/session';
import { submit } from './api/submit';

dotenv.config();

const morganLog = morgan('common');
// process.env.PRODUCTION =='true' ? 'common' : 'dev'

const HTTP_PORT: number =
  process.env.HTTP_PORT !== undefined ? parseInt(process.env.HTTP_PORT!) : 8280;

const corsOptions = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Expose-Headers': '*',
  'optionsSuccessStatus': 200,
  'origin': '*',
};

export const getIp = (req: express.Request): IPAddress => {
  try {
    if (req.headers.forwarded) {
      const forwardedForHeader: string|undefined = req.headers.forwarded
        .split(';')
        .find((header) => header.startsWith('for='));
      const forParts: string[]|undefined = forwardedForHeader?.split('=');
      if (forParts !== undefined && forParts.length == 2) {
        return forParts[1];
      }
    }
  } catch (err) {
    console.warn('Got part of forwarded header, but couldn\'t parse it.');
  }
  return (req as any).clientIp;
};

export const startApp = <T, D>(loader: CollectionTypeLoader<T, D>) => {
  const app = express();
  app.use(morganLog);
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
  app.get('/debugHeaders', debugHeaders);
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

  app.use(express.static('build'));

  app.listen(HTTP_PORT, () => {
    console.log(`Listening on port ${HTTP_PORT}`);
  });

  return app;
};
