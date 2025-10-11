import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

// Load .env file before anything else
// It ensures `process.env` is populated, even outside Nest context (e.g., tests, CLI)
loadEnv();

// Define validation schema using Zod
const configSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .default('3001')
    .transform((val) => parseInt(val, 10)),

  // MongoDB
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  DB_NAME: z.string().default('chronos'),

  // Heartbeat
  HEARTBEAT_INTERVAL_SEC: z
    .string()
    .default('120')
    .transform((val) => parseInt(val, 10)),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  APP_URL: z.string().default('http://localhost:3001'),
});

// TypeScript type for your config
export type AppConfig = z.infer<typeof configSchema>;

// NestJS-compatible factory function
export const loadConfiguration = (): AppConfig => {
  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    throw new Error('Configuration validation failed');
  }

  return result.data;
};
