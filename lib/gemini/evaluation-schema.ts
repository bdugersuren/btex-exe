import { z } from 'zod'

export const criterionResultSchema = z.object({
  code:       z.string(),
  percentage: z.number().min(0).max(100),
  passes:     z.boolean(),
  feedback:   z.string(),
  feedbackMn: z.string().optional(),
})

export const geminiEvaluationSchema = z.object({
  criteriaResults:  z.array(criterionResultSchema),
  strengths:        z.array(z.string()),
  strengthsMn:      z.array(z.string()).optional(),
  improvements:     z.array(z.string()),
  improvementsMn:   z.array(z.string()).optional(),
  overallFeedback:  z.string(),
  overallFeedbackMn: z.string().optional(),
})

export type GeminiEvaluation = z.infer<typeof geminiEvaluationSchema>

export function parseGeminiResponse(raw: string): GeminiEvaluation {
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/) ?? raw.match(/(\{[\s\S]*\})/)
  const jsonStr = jsonMatch?.[1] ?? raw

  const parsed = JSON.parse(jsonStr)
  return geminiEvaluationSchema.parse(parsed)
}
