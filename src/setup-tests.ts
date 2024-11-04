import { loadEnv } from '@tjsr/simple-env-utils';

loadEnv(
  {
    debug: false,
    path: process.env.DOTENV_FLOW_PATH || process.cwd(),
  }
);
