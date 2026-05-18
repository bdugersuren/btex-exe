import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { buildApiResponse, buildErrorResponse } from '@/lib/utils'
import { handleApiError, UnauthorizedError, ForbiddenError, AppError } from '@/lib/errors'
import { paginationSchema } from '@/lib/validators'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/constants'
import { FileVisibility, Prisma, Role, SubmissionStatus } from '@prisma/client'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { createHash } from 'crypto'
import {
  safeFileStorageKey,
  submissionStatusAfterUpload,
  submissionToLegacy,
} from '@/lib/domain/btec-adapters'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw new UnauthorizedError()

    const { searchParams } = new URL(req.url)
    const { page, limit } = paginationSchema.parse({
      page:  searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    const assignmentId = searchParams.get('assignmentId')

    const assignmentFilter = assignmentId ? { assignmentId } : {}
    const where: Prisma.AssignmentSubmissionWhereInput = session.user.role === Role.STUDENT
      ? { studentId: session.user.id, ...assignmentFilter }
      : session.user.role === Role.TEACHER
        ? { assignment: { OR: [{ createdById: session.user.id }, { ownerTeacherId: session.user.id }] }, ...assignmentFilter }
        : session.user.role === Role.IV
          ? { assignment: { verifiers: { some: { verifierId: session.user.id } } }, ...assignmentFilter }
          : assignmentFilter  // ADMIN, LEAD_IV → бүгдийг харна

    const [items, total] = await Promise.all([
      prisma.assignmentSubmission.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignment: { select: { id: true, title: true } },
          student:    { select: { id: true, fullName: true, email: true } },
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
      }),
      prisma.assignmentSubmission.count({ where }),
    ])

    return NextResponse.json(buildApiResponse({
      items: items.map((s) => submissionToLegacy(s)),
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
    if (session.user.role !== Role.STUDENT) throw new ForbiddenError('Зөвхөн сурагч тайлан илгээх боломжтой')

    // Session-д байгаа user ID-г DB-д шалгана (truncate/re-seed-ийн дараа хуучирсан байж болно)
    const userExists = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } })
    if (!userExists) throw new UnauthorizedError('Сессийн мэдээлэл хуучирсан байна. Дахин нэвтэрнэ үү.')

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const assignmentId = formData.get('assignmentId') as string | null

    if (!file || !assignmentId) throw new AppError('VALIDATION_ERROR', 'Файл болон даалгаварын ID шаардлагатай')
    if (!ALLOWED_FILE_TYPES.includes(file.type)) throw new AppError('INVALID_FILE_TYPE', 'PDF, DOCX, TXT файл зөвхөн зөвшөөрөгдөнө')
    if (file.size > MAX_FILE_SIZE) throw new AppError('FILE_TOO_LARGE', 'Файлын хэмжээ 10MB-аас хэтрэх боломжгүй')

    const assignment = await prisma.assignment.findUnique({
      where:  { id: assignmentId },
      select: { id: true, dueAt: true, maxAttempts: true },
    })
    if (!assignment) throw new AppError('ASSIGNMENT_NOT_FOUND', 'Даалгавар олдсонгүй')

    const existing = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: session.user.id,
        },
      },
      include: {
        attempts: { orderBy: { attemptNo: 'desc' }, take: 1 },
      },
    })

    if (assignment.dueAt && !existing && new Date() > assignment.dueAt) {
      throw new AppError('DEADLINE_PASSED', 'Даалгавар илгээх хугацаа дууссан байна')
    }

    // Block if already submitted and not approved for resubmit
    if (existing && existing.status !== SubmissionStatus.RESUBMIT_APPROVED) {
      throw new AppError('ALREADY_SUBMITTED', 'Та энэ даалгаварт аль хэдийн тайлан илгээсэн байна')
    }

    // Check resubmit deadline
    if (existing?.status === SubmissionStatus.RESUBMIT_APPROVED && existing.resubmissionDeadlineAt) {
      if (new Date() > new Date(existing.resubmissionDeadlineAt)) {
        throw new AppError('DEADLINE_PASSED', 'Resubmit илгээх хугацаа дууссан байна')
      }
    }

    const attemptNo = (existing?.currentAttemptNo ?? 0) + 1
    if (attemptNo > assignment.maxAttempts) {
      throw new AppError('MAX_ATTEMPTS_REACHED', 'Энэ даалгаврын оролдлогын дээд хязгаарт хүрсэн байна')
    }

    const ext = path.extname(file.name).toLowerCase()
    const fileName = `${uuidv4()}${ext || '.bin'}`
    const storageKey = safeFileStorageKey(session.user.id, fileName)
    const uploadDir = path.join(process.cwd(), 'storage', 'submissions', session.user.id)
    await mkdir(uploadDir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    const checksumSha256 = createHash('sha256').update(buffer).digest('hex')
    const filePath = path.join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    const submission = await prisma.$transaction(async (tx) => {
      const fileAsset = await tx.fileAsset.create({
        data: {
          storageKey,
          originalName: file.name,
          mimeType: file.type,
          extension: ext,
          sizeBytes: BigInt(file.size),
          checksumSha256,
          visibility: FileVisibility.PRIVATE,
          uploadedById: session.user.id,
        },
      })

      const savedSubmission = await tx.assignmentSubmission.upsert({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId: session.user.id,
          },
        },
        update: {
          status: submissionStatusAfterUpload(attemptNo),
          currentAttemptNo: attemptNo,
          resubmissionDeadlineAt: null,
          attempts: {
            create: {
              attemptNo,
              fileId: fileAsset.id,
              uploadedById: session.user.id,
            },
          },
        },
        create: {
          assignmentId,
          studentId: session.user.id,
          status: SubmissionStatus.PENDING,
          currentAttemptNo: attemptNo,
          attempts: {
            create: {
              attemptNo,
              fileId: fileAsset.id,
              uploadedById: session.user.id,
            },
          },
        },
        include: {
          assignment: { select: { id: true, title: true } },
          student:    { select: { id: true, fullName: true, email: true } },
          attempts: {
            orderBy: { attemptNo: 'desc' },
            take:    1,
            include: { file: true },
          },
          evaluations: true,
        },
      })

      return savedSubmission
    })

    return NextResponse.json(buildApiResponse(submissionToLegacy(submission)), { status: 201 })
  } catch (error) {
    const { code, message, statusCode } = handleApiError(error)
    return NextResponse.json(buildErrorResponse(code, message), { status: statusCode })
  }
}
