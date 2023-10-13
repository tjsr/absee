import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as https from 'https';
import * as sourcemap from 'source-map-support';

import express from 'express';
import { requireEnv } from './src/utils';
import { startApp } from './src/server';

dotenv.config();

sourcemap.install();
process.on('unhandledRejection', console.warn);

requireEnv('SESSION_SECRET');
requireEnv('USERID_UUID_NAMESPACE');
requireEnv('HTTP_PORT');

const SSL_KEY = process.env.SSL_KEY || '/tmp/server.key';
const SSL_CERT = process.env.SSL_CERT || '/tmp/server.crt';

const HTTP_PORT: number =
  process.env.HTTP_PORT !== undefined ? parseInt(process.env.HTTP_PORT!) : 8280;

const app: express.Express = startApp();
if (fs.existsSync(SSL_CERT) && fs.existsSync(SSL_KEY)) {
  https.createServer({
    cert: fs.readFileSync(SSL_CERT),
    key: fs.readFileSync(SSL_KEY),
  }, app).listen(HTTP_PORT, () => {
    console.log(`Listening on port ${HTTP_PORT}`);
  });
} else {
  app.listen(HTTP_PORT, () => {
    console.log(`Listening on port ${HTTP_PORT}`);
  });
}
