import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { buildApiResponse, buildErrorResponse } from '@/lib/utils'
import { handleApiError, UnauthorizedError, NotFoundError, ForbiddenError } from '@/lib/errors'
import { EvaluationStatus, Prisma, Role, StudentResponseType } from '@prisma/client'
import { z } from 'zod'
import { evaluationToLegacy } from '@/lib/domain/btec-adapters'

const updateSchema = z.object({
  feedback:        z.string().optional(),
  strengths:       z.array(z.string()).optional(),
  improvements:    z.array(z.string()).optional(),
  isPublished:     z.boolean().optional(),
  studentFeedback: z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()

    const evaluation = await prisma.evaluation.findUnique({
      where:   { id: params.id },
      include: {
        assessor:  { select: { id: true, fullName: true } },
        criterionResults:    { include: { assignmentCriterion: true } },
        studentResponses:    { orderBy: { createdAt: 'desc' }, take: 1 },
        verificationReviews: true,
        aiRun:               true,
        submission: {
          include: {
            student:    { select: { id: true, fullName: true, email: true } },
            assignment: {
              include: {
                criteria: { orderBy: { sortOrder: 'asc' } },
              },
            },
            attempts: { orderBy: { attemptNo: 'desc' }, take: 1, include: { file: true } },
          },
        },
      },
    })
    if (!evaluation) throw new NotFoundError('Үнэлгээ')

    if (session.user.role === Role.STUDENT) {
      if (evaluation.submission.studentId !== session.user.id) throw new ForbiddenError()
      const visibleStatuses: EvaluationStatus[] = [EvaluationStatus.PUBLISHED, EvaluationStatus.VERIFIED, EvaluationStatus.FINALIZED]
      if (!visibleStatuses.includes(evaluation.status)) {
        throw new ForbiddenError('Үнэлгээ нийтлэгдээгүй байна')
      }
    }

    if (session.user.role === Role.IV) {
      const assigned = await prisma.assignmentVerifier.findUnique({
        where: {
          assignmentId_verifierId: {
            assignmentId: evaluation.submission.assignmentId,
            verifierId:   session.user.id,
          },
        },
      })
      if (!assigned) throw new ForbiddenError()
    }
    // LEAD_IV: харах боломжтой, isPublished шаардахгүй

    return NextResponse.json(buildApiResponse(evaluationToLegacy(evaluation)))
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: params.id },
      include: { submission: { select: { studentId: true } } },
    })
    if (!evaluation) throw new NotFoundError('Үнэлгээ')

    const body = await req.json()
    const data = updateSchema.parse(body)

    if (session.user.role === Role.STUDENT) {
      if (data.studentFeedback === undefined) throw new ForbiddenError()
      if (evaluation.submission.studentId !== session.user.id) throw new ForbiddenError()
      const updated = await prisma.evaluation.update({
        where: { id: params.id },
        data:  {
          studentResponses: {
            create: {
              studentId: session.user.id,
              type: StudentResponseType.COMMENT,
              message: data.studentFeedback,
            },
          },
        },
        include: {
          assessor:            { select: { id: true, fullName: true } },
          criterionResults:    { include: { assignmentCriterion: true } },
          studentResponses:    { orderBy: { createdAt: 'desc' }, take: 1 },
          verificationReviews: true,
          aiRun:               true,
        },
      })
      return NextResponse.json(buildApiResponse(evaluationToLegacy(updated)))
    }

    if (session.user.role === Role.LEAD_IV || session.user.role === Role.IV) throw new ForbiddenError()
    if (session.user.role === Role.TEACHER && evaluation.assessorId !== session.user.id) {
      throw new ForbiddenError()
    }

    const updateData: Prisma.EvaluationUpdateInput = {}
    if (data.feedback !== undefined) updateData.feedback = data.feedback
    if (data.strengths !== undefined) updateData.strengths = data.strengths
    if (data.improvements !== undefined) updateData.improvements = data.improvements
    if (data.isPublished !== undefined) {
      updateData.status = data.isPublished ? EvaluationStatus.PUBLISHED : EvaluationStatus.DRAFT
      updateData.publishedAt = data.isPublished ? new Date() : null
    }

    const updated = await prisma.evaluation.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assessor:            { select: { id: true, fullName: true } },
        criterionResults:    { include: { assignmentCriterion: true } },
        studentResponses:    { orderBy: { createdAt: 'desc' }, take: 1 },
        verificationReviews: true,
        aiRun:               true,
      },
    })

    return NextResponse.json(buildApiResponse(evaluationToLegacy(updated)))
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}
