import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createReadStream } from 'fs'
import { Readable } from 'stream'
import path from 'path'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { buildErrorResponse } from '@/lib/utils'
import { handleApiError, ForbiddenError, NotFoundError, UnauthorizedError } from '@/lib/errors'
import { Role } from '@prisma/client'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()

    const file = await prisma.fileAsset.findUnique({
      where: { id: params.id },
      include: {
        submissionAttempt: {
          include: {
            submission: {
              include: {
                assignment: {
                  include: {
                    verifiers: {
                      where: { isActive: true },
                      select: { verifierId: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
    if (!file || file.deletedAt) throw new NotFoundError('Файл')

    const role = session.user.role as Role
    const uid = session.user.id
    const submission = file.submissionAttempt?.submission
    const assignment = submission?.assignment
    const canRead =
      role === Role.ADMIN ||
      role === Role.LEAD_IV ||
      file.uploadedById === uid ||
      submission?.studentId === uid ||
      assignment?.createdById === uid ||
      assignment?.ownerTeacherId === uid ||
      Boolean(assignment?.verifiers.some((verifier) => verifier.verifierId === uid))

    if (!canRead) throw new ForbiddenError()

    const storageRoot = path.resolve(process.cwd(), 'storage')
    const absolutePath = path.resolve(storageRoot, file.storageKey)
    if (!absolutePath.startsWith(`${storageRoot}${path.sep}`)) throw new NotFoundError('Файл')

    const nodeStream = createReadStream(absolutePath)
    const webStream = Readable.toWeb(nodeStream) as ReadableStream

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName)}"`,
        'Content-Length': file.sizeBytes.toString(),
        'Cache-Control': 'private, max-age=60',
      },
    })
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}
