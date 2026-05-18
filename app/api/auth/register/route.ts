import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password-utils'
import { registerSchema } from '@/lib/validators'
import { buildApiResponse, buildErrorResponse } from '@/lib/utils'
import { handleApiError, ConflictError } from '@/lib/errors'
import { Role, UserStatus } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = registerSchema.parse(body)

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) throw new ConflictError('Энэ имэйл хаяг бүртгэгдсэн байна')

    const hashed = await hashPassword(data.password)
    const role = (data.role as Role) ?? Role.STUDENT
    const isActive = role === Role.ADMIN || role === Role.LEAD_IV
    const status = isActive ? UserStatus.ACTIVE : UserStatus.PENDING
    const user = await prisma.user.create({
      data: {
        email:    data.email,
        password: hashed,
        fullName: data.fullName,
        role,
        isActive,
        status,
      },
      select: { id: true, email: true, fullName: true, role: true, status: true, isActive: true, createdAt: true },
    })

    return NextResponse.json(buildApiResponse(user), { status: 201 })
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}
