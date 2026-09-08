import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// 6 levels up from src/shared/infrastructure/config/ lands at the monorepo root — where .env lives.
config({ path: resolve(__dirname, '../../../../../../.env') });

export const env = {
  DATABASE_URL: process.env['DATABASE_URL'] ?? '',
  PORT: Number(process.env['PORT'] ?? 4000),
  UPLOADS_DIR: process.env['UPLOADS_DIR'] ?? resolve(__dirname, '../../../../../../uploads'),
};
