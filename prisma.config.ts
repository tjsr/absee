import { loadEnv } from '@tjsr/simple-env-utils';
import { defineConfig } from 'prisma/config';

// import your .env file
loadEnv();

export default defineConfig({
  schema: 'src/database/prisma/schema.prisma',
});
