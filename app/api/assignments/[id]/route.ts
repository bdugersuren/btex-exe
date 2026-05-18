import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { assignmentSchema } from '@/lib/validators'
import { buildApiResponse, buildErrorResponse } from '@/lib/utils'
import { handleApiError, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors'
import { AssignmentStatus, Role } from '@prisma/client'
import {
  assignmentCriteriaDataFromRubric,
  assignmentToLegacy,
  legacyAssignmentUpdateData,
} from '@/lib/domain/btec-adapters'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()

    const assignment = await prisma.assignment.findUnique({
      where:   { id: params.id },
      include: {
        createdBy:    { select: { id: true, fullName: true, email: true } },
        ownerTeacher: { select: { id: true, fullName: true, email: true } },
        criteria:     { orderBy: { sortOrder: 'asc' } },
      },
    })
    if (!assignment) throw new NotFoundError('Даалгавар')

    return NextResponse.json(buildApiResponse(assignmentToLegacy(assignment)))
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()
    const r = session.user.role as Role
    if (r === Role.STUDENT || r === Role.IV) throw new ForbiddenError()

    const assignment = await prisma.assignment.findUnique({ where: { id: params.id } })
    if (!assignment) throw new NotFoundError('Даалгавар')

    // ADMIN and LEAD_IV can update any assignment
    // TEACHER can update if they created it or are assigned to manage it
    const isAdmin   = r === Role.ADMIN
    const isLeadIv  = r === Role.LEAD_IV
    const isCreator = assignment.createdById === session.user.id
    const isAssigned = assignment.ownerTeacherId === session.user.id

    if (!isAdmin && !isLeadIv && !isCreator && !isAssigned) {
      throw new ForbiddenError()
    }

    const body = await req.json()
    const data = assignmentSchema.partial().parse(body)
    const canAssignTeacher = isAdmin || isLeadIv

    const updateData = legacyAssignmentUpdateData(data, canAssignTeacher)
    const criteria = data.rubric ? assignmentCriteriaDataFromRubric(data.rubric) : null
    if (criteria && criteria.length > 0) updateData.status = AssignmentStatus.PUBLISHED

    const updated = await prisma.assignment.update({
      where:   { id: params.id },
      data:    {
        ...updateData,
        criteria: criteria
          ? {
              deleteMany: {},
              create: criteria,
            }
          : undefined,
      },
      include: {
        createdBy:    { select: { id: true, fullName: true, email: true } },
        ownerTeacher: { select: { id: true, fullName: true, email: true } },
        criteria:     { orderBy: { sortOrder: 'asc' } },
      },
    })

    return NextResponse.json(buildApiResponse(assignmentToLegacy(updated)))
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()
    const r = session.user.role as Role
    if (r === Role.STUDENT || r === Role.IV || r === Role.LEAD_IV) throw new ForbiddenError()

    const assignment = await prisma.assignment.findUnique({ where: { id: params.id } })
    if (!assignment) throw new NotFoundError('Даалгавар')
    if (assignment.createdById !== session.user.id && r !== Role.ADMIN) {
      throw new ForbiddenError()
    }

    await prisma.assignment.delete({ where: { id: params.id } })

    return NextResponse.json(buildApiResponse({ deleted: true }))
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}
