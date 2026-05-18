import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { assignmentSchema, paginationSchema } from '@/lib/validators'
import { buildApiResponse, buildErrorResponse } from '@/lib/utils'
import { handleApiError, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { AssignmentStatus, Prisma, Role } from '@prisma/client'
import {
  assignmentCriteriaDataFromRubric,
  assignmentToLegacy,
  legacyAssignmentData,
} from '@/lib/domain/btec-adapters'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()

    const { searchParams } = new URL(req.url)
    const { page, limit } = paginationSchema.parse({
      page:  searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    const r = session.user.role as Role
    const uid = session.user.id

    // TEACHER sees assignments they created OR are assigned to manage
    // IV sees assignments they are verifier for
    // ADMIN, LEAD_IV see everything
    // STUDENT sees published assignments they can submit
    const where: Prisma.AssignmentWhereInput =
      r === Role.TEACHER
        ? { OR: [{ createdById: uid }, { ownerTeacherId: uid }] }
        : r === Role.IV
          ? { verifiers: { some: { verifierId: uid } } }
          : r === Role.STUDENT
            ? { status: AssignmentStatus.PUBLISHED }
            : {}

    const [items, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy:    { select: { id: true, fullName: true, email: true } },
          ownerTeacher: { select: { id: true, fullName: true, email: true } },
          criteria:     { orderBy: { sortOrder: 'asc' } },
          _count:       { select: { submissions: true } },
        },
      }),
      prisma.assignment.count({ where }),
    ])

    return NextResponse.json(buildApiResponse({
      items: items.map((a) => assignmentToLegacy(a)),
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()
    const r = session.user.role as Role
    if (r === Role.STUDENT || r === Role.IV) throw new ForbiddenError()

    const body = await req.json()
    const data = assignmentSchema.parse(body)
    const criteria = assignmentCriteriaDataFromRubric(data.rubric)

    const assignment = await prisma.assignment.create({
      data: {
        ...legacyAssignmentData(data, session.user.id, r === Role.ADMIN || r === Role.LEAD_IV),
        criteria: criteria.length ? { create: criteria } : undefined,
      },
      include: {
        createdBy:    { select: { id: true, fullName: true, email: true } },
        ownerTeacher: { select: { id: true, fullName: true, email: true } },
        criteria:     { orderBy: { sortOrder: 'asc' } },
        _count:       { select: { submissions: true } },
      },
    })

    return NextResponse.json(buildApiResponse(assignmentToLegacy(assignment)), { status: 201 })
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}
