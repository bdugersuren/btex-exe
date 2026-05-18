import {
  AssignmentStatus,
  CriterionDecision,
  CriterionLevel,
  EvaluationStatus,
  SubmissionStatus,
  VerificationDecision,
} from '@prisma/client'
import { CRITERION_PASS_THRESHOLD } from '@/lib/constants'
import { CriterionScore, Rubric, RubricCriterion } from '@/types/models'

type LooseRecord = Record<string, any>

const PUBLISHED_STATUSES = new Set<string>([
  EvaluationStatus.PUBLISHED,
  EvaluationStatus.VERIFIED,
  EvaluationStatus.FINALIZED,
])

function asIso(value: unknown) {
  if (!value) return value
  if (value instanceof Date) return value.toISOString()
  return value
}

export function criterionLevelFromGrade(grade?: string): CriterionLevel {
  if (grade === 'MERIT') return CriterionLevel.MERIT
  if (grade === 'DISTINCTION') return CriterionLevel.DISTINCTION
  return CriterionLevel.PASS
}

export function gradeFromCriterionLevel(level?: string): RubricCriterion['grade'] {
  if (level === CriterionLevel.MERIT) return 'MERIT'
  if (level === CriterionLevel.DISTINCTION) return 'DISTINCTION'
  return 'PASS'
}

export function rubricFromAssignment(assignment: LooseRecord): Rubric {
  const criteria = [...(assignment.criteria ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  if (criteria.length > 0) {
    return {
      criteria: criteria.map((criterion): RubricCriterion => ({
        id:            criterion.id,
        code:          criterion.code,
        description:   criterion.description,
        descriptionMn: criterion.descriptionMn ?? undefined,
        maxScore:      Number(criterion.maxScore ?? 100),
        grade:         gradeFromCriterionLevel(criterion.level),
      })),
    }
  }

  const snapshot = assignment.rubricSnapshot as Rubric | null | undefined
  if (snapshot?.criteria) return snapshot

  return { criteria: [] }
}

export function assignmentCriteriaDataFromRubric(rubric?: Rubric) {
  return (rubric?.criteria ?? []).map((criterion, index) => ({
    code:          criterion.code.trim(),
    level:         criterionLevelFromGrade(criterion.grade),
    title:         null,
    titleMn:       null,
    description:   criterion.description,
    descriptionMn: criterion.descriptionMn || null,
    maxScore:      criterion.maxScore ?? 100,
    passThreshold: CRITERION_PASS_THRESHOLD,
    sortOrder:     index,
    isRequired:    true,
  }))
}

export function legacyAssignmentData(data: LooseRecord, userId: string, canAssignTeacher: boolean) {
  const hasCriteria = (data.rubric?.criteria?.length ?? 0) > 0

  return {
    title:          data.title,
    instructions:   data.description,
    instructionsMn: data.descriptionMn || null,
    dueAt:          data.deadline ? new Date(data.deadline) : null,
    rubricSnapshot: data.rubric ?? { criteria: [] },
    status:         hasCriteria ? AssignmentStatus.PUBLISHED : AssignmentStatus.DRAFT,
    createdById:    userId,
    ownerTeacherId: canAssignTeacher ? data.assignedTeacherId ?? null : undefined,
  }
}

export function legacyAssignmentUpdateData(data: LooseRecord, canAssignTeacher: boolean) {
  const updateData: LooseRecord = {}

  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.instructions = data.description
  if (data.descriptionMn !== undefined) updateData.instructionsMn = data.descriptionMn || null
  if (data.deadline !== undefined) updateData.dueAt = data.deadline ? new Date(data.deadline) : null
  if (data.rubric !== undefined) updateData.rubricSnapshot = data.rubric
  if (canAssignTeacher && data.assignedTeacherId !== undefined) {
    updateData.ownerTeacherId = data.assignedTeacherId ?? null
  }

  return updateData
}

export function assignmentToLegacy(assignment: LooseRecord) {
  const rubric = rubricFromAssignment(assignment)

  return {
    ...assignment,
    description:       assignment.instructions,
    descriptionMn:     assignment.instructionsMn,
    rubric,
    deadline:          asIso(assignment.dueAt),
    createdBy:         assignment.createdById,
    assignedTeacherId: assignment.ownerTeacherId,
    teacher:           assignment.createdBy,
    assignedTeacher:   assignment.ownerTeacher,
    _count: assignment._count
      ? { submissions: assignment._count.submissions ?? 0 }
      : undefined,
  }
}

export function latestAttempt(submission: LooseRecord) {
  const attempts = [...(submission.attempts ?? [])].sort((a, b) => (b.attemptNo ?? 0) - (a.attemptNo ?? 0))
  return attempts[0] ?? submission.attempt ?? null
}

export function filePathForAttempt(attempt: LooseRecord | null | undefined) {
  if (!attempt?.file?.id) return ''
  return `/api/files/${attempt.file.id}`
}

function latestEvaluation(submission: LooseRecord) {
  const evaluations = [...(submission.evaluations ?? [])].sort((a, b) => {
    if ((b.isFinal ? 1 : 0) !== (a.isFinal ? 1 : 0)) return (b.isFinal ? 1 : 0) - (a.isFinal ? 1 : 0)
    if ((b.version ?? 0) !== (a.version ?? 0)) return (b.version ?? 0) - (a.version ?? 0)
    return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  })

  return evaluations[0] ?? null
}

export function submissionToLegacy(submission: LooseRecord, options: { includeEvaluation?: boolean } = {}): LooseRecord {
  const includeEvaluation = options.includeEvaluation ?? true
  const attempt = latestAttempt(submission)
  const evaluation = includeEvaluation ? latestEvaluation(submission) : null
  const { attempts: _attempts, evaluations: _evaluations, ...safeSubmission } = submission

  return {
    ...safeSubmission,
    filePath:         filePathForAttempt(attempt),
    fileName:         attempt?.file?.originalName ?? '',
    fileType:         attempt?.file?.mimeType ?? '',
    attempt:          submission.currentAttemptNo || attempt?.attemptNo || 0,
    resubmitDeadline: asIso(submission.resubmissionDeadlineAt),
    evaluation:       evaluation ? evaluationToLegacy(evaluation, { includeSubmission: false }) : null,
  }
}

export function evaluationToLegacy(evaluation: LooseRecord, options: { includeSubmission?: boolean } = {}): LooseRecord {
  const includeSubmission = options.includeSubmission ?? true
  const {
    attempt: _attempt,
    criterionResults: _criterionResults,
    studentResponses: _studentResponses,
    verificationReviews: _verificationReviews,
    ...safeEvaluation
  } = evaluation
  const reviews = [...(evaluation.verificationReviews ?? [])].sort((a, b) => {
    return new Date(b.reviewedAt ?? b.createdAt ?? 0).getTime() - new Date(a.reviewedAt ?? a.createdAt ?? 0).getTime()
  })
  const approvedReview = reviews.find((review) => review.decision === VerificationDecision.APPROVED)
  const latestStudentResponse = [...(evaluation.studentResponses ?? [])].sort((a, b) => {
    return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  })[0]
  const criterionResults = [...(evaluation.criterionResults ?? [])].sort((a, b) => {
    return (a.assignmentCriterion?.sortOrder ?? 0) - (b.assignmentCriterion?.sortOrder ?? 0)
  })

  const criteriaScores: CriterionScore[] = criterionResults.map((result) => {
    const percentage = Number(result.percentage ?? result.score ?? 0)
    return {
      criterionId: result.assignmentCriterionId,
      code:        result.code,
      score:       percentage,
      maxScore:    Number(result.maxScore ?? result.assignmentCriterion?.maxScore ?? 100),
      passes:      result.decision === CriterionDecision.MET || percentage >= CRITERION_PASS_THRESHOLD,
      feedback:    result.feedback,
      feedbackMn:  result.feedbackMn ?? undefined,
    }
  })

  const isPublished = PUBLISHED_STATUSES.has(evaluation.status)
  const isVerified = evaluation.status === EvaluationStatus.VERIFIED ||
    evaluation.status === EvaluationStatus.FINALIZED ||
    Boolean(approvedReview)

  return {
    ...safeEvaluation,
    evaluatedBy:       evaluation.assessorId,
    evaluator:         evaluation.assessor,
    criteriaScores,
    isPublished,
    studentFeedback:   latestStudentResponse?.message,
    isVerified,
    verifiedBy:        approvedReview?.verifierId ?? null,
    verifiedAt:        asIso(approvedReview?.reviewedAt),
    verifierNote:      approvedReview?.note ?? null,
    rawGeminiResponse: evaluation.aiRun?.rawResponse,
    submission: includeSubmission && evaluation.submission
      ? submissionToLegacy(evaluation.submission, { includeEvaluation: false })
      : evaluation.submission,
  }
}

export function decisionFromPercentage(percentage?: number | null): CriterionDecision {
  if (percentage == null) return CriterionDecision.NOT_ASSESSED
  if (percentage >= CRITERION_PASS_THRESHOLD) return CriterionDecision.MET
  if (percentage >= 50) return CriterionDecision.PARTIALLY_MET
  return CriterionDecision.NOT_MET
}

export function submissionStatusAfterUpload(attemptNo: number): SubmissionStatus {
  return attemptNo > 1 ? SubmissionStatus.RESUBMITTED : SubmissionStatus.PENDING
}

export function safeFileStorageKey(userId: string, fileName: string) {
  return `submissions/${userId}/${fileName}`
}
