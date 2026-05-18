import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { buildApiResponse, buildErrorResponse } from '@/lib/utils'
import { handleApiError, UnauthorizedError, ForbiddenError, NotFoundError, AppError } from '@/lib/errors'
import { EvaluationStatus, Role, VerificationDecision, VerificationRole } from '@prisma/client'
import { z } from 'zod'
import { evaluationToLegacy } from '@/lib/domain/btec-adapters'

const verifySchema = z.object({
  note: z.string().max(1000).optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()
    const r = session.user.role as Role
    if (r === Role.STUDENT || r === Role.ADMIN || r === Role.LEAD_IV) {
      throw new ForbiddenError('Баталгаажуулагчаар томилогдсон хэрэглэгч л баталгаажуулах боломжтой')
    }

    const evaluation = await prisma.evaluation.findUnique({
      where:   { id: params.id },
      include: { submission: { select: { assignmentId: true } } },
    })
    if (!evaluation) throw new NotFoundError('Үнэлгээ')
    if (evaluation.status !== EvaluationStatus.PUBLISHED) {
      throw new AppError('NOT_PUBLISHED', 'Нийтлэгдсэн үнэлгээг л баталгаажуулах боломжтой')
    }

    const assigned = await prisma.assignmentVerifier.findUnique({
      where: {
        assignmentId_verifierId: {
          assignmentId: evaluation.submission.assignmentId,
          verifierId:   session.user.id,
        },
      },
    })
    if (!assigned) throw new ForbiddenError('Энэ даалгаварын IV биш байна')

    const body = await req.json()
    const { note } = verifySchema.parse(body)

    const updated = await prisma.evaluation.update({
      where: { id: params.id },
      data:  {
        status: EvaluationStatus.VERIFIED,
        verificationReviews: {
          upsert: {
            where: {
              evaluationId_verifierId_role: {
                evaluationId: params.id,
                verifierId: session.user.id,
                role: VerificationRole.IV,
              },
            },
            create: {
              assignmentId: evaluation.submission.assignmentId,
              verifierId: session.user.id,
              assignmentVerifierId: assigned.id,
              role: VerificationRole.IV,
              decision: VerificationDecision.APPROVED,
              note: note ?? null,
              reviewedAt: new Date(),
            },
            update: {
              decision: VerificationDecision.APPROVED,
              note: note ?? null,
              reviewedAt: new Date(),
            },
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
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}
