import { getEnvPath } from 'src/common/helper/env.helper';
import { config } from 'dotenv';
import { resolve } from 'path';

const envFilePath: string = getEnvPath(resolve(__dirname, '../..'));

config({ path: envFilePath });

export const configuration = () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  baseUrl: process.env.BASE_URL,
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    name: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    entities: process.env.DATABASE_ENTITIES,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  adminUser: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
});
