import 'dotenv/config'
import { z } from 'zod'

const booleanFromString = z
  .enum(['true', 'false', '1', '0'])
  .default('false')
  .transform((value) => value === 'true' || value === '1')

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  APP_TIMEZONE: z.string().default('America/Sao_Paulo'),
  CORS_ORIGIN: z.string().optional(),
  APP_SECRET: z.string().min(32, 'APP_SECRET precisa ter pelo menos 32 caracteres'),
  FILE_URL_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  MAX_UPLOAD_MB: z.coerce.number().positive().default(10),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET precisa ter pelo menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  DATABASE_URL: z.string().min(1),

  MINIO_ENDPOINT: z.string().default(''),
  MINIO_PORT: z.coerce.number().int().positive().default(9000),
  MINIO_USE_SSL: booleanFromString,
  MINIO_ACCESS_KEY: z.string().default(''),
  MINIO_SECRET_KEY: z.string().default(''),
  MINIO_BUCKET: z.string().default('caimento'),
  MINIO_REGION: z.string().default('us-east-1'),

  IMAGE_PROVIDER: z.enum(['openai', 'gemini']).default('openai'),

  OPENAI_API_KEY: z.string().default(''),
  OPENAI_IMAGE_MODEL: z.string().default('gpt-image-1'),
  OPENAI_IMAGE_QUALITY: z.enum(['low', 'medium', 'high', 'auto']).default('medium'),
  OPENAI_IMAGE_SIZE: z.enum(['1024x1024', '1024x1536', '1536x1024', 'auto']).default('1024x1536'),
  OPENAI_INPUT_FIDELITY: z.enum(['high', 'low', '']).default('high'),

  GEMINI_API_KEY: z.string().default(''),
  GEMINI_IMAGE_MODEL: z.string().default('gemini-2.5-flash-image'),

  SIMULATION_CONCURRENCY: z.coerce.number().int().min(1).max(20).default(2),
  SIMULATION_TIMEOUT_MS: z.coerce.number().int().min(10_000).default(180_000),
})

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n')
    console.error(`[env] Variáveis de ambiente inválidas:\n${issues}`)
    process.exit(1)
  }
  return parsed.data
}

export const env = loadEnv()
export const isProduction = env.NODE_ENV === 'production'
