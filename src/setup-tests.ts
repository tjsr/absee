import { loadEnv, requireEnv } from '@tjsr/simple-env-utils';

loadEnv(
  {
    debug: false,  
    path: process.env.DOTENV_FLOW_PATH || process.cwd(),
  }
);

requireEnv('GOOGLE_CLIENT_ID');