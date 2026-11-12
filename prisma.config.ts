import { loadEnv, requireEnv } from '@tjsr/simple-env-utils';
import type { PrismaConfig } from 'prisma';
import { PrismaD1 } from '@prisma/adapter-d1';

// import your .env file
loadEnv();

export default {
  async adapter() {
    return new PrismaD1({
      CLOUDFLARE_ACCOUNT_ID: requireEnv('CLOUDFLARE_ACCOUNT_ID'),
      CLOUDFLARE_D1_TOKEN: requireEnv('CLOUDFLARE_D1_TOKEN'),
      CLOUDFLARE_DATABASE_ID: requireEnv('CLOUDFLARE_DATABASE_ID'),
    });
  },
  engine: 'js',
  experimental: {
    adapter: true,
  },
  schema: 'src/database/prisma/schema.prisma',
} satisfies PrismaConfig;
