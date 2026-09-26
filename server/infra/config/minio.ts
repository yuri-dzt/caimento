import { Client } from 'minio'
import { env } from './env'

export const minioConfigured = Boolean(env.MINIO_ENDPOINT && env.MINIO_ACCESS_KEY && env.MINIO_SECRET_KEY)

export const minioClient: Client | null = minioConfigured
  ? new Client({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
      region: env.MINIO_REGION,
    })
  : null

export const minioBucket = env.MINIO_BUCKET
export const minioRegion = env.MINIO_REGION
