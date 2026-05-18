import { redis } from './redis-client'
import type { GeminiEvaluation } from '@/lib/gemini/evaluation-schema'

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

function cacheKey(textHash: string, assignmentId: string) {
  return `gemini:eval:${assignmentId}:${textHash}`
}

export async function getCachedGeminiResult(
  textHash: string,
  assignmentId: string,
): Promise<GeminiEvaluation | null> {
  try {
    const cached = await redis.get(cacheKey(textHash, assignmentId))
    return cached ? (JSON.parse(cached) as GeminiEvaluation) : null
  } catch {
    return null
  }
}

export async function setCachedGeminiResult(
  textHash: string,
  assignmentId: string,
  result: GeminiEvaluation,
): Promise<void> {
  try {
    await redis.set(
      cacheKey(textHash, assignmentId),
      JSON.stringify(result),
      'EX',
      CACHE_TTL_SECONDS,
    )
  } catch {
    // cache write failure is non-fatal
  }
}
