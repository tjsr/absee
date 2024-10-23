import { loadEnv } from '@tjsr/simple-env-utils';

loadEnv(
  {
    debug: true,
    path: process.env.DOTENV_FLOW_PATH || process.cwd(),
    silent: false,
  }
);
