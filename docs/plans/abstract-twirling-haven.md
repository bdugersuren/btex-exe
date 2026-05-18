# Performance Optimization Plan — BTEC Evaluator

## Context

The app runs slowly when deployed on a server. The bottlenecks are: missing database indexes causing full table scans, an unconfigured Prisma connection pool that saturates under concurrent Gemini evaluations (22s each), synchronous PDF extraction blocking the event loop, no caching layer for Gemini results, and file downloads buffering entire files in memory. Redis is a good fit for Gemini response caching. Nginx adds gzip compression and rate limiting without changing app code.

---

## Sprint 1 — Database & Connection Pool (Day 1)

### 1a. Add missing FK indexes via Prisma migration

**File:** `prisma/schema.prisma`

Add `@@index` to 10 models that have FK columns without indexes:

```prisma
model SubmissionAttempt {
  @@index([submissionId])
  @@index([extractedTextHash])
}
model Evaluation {
  @@index([submissionAttemptId])
  @@index([evaluatedById])
}
model EvaluationCriterion {
  @@index([evaluationId])
}
model AssignmentVerifier {
  @@index([assignmentId])
  @@index([userId])
}
model VerificationReview {
  @@index([evaluationId])
  @@index([reviewerId])
  @@index([assignmentId])
}
model Notification {
  @@index([userId])
}
model AuditLog {
  @@index([userId])
  @@index([resourceId])
}
model ResubmitRequest {
  @@index([submissionId])
  @@index([requestedById])
}
model AssignmentUnit {
  @@index([assignmentId])
  @@index([unitId])
}
model StudentCohort {
  @@index([studentId])
  @@index([cohortId])
}
```

Then run: `./scripts/migrate.sh dev` (name it `add_performance_indexes`)

### 1b. Configure Prisma connection pool

**File:** `lib/db/prisma.ts` (or wherever `PrismaClient` is instantiated)

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=20&pool_timeout=20',
    },
  },
})
```

Alternatively append `?connection_limit=20&pool_timeout=20` directly in `DATABASE_URL` inside `docker-compose.yml` and `docker-compose.dev.yml`.

---

## Sprint 2 — Redis + Gemini Response Cache (Days 2-3)

### 2a. Add Redis service to Docker Compose

**File:** `docker-compose.yml` — add under `services:`:

```yaml
redis:
  image: redis:7-alpine
  container_name: btec_redis
  restart: unless-stopped
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru --save ""
  ports:
    - '6379:6379'
  healthcheck:
    test: ['CMD', 'redis-cli', 'ping']
    interval: 10s
    timeout: 5s
    retries: 5
```

Also add to `docker-compose.dev.yml` with `container_name: btec_redis_dev` and port `6380:6379`.

Add `REDIS_URL: redis://redis:6379` to the `app` service environment in both compose files.

Add `ioredis` dependency: `npm install ioredis` + `npm install -D @types/ioredis` (if needed — ioredis has built-in types).

### 2b. Redis client singleton

**New file:** `lib/redis/redis-client.ts`

```typescript
import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis | undefined }

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  })

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
```

### 2c. Gemini response cache

**New file:** `lib/redis/gemini-cache.ts`

```typescript
import { redis } from './redis-client'

const CACHE_TTL = 60 * 60 * 24 * 7 // 7 days

export async function getCachedEvaluation(textHash: string, assignmentId: string) {
  const key = `gemini:eval:${assignmentId}:${textHash}`
  const cached = await redis.get(key)
  return cached ? JSON.parse(cached) : null
}

export async function setCachedEvaluation(
  textHash: string,
  assignmentId: string,
  result: unknown
) {
  const key = `gemini:eval:${assignmentId}:${textHash}`
  await redis.set(key, JSON.stringify(result), 'EX', CACHE_TTL)
}
```

### 2d. Wire cache into the evaluation API route

**File:** `app/api/evaluations/evaluate/route.ts` (or wherever Gemini is called)

Before calling Gemini, check cache using `SubmissionAttempt.extractedTextHash`. On cache hit, skip Gemini entirely and return cached result. On cache miss, call Gemini, store result, then proceed.

```typescript
import { getCachedEvaluation, setCachedEvaluation } from '@/lib/redis/gemini-cache'

// Before Gemini call:
const cached = await getCachedEvaluation(attempt.extractedTextHash, assignmentId)
if (cached) return cached

// After Gemini call:
await setCachedEvaluation(attempt.extractedTextHash, assignmentId, geminiResult)
```

---

## Sprint 3 — Streaming Downloads + Nginx (Day 4)

### 3a. Stream file downloads (remove memory buffer)

**File:** `app/api/files/[id]/route.ts` (or the download route)

Replace `fs.readFile` with `fs.createReadStream` and pipe it through a `ReadableStream`:

```typescript
import { createReadStream } from 'fs'
import { Readable } from 'stream'

// Replace: const buffer = await fs.readFile(filePath)
// With:
const nodeStream = createReadStream(filePath)
const webStream = Readable.toWeb(nodeStream) as ReadableStream

return new Response(webStream, {
  headers: {
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${fileName}"`,
    'Content-Length': String(stat.size),
  },
})
```

### 3b. Add Nginx reverse proxy

**New file:** `docker/nginx.conf`

```nginx
worker_processes auto;
events { worker_connections 1024; }

http {
  gzip on;
  gzip_types text/plain application/json application/javascript text/css;
  gzip_min_length 1000;

  limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
  limit_req_zone $binary_remote_addr zone=evaluate:10m rate=5r/m;

  upstream app { server app:3000; }

  server {
    listen 80;
    client_max_body_size 50M;

    location /api/evaluations/evaluate {
      limit_req zone=evaluate burst=3 nodelay;
      proxy_pass http://app;
      proxy_set_header Host $host;
      proxy_read_timeout 120s;
    }

    location /api/ {
      limit_req zone=api burst=20 nodelay;
      proxy_pass http://app;
      proxy_set_header Host $host;
    }

    location / {
      proxy_pass http://app;
      proxy_set_header Host $host;
      proxy_cache_bypass $http_upgrade;
    }
  }
}
```

**File:** `docker-compose.yml` — add nginx service and change `app` ports:

```yaml
nginx:
  image: nginx:alpine
  container_name: btec_nginx
  restart: unless-stopped
  depends_on:
    app:
      condition: service_healthy
  ports:
    - '80:80'
  volumes:
    - ./docker/nginx.conf:/etc/nginx/nginx.conf:ro

app:
  # Remove: ports: ['3000:3000']  ← nginx handles external traffic
  # Keep internal port 3000 accessible to nginx via service name
  expose:
    - '3000'
```

---

## Sprint 4 — Docker Resource Limits + Client Cache LRU (Day 5)

### 4a. Docker resource limits

**File:** `docker-compose.yml` — add `deploy.resources` to `app` and `db` services:

```yaml
app:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 1G
      reservations:
        memory: 512M

db:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 512M

redis:
  deploy:
    resources:
      limits:
        cpus: '0.5'
        memory: 300M
```

### 4b. Fix client-side evaluation store LRU

**File:** `store/evaluation-store.ts`

Replace the unbounded `Map<string, Evaluation>` cache with a max-size LRU:

```typescript
const MAX_CACHE_SIZE = 50

// In addToCache:
if (cache.size >= MAX_CACHE_SIZE) {
  const firstKey = cache.keys().next().value
  cache.delete(firstKey)
}
cache.set(id, evaluation)
```

### 4c. Next.js static asset cache headers

**File:** `next.config.js` — add cache headers for static files:

```javascript
async headers() {
  return [
    {
      source: '/_next/static/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
    {
      source: '/api/health',
      headers: [{ key: 'Cache-Control', value: 'no-store' }],
    },
  ]
}
```

---

## Critical Files to Modify

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add 10 `@@index` directives |
| `lib/db/prisma.ts` | Connection pool `connection_limit=20` |
| `docker-compose.yml` | Add Redis + Nginx services, resource limits |
| `docker-compose.dev.yml` | Add Redis dev service (port 6380) |
| `app/api/evaluations/evaluate/route.ts` | Wire Gemini cache |
| `app/api/files/[id]/route.ts` | Stream downloads |
| `next.config.js` | Static asset cache headers |
| `store/evaluation-store.ts` | LRU eviction |

**New files to create:**
- `lib/redis/redis-client.ts`
- `lib/redis/gemini-cache.ts`
- `docker/nginx.conf`

---

## Verification

1. **Indexes**: After migration, run `docker exec btec_db psql -U btec_user -d btec_evaluator -c "\d assignment_verifiers"` and confirm `assignmentId` index appears.
2. **Redis cache**: Run an evaluation twice on the same submission — second call should complete in <100ms (vs 22s). Check with `docker exec btec_redis redis-cli keys "gemini:*"`.
3. **Streaming downloads**: Monitor memory with `docker stats btec_app` while downloading a large PDF — memory should not spike.
4. **Nginx gzip**: `curl -H "Accept-Encoding: gzip" -I http://localhost/api/assignments` — response headers should include `Content-Encoding: gzip`.
5. **Connection pool**: Use `k6` or `ab` with 20 concurrent users — no `pool_timeout` errors in app logs.
