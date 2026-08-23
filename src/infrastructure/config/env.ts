/**
 * src/infrastructure/config/env.ts
 * Environment variable schema validation and accessor.
 */

import { z } from 'zod';

const envSchema = z.object({
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  GROQ_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().default('DocuSense AI'),
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(25),
  DEFAULT_SUMMARY_PRESET: z.enum(['short', 'medium', 'long']).default('medium'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export const env = envSchema.parse({
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  MAX_FILE_SIZE_MB: process.env.MAX_FILE_SIZE_MB,
  DEFAULT_SUMMARY_PRESET: process.env.DEFAULT_SUMMARY_PRESET,
  NODE_ENV: process.env.NODE_ENV,
});
