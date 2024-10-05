import { requireEnv } from '@tjsr/simple-env-utils';

process.argv.forEach((envVar: string) => {
  requireEnv(envVar);
});
