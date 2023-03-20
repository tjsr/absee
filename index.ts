import * as dotenv from 'dotenv';

import { initializeLoader, retrieveCollectionData } from './src/datainfo';

import { loader as pinLoader } from './src/pins/pinpanion';
import { requireEnv } from './src/utils';
import { startApp } from './src/server';

dotenv.config();

requireEnv('SESSION_SECRET');
requireEnv('USERID_UUID_NAMESPACE');
requireEnv('HTTP_PORT');

initializeLoader(pinLoader).then(() => {
  startApp(pinLoader);
}).catch((err:Error) => {
  console.error('Failed getting pin collection data: ' + err.message);
});