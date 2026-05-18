import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis | undefined }

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: false,
  })

redis.on('error', (err) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('[Redis] connection error:', err.message)
  }
})

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
