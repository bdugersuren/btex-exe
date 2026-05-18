import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { buildApiResponse, buildErrorResponse } from '@/lib/utils'
import { handleApiError, UnauthorizedError, ForbiddenError, ConflictError } from '@/lib/errors'
import { hashPassword } from '@/lib/auth/password-utils'
import { paginationSchema } from '@/lib/validators'
import { Role, UserStatus } from '@prisma/client'
import { z } from 'zod'

const MANAGEABLE_ROLES = [Role.TEACHER, Role.STUDENT, Role.IV]

function checkAccess(role: Role) {
  if (role !== Role.ADMIN && role !== Role.LEAD_IV) throw new ForbiddenError()
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()
    checkAccess(session.user.role as Role)

    const { searchParams } = new URL(req.url)
    const { page, limit } = paginationSchema.parse({
      page:  searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    const roleFilter = searchParams.get('role') as Role | null
    const where = roleFilter && (MANAGEABLE_ROLES as Role[]).includes(roleFilter)
      ? { role: roleFilter }
      : { role: { in: MANAGEABLE_ROLES } }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        select:  { id: true, fullName: true, email: true, role: true, status: true, isActive: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json(buildApiResponse({ items, total, page, limit, totalPages: Math.ceil(total / limit) }))
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}

const createSchema = z.object({
  fullName: z.string().min(2, 'Нэр хамгийн багадаа 2 тэмдэгт байх ёстой'),
  email:    z.string().email('Имэйл хаяг буруу байна'),
  password: z.string().min(8, 'Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой'),
  role:     z.enum(['TEACHER', 'STUDENT', 'IV']),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()
    checkAccess(session.user.role as Role)

    const body = await req.json()
    const data = createSchema.parse(body)

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) throw new ConflictError('Энэ имэйл хаяг аль хэдийн бүртгэгдсэн байна')

    const hashed   = await hashPassword(data.password)
    const isActive = data.role === Role.IV  // IV нэн даруй идэвхтэй, TEACHER/STUDENT эрх хүлээнэ
    const status   = isActive ? UserStatus.ACTIVE : UserStatus.PENDING

    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email:    data.email,
        password: hashed,
        role:     data.role as Role,
        isActive,
        status,
      },
      select: { id: true, fullName: true, email: true, role: true, status: true, isActive: true, createdAt: true },
    })

    return NextResponse.json(buildApiResponse(user), { status: 201 })
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}
