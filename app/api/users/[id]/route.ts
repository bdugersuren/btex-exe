import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { buildApiResponse, buildErrorResponse } from '@/lib/utils'
import { handleApiError, UnauthorizedError, ForbiddenError, NotFoundError, AppError } from '@/lib/errors'
import { Role, UserStatus } from '@prisma/client'
import { z } from 'zod'

function checkAccess(role: Role) {
  if (role !== Role.ADMIN && role !== Role.LEAD_IV) throw new ForbiddenError()
}

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  role:     z.enum(['TEACHER', 'STUDENT', 'IV']).optional(),
}).refine((d) => d.isActive !== undefined || d.role !== undefined, {
  message: 'isActive эсвэл role-ийн аль нэгийг оруулна уу',
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()
    checkAccess(session.user.role as Role)

    if (params.id === session.user.id) {
      throw new AppError('SELF_MODIFY', 'Өөрийн эрхийг өөрчлөх боломжгүй')
    }

    const target = await prisma.user.findUnique({
      where:  { id: params.id },
      select: { id: true, role: true },
    })
    if (!target) throw new NotFoundError('Хэрэглэгч')
    if (target.role === Role.ADMIN || target.role === Role.LEAD_IV) {
      throw new ForbiddenError('ADMIN болон LEAD_IV-ийн эрхийг өөрчлөх боломжгүй')
    }

    const body = await req.json()
    const data = patchSchema.parse(body)

    const updated = await prisma.user.update({
      where:  { id: params.id },
      data:   {
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isActive !== undefined && { status: data.isActive ? UserStatus.ACTIVE : UserStatus.DISABLED }),
        ...(data.role     !== undefined && { role: data.role as Role }),
      },
      select: { id: true, fullName: true, email: true, role: true, status: true, isActive: true },
    })

    return NextResponse.json(buildApiResponse(updated))
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}
