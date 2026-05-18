import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { buildApiResponse, buildErrorResponse } from '@/lib/utils'
import { handleApiError, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors'
import { EvaluationStatus, Role, SubmissionStatus } from '@prisma/client'
import { evaluationToLegacy } from '@/lib/domain/btec-adapters'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()
    if (session.user.role === Role.STUDENT) throw new ForbiddenError()

    const evaluation = await prisma.evaluation.findUnique({ where: { id: params.id } })
    if (!evaluation) throw new NotFoundError('Үнэлгээ')
    if (session.user.role === Role.TEACHER && evaluation.assessorId !== session.user.id) {
      throw new ForbiddenError()
    }

    const [, updated] = await prisma.$transaction([
      prisma.evaluation.updateMany({
        where: {
          submissionId: evaluation.submissionId,
          id: { not: params.id },
        },
        data: { isFinal: false },
      }),
      prisma.evaluation.update({
        where: { id: params.id },
        data:  {
          status: EvaluationStatus.PUBLISHED,
          isFinal: true,
          publishedAt: new Date(),
        },
        include: {
          assessor:            { select: { id: true, fullName: true } },
          criterionResults:    { include: { assignmentCriterion: true } },
          studentResponses:    { orderBy: { createdAt: 'desc' }, take: 1 },
          verificationReviews: true,
          aiRun:               true,
        },
      }),
      prisma.assignmentSubmission.update({
        where: { id: evaluation.submissionId },
        data:  { status: SubmissionStatus.RETURNED },
      }),
    ])

    return NextResponse.json(buildApiResponse(evaluationToLegacy(updated)))
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}
