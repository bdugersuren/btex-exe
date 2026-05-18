import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { buildApiResponse, buildErrorResponse } from '@/lib/utils'
import { handleApiError, UnauthorizedError } from '@/lib/errors'
import { paginationSchema } from '@/lib/validators'
import { EvaluationStatus, Prisma, Role } from '@prisma/client'
import { evaluationToLegacy } from '@/lib/domain/btec-adapters'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()

    const { searchParams } = new URL(req.url)
    const { page, limit } = paginationSchema.parse({
      page:  searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    const verifierMode = searchParams.get('verifier') === '1'
    const r   = session.user.role as Role
    const uid = session.user.id

    const verifierFilter: Prisma.EvaluationWhereInput = {
      submission: { assignment: { verifiers: { some: { verifierId: uid, isActive: true } } } },
    }
    const publishedFilter: Prisma.EvaluationWhereInput = {
      status: { in: [EvaluationStatus.PUBLISHED, EvaluationStatus.VERIFIED, EvaluationStatus.FINALIZED] },
    }

    const where: Prisma.EvaluationWhereInput =
      r === Role.STUDENT
        ? { submission: { studentId: uid }, ...publishedFilter }
        : r === Role.TEACHER
          ? verifierMode
            ? verifierFilter  // TEACHER acting as verifier — see evaluations on their assigned units
            : { assessorId: uid }
          : r === Role.IV
            ? verifierFilter
            : {}  // ADMIN, LEAD_IV → бүгдийг харна

    const [items, total] = await Promise.all([
      prisma.evaluation.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assessor:  { select: { id: true, fullName: true } },
          criterionResults:    { include: { assignmentCriterion: true } },
          studentResponses:    { orderBy: { createdAt: 'desc' }, take: 1 },
          verificationReviews: true,
          aiRun:               true,
          submission: {
            include: {
              student:    { select: { id: true, fullName: true } },
              assignment: { select: { id: true, title: true } },
              attempts:   { orderBy: { attemptNo: 'desc' }, take: 1, include: { file: true } },
            },
          },
        },
      }),
      prisma.evaluation.count({ where }),
    ])

    return NextResponse.json(buildApiResponse({
      items: items.map((e) => evaluationToLegacy(e)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }))
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}
