import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createHash } from 'crypto'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { buildApiResponse, buildErrorResponse } from '@/lib/utils'
import { handleApiError, UnauthorizedError, ForbiddenError, NotFoundError, AppError } from '@/lib/errors'
import { extractTextFromFile } from '@/lib/file/file-parser'
import { generateContent } from '@/lib/gemini/gemini-client'
import { buildEvaluationPrompt } from '@/lib/gemini/prompts'
import { parseGeminiResponse, GeminiEvaluation } from '@/lib/gemini/evaluation-schema'
import { getCachedGeminiResult, setCachedGeminiResult } from '@/lib/redis/gemini-cache'
import {
  AiRunStatus,
  AttemptStatus,
  EvaluationSource,
  EvaluationStatus,
  Grade,
  Role,
  SubmissionStatus,
} from '@prisma/client'
import { Rubric } from '@/types/models'
import { CRITERION_PASS_THRESHOLD } from '@/lib/constants'
import path from 'path'
import { z } from 'zod'
import {
  decisionFromPercentage,
  evaluationToLegacy,
  latestAttempt,
  rubricFromAssignment,
} from '@/lib/domain/btec-adapters'

export const runtime = 'nodejs'
export const maxDuration = 60 // seconds; allows Gemini time to respond

const bodySchema = z.object({ submissionId: z.string().uuid() })

function deriveGradeAndScore(
  criteriaResults: GeminiEvaluation['criteriaResults'],
  rubric: Rubric,
): { grade: Grade; score: number } {
  const resultMap = new Map(criteriaResults.map((r) => [r.code, r]))

  const passCriteria  = rubric.criteria.filter((c) => c.grade === 'PASS')
  const meritCriteria = rubric.criteria.filter((c) => c.grade === 'MERIT')
  const distCriteria  = rubric.criteria.filter((c) => c.grade === 'DISTINCTION')

  const allPassMet  = passCriteria.length  === 0 || passCriteria.every((c)  => (resultMap.get(c.code)?.percentage ?? 0) >= CRITERION_PASS_THRESHOLD)
  const allMeritMet = meritCriteria.length === 0 || meritCriteria.every((c) => (resultMap.get(c.code)?.percentage ?? 0) >= CRITERION_PASS_THRESHOLD)
  const allDistMet  = distCriteria.length  === 0 || distCriteria.every((c)  => (resultMap.get(c.code)?.percentage ?? 0) >= CRITERION_PASS_THRESHOLD)

  let grade: Grade
  if (!allPassMet)      grade = Grade.U
  else if (!allMeritMet) grade = Grade.PASS
  else if (!allDistMet)  grade = Grade.MERIT
  else                   grade = Grade.DISTINCTION

  const avg = criteriaResults.length > 0
    ? criteriaResults.reduce((sum, r) => sum + r.percentage, 0) / criteriaResults.length
    : 0

  return { grade, score: Math.round(avg * 10) / 10 }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()
    if (session.user.role === Role.STUDENT || session.user.role === Role.IV) throw new ForbiddenError()

    const body = await req.json()
    const { submissionId } = bodySchema.parse(body)

    const submission = await prisma.assignmentSubmission.findUnique({
      where:   { id: submissionId },
      include: {
        assignment: {
          include: {
            criteria: { orderBy: { sortOrder: 'asc' } },
          },
        },
        attempts: {
          orderBy: { attemptNo: 'desc' },
          take:    1,
          include: { file: true },
        },
        evaluations: { select: { id: true, version: true, attemptId: true } },
      },
    })
    if (!submission) throw new NotFoundError('Submission')

    const canAssess =
      session.user.role === Role.ADMIN ||
      session.user.role === Role.LEAD_IV ||
      submission.assignment.createdById === session.user.id ||
      submission.assignment.ownerTeacherId === session.user.id
    if (!canAssess) throw new ForbiddenError()

    if (submission.status === SubmissionStatus.FINALIZED) {
      throw new AppError('ALREADY_FINALIZED', 'Энэ submission эцэслэгдсэн байна')
    }

    const attempt = latestAttempt(submission)
    if (!attempt?.file) throw new AppError('NO_ATTEMPT', 'Үнэлэх оролдлого олдсонгүй')

    const rubric = rubricFromAssignment(submission.assignment)
    if (!rubric?.criteria?.length) {
      throw new AppError('NO_RUBRIC', 'Энэ assignment-д үнэлгээний шалгуур тохируулагдаагүй байна')
    }

    const absolutePath = path.join(process.cwd(), 'storage', attempt.file.storageKey)
    const studentText  = await extractTextFromFile(absolutePath)
    if (!studentText.trim()) {
      throw new AppError('EMPTY_FILE', 'Файлаас текст гаргаж авах боломжгүй байна')
    }

    const textHash = createHash('sha256').update(studentText).digest('hex')

    await prisma.submissionAttempt.update({
      where: { id: attempt.id },
      data:  {
        status: AttemptStatus.TEXT_EXTRACTED,
        extractedText: studentText,
        extractedTextHash: textHash,
      },
    })

    const prompt = buildEvaluationPrompt(
      studentText,
      rubric,
      submission.assignment.title,
      submission.assignment.instructions,
      submission.assignment.instructionsMn,
    )

    const aiRun = await prisma.aiEvaluationRun.create({
      data: {
        attemptId: attempt.id,
        requestedById: session.user.id,
        model: process.env.GEMINI_MODEL ?? 'gemini-1.5-flash',
        status: AiRunStatus.RUNNING,
        startedAt: new Date(),
      },
    })
    await prisma.submissionAttempt.update({
      where: { id: attempt.id },
      data:  { status: AttemptStatus.EVALUATING },
    })

    let raw = ''
    let result: GeminiEvaluation
    const cached = await getCachedGeminiResult(textHash, submission.assignmentId)
    if (cached) {
      result = cached
    } else {
      try {
        raw = await generateContent(prompt)
        result = parseGeminiResponse(raw)
        await setCachedGeminiResult(textHash, submission.assignmentId, result)
      } catch (error) {
        await prisma.aiEvaluationRun.update({
          where: { id: aiRun.id },
          data:  {
            status: AiRunStatus.FAILED,
            errorMessage: error instanceof Error ? error.message : 'Unknown AI evaluation error',
            completedAt: new Date(),
          },
        })
        await prisma.submissionAttempt.update({
          where: { id: attempt.id },
          data:  { status: AttemptStatus.TEXT_EXTRACTED },
        })
        throw error
      }
    }

    const { grade, score } = deriveGradeAndScore(result.criteriaResults, rubric)

    const resultByCode = new Map(result.criteriaResults.map((item) => [item.code, item]))
    const nextVersion = Math.max(0, ...submission.evaluations
      .filter((evaluation) => evaluation.attemptId === attempt.id)
      .map((evaluation) => evaluation.version)) + 1

    const evaluation = await prisma.$transaction(async (tx) => {
      const ev = await tx.evaluation.create({
        data: {
          submissionId,
          attemptId:         attempt.id,
          assessorId:        session.user.id,
          aiRunId:           aiRun.id,
          version:           nextVersion,
          source:            EvaluationSource.HYBRID,
          status:            EvaluationStatus.DRAFT,
          score,
          grade,
          feedback:          result.overallFeedback,
          feedbackMn:        result.overallFeedbackMn ?? '',
          strengths:         result.strengths,
          strengthsMn:       result.strengthsMn ?? [],
          improvements:      result.improvements,
          improvementsMn:    result.improvementsMn ?? [],
          criterionResults: {
            create: submission.assignment.criteria.map((criterion) => {
              const criterionResult = resultByCode.get(criterion.code)
              const percentage = criterionResult?.percentage
              return {
                assignmentCriterionId: criterion.id,
                code: criterion.code,
                level: criterion.level,
                decision: decisionFromPercentage(percentage),
                percentage,
                score: percentage,
                maxScore: criterion.maxScore,
                feedback: criterionResult?.feedback ?? '',
                feedbackMn: criterionResult?.feedbackMn ?? null,
              }
            }),
          },
        },
        include: {
          assessor:            { select: { id: true, fullName: true } },
          aiRun:               true,
          criterionResults:    { include: { assignmentCriterion: true } },
          studentResponses:    { orderBy: { createdAt: 'desc' }, take: 1 },
          verificationReviews: true,
          submission: {
            include: {
              assignment: { select: { id: true, title: true } },
              student:    { select: { id: true, fullName: true, email: true } },
              attempts:   { orderBy: { attemptNo: 'desc' }, take: 1, include: { file: true } },
            },
          },
        },
      })

      await tx.aiEvaluationRun.update({
        where: { id: aiRun.id },
        data:  {
          status: AiRunStatus.SUCCEEDED,
          rawResponse: raw,
          parsedResponse: result,
          completedAt: new Date(),
        },
      })

      await tx.submissionAttempt.update({
        where: { id: attempt.id },
        data:  { status: AttemptStatus.EVALUATED },
      })

      await tx.assignmentSubmission.update({
        where: { id: submissionId },
        data:  { status: SubmissionStatus.EVALUATED },
      })

      return ev
    })

    return NextResponse.json(buildApiResponse(evaluationToLegacy(evaluation)), { status: 201 })
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}
