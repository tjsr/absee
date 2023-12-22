import * as dotenv from 'dotenv';

import { ABSeeRequest, mysqlSessionStore } from './session';
import express, { NextFunction } from 'express';
import { getSession, setUserCookies } from './sessions/getSession';

import { IPAddress } from './types';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { debugHeaders } from './api/debugHeaders';
import { initialisePassportToExpressApp } from './auth/passport';
import { login } from './api/login';
import { logout } from './api/logout';
import morgan from 'morgan';
import requestIp from 'request-ip';
import { serveComparison } from './api/serveComparison';
import { session } from './api/session';
import { submit } from './api/submit';
import { useSessionId } from './sessions/useSessionId';

const ASSET_BUILD_DIR = 'dist';
dotenv.config();

const PINNY_ARCADE_DEV_COLLECTION_ID ='83fd0b3e-dd08-4707-8135-e5f138a43f00';

const morganLog = morgan('common');
// process.env.PRODUCTION =='true' ? 'common' : 'dev'

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

export const startApp = (): express.Express => {
  const app: express.Express = express();
  app.use(morganLog);
  app.use(cors(corsOptions));
  app.use(requestIp.mw());
  app.set('trust proxy', true);

  app.use(function (req, res, next) {
    res.header('Access-Control-Expose-Headers', '*');
    next();
  });

  app.use(cookieParser());
  app.use(getSession(mysqlSessionStore));
  app.use(useSessionId);

  initialisePassportToExpressApp(app);

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
    async (request: ABSeeRequest, response: express.Response) => {
      const collectionId = request.params.collectionId;
      if (collectionId == PINNY_ARCADE_DEV_COLLECTION_ID) {
        await serveComparison(request, response, PINNY_ARCADE_DEV_COLLECTION_ID);
      } else {
        response.status(401);
        response.end();
      }
    }
  );
  app.post('/submit', submit);

  app.use((request: ABSeeRequest, response: express.Response, next: NextFunction) => {
    const session = request.session;
    if (!response.headersSent && session.userId && session.username) {
      setUserCookies(session.id, session.userId, session.username, response);

      // response.set('Set-Cookie', `sessionId=${request.session.id}; user_id=${request.session.userId}; ` +
      //   `displayName=${request.session.username}; Path=/;`);
      // // res.set('Set-Cookie', `user_id=${req.session.userId}`);
    }
    next();
  });

  const PROXY_PORT = 5173;
  const PROXY_HOST = 'localhost';
  const frontendData = `http://${PROXY_HOST}:${PROXY_PORT}`;

  const proxyOptions = {
    changeOrigin: true,
    target: frontendData,
  };

  if (process.env.STATIC_CONTENT) {
    console.log(`Serving static content from ${process.env.STATIC_CONTENT}`);
    app.use(express.static(process.env.STATIC_CONTENT));
  } else {
    app.use(createProxyMiddleware(proxyOptions));
  }

  return app;
};
