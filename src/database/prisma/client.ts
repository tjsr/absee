import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { requireEnv } from '@tjsr/simple-env-utils';

export const createPrismaClient = (): PrismaClient => new PrismaClient({
  adapter: new PrismaD1({
    CLOUDFLARE_ACCOUNT_ID: requireEnv('CLOUDFLARE_ACCOUNT_ID'),
    CLOUDFLARE_D1_TOKEN: requireEnv('CLOUDFLARE_D1_TOKEN'),
    CLOUDFLARE_DATABASE_ID: requireEnv('CLOUDFLARE_DATABASE_ID'),
  }),
});
