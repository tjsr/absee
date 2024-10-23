import * as fs from 'fs';
import * as https from 'https';
import * as sourcemap from 'source-map-support';

import { DEFAULT_HTTP_PORT, startApp } from './src/server.js';
import { UserSessionOptions, getMysqlSessionStore } from '@tjsr/user-session-middleware';
import { intEnv, loadEnv } from '@tjsr/simple-env-utils';

import { CorsOptions } from 'cors';
import { SESSION_ID_HEADER } from './src/api/apiUtils.js';
import express from 'express';
import { requireEnv } from './src/utils.js';

loadEnv();

const corsOptions: CorsOptions | any = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Expose-Headers': '*',
  'optionsSuccessStatus': 200,
  'origin': '*',
};

sourcemap.install();
process.on('unhandledRejection', console.warn);

try {
  requireEnv('SESSION_SECRET');
  requireEnv('USERID_UUID_NAMESPACE');
  requireEnv('HTTP_PORT');
} catch (err: any) {
  console.log('Got error while requiring env vars');
  console.error(err.message);
  process.exit(1);
}

const SSL_KEY = process.env.SSL_KEY || '/tmp/server.key';
const SSL_CERT = process.env.SSL_CERT || '/tmp/server.crt';

const HTTP_PORT: number = intEnv('HTTP_PORT', DEFAULT_HTTP_PORT);

let sessionStore;
try {
  console.log('Starting A/B See server. Getting session store connection...');
  sessionStore = await getMysqlSessionStore();
} catch (err) {
  console.error('Error getting session store', err);
  process.exit(1);
}

const sessionOptions: Partial<UserSessionOptions> = {
  name: SESSION_ID_HEADER,
  skipExposeHeaders: false,
  store: sessionStore,
};

const app: express.Express = startApp({ cors: corsOptions, sessionOptions });
if (fs.existsSync(SSL_CERT) && fs.existsSync(SSL_KEY)) {
  https.createServer({
    cert: fs.readFileSync(SSL_CERT),
    key: fs.readFileSync(SSL_KEY),
  }, app).listen(HTTP_PORT, () => {
    console.log(`Listening using HTTPS on port ${HTTP_PORT}`);
  });
} else {
  app.listen(HTTP_PORT, () => {
    console.log(`Listening using HTTP on port ${HTTP_PORT}`);
  });
}
