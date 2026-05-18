import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { buildApiResponse, buildErrorResponse } from '@/lib/utils'
import { handleApiError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError } from '@/lib/errors'
import { Role, VerificationRole } from '@prisma/client'
import { z } from 'zod'

function checkAccess(role: Role) {
  if (role !== Role.ADMIN && role !== Role.LEAD_IV) throw new ForbiddenError()
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()
    checkAccess(session.user.role as Role)

    const assignment = await prisma.assignment.findUnique({ where: { id: params.id } })
    if (!assignment) throw new NotFoundError('Даалгавар')

    const verifiers = await prisma.assignmentVerifier.findMany({
      where:   { assignmentId: params.id },
      include: { verifier: { select: { id: true, fullName: true, email: true } } },
      orderBy: { assignedAt: 'asc' },
    })

    return NextResponse.json(buildApiResponse(verifiers))
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}

const addSchema = z.object({ verifierId: z.string().uuid() })

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()
    checkAccess(session.user.role as Role)

    const assignment = await prisma.assignment.findUnique({ where: { id: params.id } })
    if (!assignment) throw new NotFoundError('Даалгавар')

    const body = await req.json()
    const { verifierId } = addSchema.parse(body)

    const verifier = await prisma.user.findUnique({ where: { id: verifierId } })
    if (!verifier) throw new NotFoundError('Хэрэглэгч')
    if (verifier.role !== Role.IV && verifier.role !== Role.TEACHER && verifier.role !== Role.LEAD_IV) {
      throw new ForbiddenError('IV, LEAD_IV эсвэл TEACHER дүртэй хэрэглэгч томилогдож болно')
    }

    const existing = await prisma.assignmentVerifier.findUnique({
      where: { assignmentId_verifierId: { assignmentId: params.id, verifierId } },
    })
    if (existing) throw new ConflictError('Энэ хэрэглэгч аль хэдийн томилогдсон байна')

    const record = await prisma.assignmentVerifier.create({
      data:    {
        assignmentId: params.id,
        verifierId,
        assignedById: session.user.id,
        role: verifier.role === Role.LEAD_IV ? VerificationRole.LEAD_IV : VerificationRole.IV,
      },
      include: { verifier: { select: { id: true, fullName: true, email: true } } },
    })

    return NextResponse.json(buildApiResponse(record), { status: 201 })
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()
    checkAccess(session.user.role as Role)

    const body = await req.json()
    const { verifierId } = addSchema.parse(body)

    await prisma.assignmentVerifier.delete({
      where: { assignmentId_verifierId: { assignmentId: params.id, verifierId } },
    })

    return NextResponse.json(buildApiResponse({ deleted: true }))
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}
