import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { buildApiResponse, buildErrorResponse } from '@/lib/utils'
import { handleApiError, UnauthorizedError, NotFoundError, ForbiddenError, AppError } from '@/lib/errors'
import { ResubmissionRequestStatus, Role, SubmissionStatus } from '@prisma/client'
import { z } from 'zod'
import { RESUBMIT_WINDOW_DAYS } from '@/lib/constants'
import { submissionToLegacy } from '@/lib/domain/btec-adapters'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()

    const submission = await prisma.assignmentSubmission.findUnique({
      where:   { id: params.id },
      include: {
        assignment: {
          include: {
            criteria: { orderBy: { sortOrder: 'asc' } },
          },
        },
        student: { select: { id: true, fullName: true, email: true } },
        attempts: {
          orderBy: { attemptNo: 'desc' },
          take:    1,
          include: { file: true },
        },
        evaluations: {
          orderBy: [{ isFinal: 'desc' }, { version: 'desc' }],
          take:    1,
          include: {
            assessor:            { select: { id: true, fullName: true } },
            criterionResults:    { include: { assignmentCriterion: true } },
            studentResponses:    { orderBy: { createdAt: 'desc' }, take: 1 },
            verificationReviews: true,
            aiRun:               true,
          },
        },
      },
    })
    if (!submission) throw new NotFoundError('Submission')

    if (session.user.role === Role.STUDENT && submission.studentId !== session.user.id) {
      throw new ForbiddenError()
    }

    return NextResponse.json(buildApiResponse(submissionToLegacy(submission)))
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}

const patchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve-resubmit'), deadlineDays: z.number().min(1).max(30).default(7) }),
  z.object({ action: z.literal('reject-resubmit'), reason: z.string().optional() }),
])

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()
    if (session.user.role === Role.STUDENT) throw new ForbiddenError()

    const submission = await prisma.assignmentSubmission.findUnique({
      where:   { id: params.id },
      include: {
        assignment: { select: { createdById: true, ownerTeacherId: true } },
        attempts:   { orderBy: { attemptNo: 'desc' }, take: 1 },
      },
    })
    if (!submission) throw new NotFoundError('Submission')
    if (
      session.user.role === Role.TEACHER &&
      submission.assignment.createdById !== session.user.id &&
      submission.assignment.ownerTeacherId !== session.user.id
    ) {
      throw new ForbiddenError()
    }

    const body = await req.json()
    const data = patchSchema.parse(body)

    if (data.action === 'approve-resubmit') {
      if (submission.status !== SubmissionStatus.RESUBMIT_REQUESTED) {
        throw new AppError('INVALID_STATUS', 'Resubmit хүсэлт байхгүй байна')
      }
      const deadline = new Date()
      deadline.setDate(deadline.getDate() + (data.deadlineDays ?? RESUBMIT_WINDOW_DAYS))

      const updated = await prisma.assignmentSubmission.update({
        where: { id: params.id },
        data:  {
          status: SubmissionStatus.RESUBMIT_APPROVED,
          resubmissionDeadlineAt: deadline,
          resubmissionRequests: {
            updateMany: {
              where: { status: ResubmissionRequestStatus.PENDING },
              data: {
                status: ResubmissionRequestStatus.APPROVED,
                deadlineAt: deadline,
                decidedById: session.user.id,
                decidedAt: new Date(),
              },
            },
          },
        },
      })
      return NextResponse.json(buildApiResponse(submissionToLegacy(updated)))
    }

    if (data.action === 'reject-resubmit') {
      if (submission.status !== SubmissionStatus.RESUBMIT_REQUESTED) {
        throw new AppError('INVALID_STATUS', 'Resubmit хүсэлт байхгүй байна')
      }
      const updated = await prisma.assignmentSubmission.update({
        where: { id: params.id },
        data:  {
          status: SubmissionStatus.RETURNED,
          resubmissionRequests: {
            updateMany: {
              where: { status: ResubmissionRequestStatus.PENDING },
              data: {
                status: ResubmissionRequestStatus.REJECTED,
                decisionNote: data.reason ?? null,
                decidedById: session.user.id,
                decidedAt: new Date(),
              },
            },
          },
        },
      })
      return NextResponse.json(buildApiResponse(submissionToLegacy(updated)))
    }

    throw new AppError('INVALID_ACTION', 'Үл мэдэгдэх үйлдэл')
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}
