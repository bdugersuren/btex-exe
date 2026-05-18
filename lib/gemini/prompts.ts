import { Rubric } from '@/types/models'

export function buildEvaluationPrompt(
  studentText:            string,
  rubric:                 Rubric,
  assignmentTitle:        string,
  assignmentDescription:  string,
  assignmentDescriptionMn?: string | null,
): string {
  const criteriaText = rubric.criteria
    .map((c) => {
      const mn = c.descriptionMn ? `\n    Монгол: ${c.descriptionMn}` : ''
      return `  - ${c.code} (${c.grade}): ${c.description}${mn}`
    })
    .join('\n')

  return `You are an expert BTEC Internal Verifier evaluating a student assignment submission.

## Unit: ${assignmentTitle}

## Unit Description (English):
${assignmentDescription}
${assignmentDescriptionMn ? `\n## Unit Description (Mongolian):\n${assignmentDescriptionMn}\n` : ''}
## Grading Criteria:
${criteriaText}

## Student Submission:
${studentText}

## Evaluation Instructions:
For EACH criterion above, evaluate the student's submission as a percentage (0–100%) based on:
1. How well the submission addresses the unit description and learning outcomes
2. How specifically the submission satisfies that individual criterion's requirements

Scoring guide:
- 90–100%: Exceptional — fully meets and exceeds the criterion
- 70–89%:  Satisfactory — clearly meets the criterion (PASSES)
- 50–69%:  Partial — addresses the criterion but with gaps (FAILS)
- 0–49%:   Insufficient — does not meaningfully meet the criterion (FAILS)

A criterion PASSES if its percentage is 70 or above. Otherwise it FAILS.
Be specific in your feedback — reference actual content from the submission.

Return ONLY a valid JSON object with this exact structure (no extra text).
ALL text fields must be written in BOTH English AND Mongolian as separate fields:

\`\`\`json
{
  "criteriaResults": [
    {
      "code": "<criterion code e.g. P1>",
      "percentage": <0-100 integer>,
      "passes": <true if percentage >= 70, false otherwise>,
      "feedback": "<2-3 sentences of specific, actionable feedback in English>",
      "feedbackMn": "<same feedback translated into Mongolian>"
    }
  ],
  "strengths": ["<strength 1 in English>", "<strength 2 in English>"],
  "strengthsMn": ["<strength 1 in Mongolian>", "<strength 2 in Mongolian>"],
  "improvements": ["<improvement 1 in English>", "<improvement 2 in English>"],
  "improvementsMn": ["<improvement 1 in Mongolian>", "<improvement 2 in Mongolian>"],
  "overallFeedback": "<3-4 sentences of overall assessment in English>",
  "overallFeedbackMn": "<same overall feedback translated into Mongolian>"
}
\`\`\`
`
}
