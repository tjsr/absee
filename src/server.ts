import { AbseeConfig, IPAddress } from './types.js';
import { ExpressServerConfig, ExpressServerHelper } from '@tjsr/express-server-helper';
import { Options, createProxyMiddleware } from 'http-proxy-middleware';
import { Pool, PoolConnection, safeReleaseConnection } from '@tjsr/mysql-pool-utils';
import {
  StatsResponse,
  getElementsCompared,
  getMostFrequentlyComparedElement,
  getUniqueContibutingUserCount
} from './api/stats/stats.js';

import { ABSeeRequest } from './session.js';
import { GoogleAuthSettings } from './auth/types.js';
import { PrismaClient } from '@prisma/client';
import { SESSION_ID_HEADER } from './api/apiUtils.js';
import { debugHeaders } from './api/debugHeaders.js';
import { elo } from './api/elo.js';
import express from 'express';
import fs from 'fs';
import { getUser } from './api/user.js';
import { initialisePassportToExpressApp } from './auth/passport.js';
import onFinished from 'on-finished';
import { recent } from './api/recent.js';
import { serveComparison } from './api/serveComparison.js';
import { submit } from './api/submit.js';

export const DEFAULT_HTTP_PORT = 8283;

const PINNY_ARCADE_DEV_COLLECTION_ID ='83fd0b3e-dd08-4707-8135-e5f138a43f00';

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
    console.warn('Got part of forwarded header, but couldn\'t parse it.', err);
  }
  return (req as any).clientIp;
};

const getRequestConnectionPromise = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const pool: Pool = req.app.locals.connectionPool;
  if (!pool) {
    return next(new Error('No connection pool available'));
  }

  const conn = pool.getConnection();
  if (!res.locals) {
    return next(new Error('No locals object on response'));
  }
  res.locals.connectionPromise = conn;
  onFinished(res, async (_err, finishedResponse) => {
    safeReleaseConnection(await finishedResponse.locals.connectionPromise);
  });
  next();
};

export const startApp = (
  config: Partial<AbseeConfig> & { googleAuthSettings: GoogleAuthSettings }
): express.Express => {
  if (config.sessionOptions && config.sessionOptions.userIdNamespace === undefined) {
    throw new Error('userIdNamespace must be provided on sessionOptions');
  } else if (!config.sessionOptions) {
    throw new Error('sessionOptions must be provided on ABSee Config');
  }
  if (!config.connectionPool) {
    throw new Error('Connection pool must be provided');
  }
  const useConfig: Partial<ExpressServerConfig> = config?.sessionOptions?.name ? config
    : {
      ...config,
      sessionOptions: {
        ...config.sessionOptions,
      },
    };
  if (useConfig.sessionOptions?.name === undefined) {
    useConfig.sessionOptions!.name = SESSION_ID_HEADER;
  }
  if (!config.sessionOptions.secret) {
    throw new Error('Session secret must be provided');
  }
  const expressHelper = new ExpressServerHelper(useConfig);
  if (!config.googleAuthSettings) {
    throw new Error('Google auth settings must be provided');
  }

  const app: express.Express = expressHelper.init().app();
  app.locals.connectionPool = config.connectionPool;
  app.locals.prismaClient = new PrismaClient();
  app.use(getRequestConnectionPromise);

  initialisePassportToExpressApp(app, config.googleAuthSettings);

  app.get('/debugHeaders', debugHeaders);
  app.get('/api/recent(/:collectionId)?(/me)?',
    async (request: ABSeeRequest, response: express.Response) => {
      const collectionId = request.params.collectionId;
      if (collectionId == PINNY_ARCADE_DEV_COLLECTION_ID) {
        await recent(request, response, PINNY_ARCADE_DEV_COLLECTION_ID);
      } else {
        response.status(401);
        response.end();
      }
    });

  app.get('/api/elo(/:collectionId)?(/me)?',
    async (request: ABSeeRequest, response: express.Response) => {
      const collectionId = request.params.collectionId;
      if (collectionId == PINNY_ARCADE_DEV_COLLECTION_ID) {
        await elo(request, response, PINNY_ARCADE_DEV_COLLECTION_ID);
      } else {
        response.status(401);
        response.end();
      }
    });

  app.get('/api/stats/elementsCompared(/:collectionId)?', async (request: ABSeeRequest, response: express.Response) => {
    const collectionId = request.params.collectionId;
    const startTime: number = new Date().getTime();
    const connPromise = response.locals.connectionPool.getConnection();
    Promise.all([
      getElementsCompared(connPromise, collectionId),
      getUniqueContibutingUserCount(connPromise, collectionId),
      getMostFrequentlyComparedElement(connPromise, collectionId),
    ]).then((results) => {
      const responseBody: StatsResponse = {
        elementsCompared: results[0],
        mostFrequentlyComparedElement: results[2][0],
        mostFrequentlyComparedElementCount: results[2][1],
        usersContributed: results[1],
      };
      const endTime: number = new Date().getTime();
      console.log(`Retrieving all stats data took ${endTime - startTime}ms`);
      response.send(responseBody);
      response.status(200);
      response.end();
    }).finally(() => connPromise.then((conn: PoolConnection) => safeReleaseConnection(conn)));
  });
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
  app.get('/user', getUser);
  app.get('/user/:userId', getUser);

  // app.use((request: ABSeeRequest, response: express.Response, next: NextFunction) => {
  //   const session = request.session;
  //   if (!response.headersSent && session.userId && session.username) {
  //     setUserCookies(session.id, session.userId, session.username, response);
  //   }
  //   next();
  // });

  const PROXY_PORT = 5175;
  const PROXY_HOST = 'localhost';
  const frontendData = `http://${PROXY_HOST}:${PROXY_PORT}`;

  const proxyOptions: Options = {
    changeOrigin: true,
    target: frontendData,
  };

  const clientPaths: string[] = [
    '/recent(/*)?',
    '/about(/*)?',
    '/stats(/*)?',
    '/elo(/*)?',
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const serveIndex = (_req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    const __filename = new URL('../index.html', import.meta.url).pathname;
    res.write(fs.readFileSync(__filename));
    res.end();
  };

  if (process.env.STATIC_CONTENT) {
    console.log(`Serving static content from ${process.env.STATIC_CONTENT}`);
    const staticContent = express.static(process.env.STATIC_CONTENT);
    clientPaths.forEach((path: string) => {
      app.all(path, serveIndex);
    });
    app.use(staticContent);
  } else {
    const proxy = createProxyMiddleware(proxyOptions);
    clientPaths.forEach((path: string) => {
      app.all(path, proxy);
    });
    app.use(proxy);
  }

  return app;
};
