import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the backend/.env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET,
};
