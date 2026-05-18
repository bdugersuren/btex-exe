import { GoogleGenerativeAI } from '@google/generative-ai'

// Free-tier Gemini models — verified from API, ordered by speed (fastest first)
export const FREE_MODELS = [
  'gemini-2.0-flash-lite',      // fastest stable
  'gemini-2.5-flash-lite',      // fast lite
  'gemini-flash-lite-latest',   // alias → current lite
  'gemini-2.0-flash',           // reliable stable
  'gemini-flash-latest',        // alias → current flash
  'gemini-2.5-flash',           // most capable (may hit 503)
]

export function getApiKeys(): string[] {
  const multi = process.env.GEMINI_API_KEYS
  if (multi) return multi.split(',').map(k => k.trim()).filter(Boolean)
  const single = process.env.GEMINI_API_KEY
  if (single) return [single]
  throw new Error('GEMINI_API_KEY тохируулагдаагүй байна')
}

// Spread picks evenly across the key pool from a random offset
function pickSpread(keys: string[], count: number): string[] {
  if (keys.length <= count) return [...keys]
  const offset = Math.floor(Math.random() * keys.length)
  const step = Math.floor(keys.length / count)
  return Array.from({ length: count }, (_, i) => keys[(offset + i * step) % keys.length])
}

async function tryOnce(
  key: string,
  model: string,
  prompt: string,
  timeoutMs: number,
): Promise<string> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Gemini timeout after ${timeoutMs}ms`)), timeoutMs),
  )
  const client = new GoogleGenerativeAI(key)
  const genModel = client.getGenerativeModel({ model })
  const result = await Promise.race([genModel.generateContent(prompt), timeout])
  return result.response.text()
}


/**
 * Sends prompt to Gemini. Tries up to 10 keys in parallel per model,
 * falls back through all free models. First success wins.
 */
export async function generateContent(
  prompt: string,
  preferredModel = 'gemini-2.0-flash',
): Promise<string> {
  const allKeys = getApiKeys()
  const models = [preferredModel, ...FREE_MODELS.filter(m => m !== preferredModel)]

  // 22s per key attempt — leaves buffer before Next.js 30s default or route maxDuration
  const KEY_TIMEOUT = 22_000
  // Try up to 10 keys simultaneously per model round
  const KEYS_PER_ROUND = Math.min(allKeys.length, 10)

  for (const model of models) {
    const keys = pickSpread(allKeys, KEYS_PER_ROUND)
    try {
      return await Promise.any(
        keys.map(key => tryOnce(key, model, prompt, KEY_TIMEOUT)),
      )
    } catch (aggErr) {
      const errors: unknown[] = (aggErr as AggregateError).errors ?? [aggErr]
      console.error(
        `[Gemini] ${model}: all ${keys.length} keys failed —`,
        errors.map(e => (e instanceof Error ? e.message : String(e))).join(' | '),
      )
      // Non-retryable errors (bad request, parse error) → still try next model
    }
  }

  throw new Error('Бүх Gemini model болон API key амжилтгүй боллоо')
}
