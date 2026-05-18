import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { buildApiResponse, buildErrorResponse } from '@/lib/utils'
import { handleApiError, UnauthorizedError, ForbiddenError, NotFoundError, AppError } from '@/lib/errors'
import { Role, SubmissionStatus } from '@prisma/client'
import { z } from 'zod'
import { submissionToLegacy } from '@/lib/domain/btec-adapters'

const schema = z.object({ reason: z.string().min(10, 'Шалтгааныг дэлгэрэнгүй бичнэ үү') })

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()
    if (session.user.role !== Role.STUDENT) throw new ForbiddenError()

    const submission = await prisma.assignmentSubmission.findUnique({
      where:   { id: params.id },
      include: {
        assignment: { select: { dueAt: true } },
        attempts:   { orderBy: { attemptNo: 'desc' }, take: 1 },
      },
    })
    if (!submission) throw new NotFoundError('Submission')
    if (submission.studentId !== session.user.id) throw new ForbiddenError()
    if (submission.status !== SubmissionStatus.RETURNED) {
      throw new AppError('INVALID_STATUS', 'Үнэлгээ буцаагдаагүй байна')
    }

    if (submission.assignment.dueAt && new Date() > new Date(submission.assignment.dueAt)) {
      throw new AppError('DEADLINE_PASSED', 'Resubmit хүсэх хугацаа дууссан байна')
    }

    const body = await req.json()
    const data = schema.parse(body)

    const updated = await prisma.assignmentSubmission.update({
      where: { id: params.id },
      data:  {
        status: SubmissionStatus.RESUBMIT_REQUESTED,
        resubmissionRequests: {
          create: {
            previousAttemptId: submission.attempts[0]?.id ?? null,
            requestedById: session.user.id,
            reason: data.reason,
          },
        },
      },
    })

    return NextResponse.json(buildApiResponse(submissionToLegacy(updated)))
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}
