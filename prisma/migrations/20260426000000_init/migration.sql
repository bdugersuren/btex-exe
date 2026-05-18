-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'LEAD_IV', 'IV', 'TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DISABLED');

-- CreateEnum
CREATE TYPE "CriterionLevel" AS ENUM ('PASS', 'MERIT', 'DISTINCTION');

-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('UNGRADED', 'U', 'PASS', 'MERIT', 'DISTINCTION', 'A_STAR', 'A', 'B', 'C', 'D', 'E');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'SUBMITTED', 'EVALUATING', 'EVALUATED', 'RETURNED', 'RESUBMIT_REQUESTED', 'RESUBMIT_APPROVED', 'RESUBMITTED', 'FINALIZED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('UPLOADED', 'TEXT_EXTRACTED', 'EXTRACTION_FAILED', 'EVALUATING', 'EVALUATED', 'RETURNED', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EvaluationSource" AS ENUM ('AI', 'TEACHER', 'HYBRID');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('DRAFT', 'READY_FOR_REVIEW', 'PUBLISHED', 'CHANGES_REQUESTED', 'VERIFIED', 'FINALIZED', 'VOID');

-- CreateEnum
CREATE TYPE "CriterionDecision" AS ENUM ('NOT_ASSESSED', 'NOT_MET', 'PARTIALLY_MET', 'MET');

-- CreateEnum
CREATE TYPE "AiRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ResubmissionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VerificationRole" AS ENUM ('IV', 'LEAD_IV');

-- CreateEnum
CREATE TYPE "VerificationDecision" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "StudentResponseType" AS ENUM ('COMMENT', 'QUESTION', 'RESUBMISSION_REQUEST', 'APPEAL');

-- CreateEnum
CREATE TYPE "FileVisibility" AS ENUM ('PRIVATE', 'INTERNAL', 'PUBLIC');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ASSIGNMENT_BRIEF', 'SUBMISSION_RECEIPT', 'ASSESSMENT_RECORD', 'IV_RECORD', 'LEAD_IV_RECORD', 'FEEDBACK_REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'GENERATED', 'SIGNED', 'VOID');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'REGISTER', 'ACTIVATE_USER', 'ASSIGN_ROLE', 'PUBLISH_ASSIGNMENT', 'UPLOAD_SUBMISSION', 'EXTRACT_TEXT', 'RUN_AI_EVALUATION', 'SAVE_EVALUATION', 'PUBLISH_EVALUATION', 'STUDENT_RESPONSE', 'REQUEST_RESUBMISSION', 'DECIDE_RESUBMISSION', 'VERIFY_EVALUATION', 'GENERATE_DOCUMENT', 'SIGN_DOCUMENT', 'DOWNLOAD_FILE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameMn" TEXT,
    "level" TEXT,
    "awardingBody" TEXT NOT NULL DEFAULT 'Pearson',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohorts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "programId" TEXT,
    "academicYearId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_memberships" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "cohort_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "programId" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleMn" TEXT,
    "description" TEXT,
    "descriptionMn" TEXT,
    "guidedLearningHours" INTEGER,
    "credits" INTEGER,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_aims" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleMn" TEXT,
    "description" TEXT,
    "descriptionMn" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_aims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_criteria" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "learningAimId" TEXT,
    "code" TEXT NOT NULL,
    "level" "CriterionLevel" NOT NULL,
    "title" TEXT,
    "titleMn" TEXT,
    "description" TEXT NOT NULL,
    "descriptionMn" TEXT,
    "commandVerb" TEXT,
    "maxScore" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "unitId" TEXT,
    "cohortId" TEXT,
    "academicYearId" TEXT,
    "title" TEXT NOT NULL,
    "titleMn" TEXT,
    "scenario" TEXT,
    "scenarioMn" TEXT,
    "instructions" TEXT NOT NULL,
    "instructionsMn" TEXT,
    "issueDate" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "resubmissionWindowDays" INTEGER NOT NULL DEFAULT 7,
    "maxAttempts" INTEGER NOT NULL DEFAULT 2,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'DRAFT',
    "rubricSnapshot" JSONB,
    "createdById" TEXT NOT NULL,
    "ownerTeacherId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_tasks" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleMn" TEXT,
    "instructions" TEXT NOT NULL,
    "instructionsMn" TEXT,
    "criterionCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "estimatedHours" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_criteria" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "sourceCriterionId" TEXT,
    "code" TEXT NOT NULL,
    "level" "CriterionLevel" NOT NULL,
    "title" TEXT,
    "titleMn" TEXT,
    "description" TEXT NOT NULL,
    "descriptionMn" TEXT,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "passThreshold" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_submissions" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "currentAttemptNo" INTEGER NOT NULL DEFAULT 0,
    "resubmissionDeadlineAt" TIMESTAMP(3),
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_attempts" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "attemptNo" INTEGER NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'UPLOADED',
    "fileId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "extractedText" TEXT,
    "extractedTextHash" TEXT,
    "extractionError" TEXT,
    "studentNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submission_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_evaluation_runs" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL DEFAULT 'v1',
    "promptHash" TEXT,
    "status" "AiRunStatus" NOT NULL DEFAULT 'PENDING',
    "rawResponse" TEXT,
    "parsedResponse" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_evaluation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "aiRunId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "source" "EvaluationSource" NOT NULL DEFAULT 'HYBRID',
    "status" "EvaluationStatus" NOT NULL DEFAULT 'DRAFT',
    "score" DOUBLE PRECISION,
    "grade" "Grade" NOT NULL DEFAULT 'UNGRADED',
    "feedback" TEXT NOT NULL DEFAULT '',
    "feedbackMn" TEXT,
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "strengthsMn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "improvements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "improvementsMn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "teacherOverride" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_criterion_results" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "assignmentCriterionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "level" "CriterionLevel" NOT NULL,
    "decision" "CriterionDecision" NOT NULL DEFAULT 'NOT_ASSESSED',
    "percentage" DOUBLE PRECISION,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "feedback" TEXT NOT NULL DEFAULT '',
    "feedbackMn" TEXT,
    "evidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_criterion_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_evaluation_responses" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" "StudentResponseType" NOT NULL DEFAULT 'COMMENT',
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_evaluation_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resubmission_requests" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "previousAttemptId" TEXT,
    "requestedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ResubmissionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "decidedById" TEXT,
    "decisionNote" TEXT,
    "deadlineAt" TIMESTAMP(3),
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resubmission_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_verifiers" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "verifierId" TEXT NOT NULL,
    "role" "VerificationRole" NOT NULL DEFAULT 'IV',
    "assignedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_verifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_reviews" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "verifierId" TEXT NOT NULL,
    "assignmentVerifierId" TEXT,
    "role" "VerificationRole" NOT NULL DEFAULT 'IV',
    "decision" "VerificationDecision" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "checklist" JSONB,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_assets" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksumSha256" TEXT,
    "visibility" "FileVisibility" NOT NULL DEFAULT 'PRIVATE',
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "file_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_documents" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT,
    "submissionId" TEXT,
    "evaluationId" TEXT,
    "fileId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'GENERATED',
    "generatedById" TEXT,
    "signedById" TEXT,
    "signedAt" TIMESTAMP(3),
    "signatureHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "AuditAction" NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "programs_code_key" ON "programs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_name_key" ON "academic_years"("name");

-- CreateIndex
CREATE INDEX "academic_years_isActive_idx" ON "academic_years"("isActive");

-- CreateIndex
CREATE INDEX "cohorts_programId_idx" ON "cohorts"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "cohorts_academicYearId_name_key" ON "cohorts"("academicYearId", "name");

-- CreateIndex
CREATE INDEX "cohort_memberships_studentId_idx" ON "cohort_memberships"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "cohort_memberships_cohortId_studentId_key" ON "cohort_memberships"("cohortId", "studentId");

-- CreateIndex
CREATE INDEX "units_createdById_idx" ON "units"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "units_programId_code_key" ON "units"("programId", "code");

-- CreateIndex
CREATE INDEX "learning_aims_unitId_sortOrder_idx" ON "learning_aims"("unitId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "learning_aims_unitId_code_key" ON "learning_aims"("unitId", "code");

-- CreateIndex
CREATE INDEX "assessment_criteria_learningAimId_idx" ON "assessment_criteria"("learningAimId");

-- CreateIndex
CREATE INDEX "assessment_criteria_unitId_level_idx" ON "assessment_criteria"("unitId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_criteria_unitId_code_key" ON "assessment_criteria"("unitId", "code");

-- CreateIndex
CREATE INDEX "assignments_unitId_idx" ON "assignments"("unitId");

-- CreateIndex
CREATE INDEX "assignments_cohortId_idx" ON "assignments"("cohortId");

-- CreateIndex
CREATE INDEX "assignments_academicYearId_idx" ON "assignments"("academicYearId");

-- CreateIndex
CREATE INDEX "assignments_status_idx" ON "assignments"("status");

-- CreateIndex
CREATE INDEX "assignments_createdById_idx" ON "assignments"("createdById");

-- CreateIndex
CREATE INDEX "assignments_ownerTeacherId_idx" ON "assignments"("ownerTeacherId");

-- CreateIndex
CREATE INDEX "assignment_tasks_assignmentId_sortOrder_idx" ON "assignment_tasks"("assignmentId", "sortOrder");

-- CreateIndex
CREATE INDEX "assignment_criteria_sourceCriterionId_idx" ON "assignment_criteria"("sourceCriterionId");

-- CreateIndex
CREATE INDEX "assignment_criteria_assignmentId_level_idx" ON "assignment_criteria"("assignmentId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_criteria_assignmentId_code_key" ON "assignment_criteria"("assignmentId", "code");

-- CreateIndex
CREATE INDEX "assignment_submissions_studentId_idx" ON "assignment_submissions"("studentId");

-- CreateIndex
CREATE INDEX "assignment_submissions_status_idx" ON "assignment_submissions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_submissions_assignmentId_studentId_key" ON "assignment_submissions"("assignmentId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "submission_attempts_fileId_key" ON "submission_attempts"("fileId");

-- CreateIndex
CREATE INDEX "submission_attempts_uploadedById_idx" ON "submission_attempts"("uploadedById");

-- CreateIndex
CREATE INDEX "submission_attempts_status_idx" ON "submission_attempts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "submission_attempts_submissionId_attemptNo_key" ON "submission_attempts"("submissionId", "attemptNo");

-- CreateIndex
CREATE INDEX "ai_evaluation_runs_attemptId_idx" ON "ai_evaluation_runs"("attemptId");

-- CreateIndex
CREATE INDEX "ai_evaluation_runs_requestedById_idx" ON "ai_evaluation_runs"("requestedById");

-- CreateIndex
CREATE INDEX "ai_evaluation_runs_status_idx" ON "ai_evaluation_runs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "evaluations_aiRunId_key" ON "evaluations"("aiRunId");

-- CreateIndex
CREATE INDEX "evaluations_submissionId_idx" ON "evaluations"("submissionId");

-- CreateIndex
CREATE INDEX "evaluations_assessorId_idx" ON "evaluations"("assessorId");

-- CreateIndex
CREATE INDEX "evaluations_status_idx" ON "evaluations"("status");

-- CreateIndex
CREATE INDEX "evaluations_grade_idx" ON "evaluations"("grade");

-- CreateIndex
CREATE UNIQUE INDEX "evaluations_attemptId_version_key" ON "evaluations"("attemptId", "version");

-- CreateIndex
CREATE INDEX "evaluation_criterion_results_assignmentCriterionId_idx" ON "evaluation_criterion_results"("assignmentCriterionId");

-- CreateIndex
CREATE INDEX "evaluation_criterion_results_decision_idx" ON "evaluation_criterion_results"("decision");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_criterion_results_evaluationId_assignmentCriteri_key" ON "evaluation_criterion_results"("evaluationId", "assignmentCriterionId");

-- CreateIndex
CREATE INDEX "student_evaluation_responses_evaluationId_idx" ON "student_evaluation_responses"("evaluationId");

-- CreateIndex
CREATE INDEX "student_evaluation_responses_studentId_idx" ON "student_evaluation_responses"("studentId");

-- CreateIndex
CREATE INDEX "student_evaluation_responses_type_idx" ON "student_evaluation_responses"("type");

-- CreateIndex
CREATE INDEX "resubmission_requests_submissionId_idx" ON "resubmission_requests"("submissionId");

-- CreateIndex
CREATE INDEX "resubmission_requests_requestedById_idx" ON "resubmission_requests"("requestedById");

-- CreateIndex
CREATE INDEX "resubmission_requests_decidedById_idx" ON "resubmission_requests"("decidedById");

-- CreateIndex
CREATE INDEX "resubmission_requests_status_idx" ON "resubmission_requests"("status");

-- CreateIndex
CREATE INDEX "assignment_verifiers_verifierId_idx" ON "assignment_verifiers"("verifierId");

-- CreateIndex
CREATE INDEX "assignment_verifiers_role_idx" ON "assignment_verifiers"("role");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_verifiers_assignmentId_verifierId_key" ON "assignment_verifiers"("assignmentId", "verifierId");

-- CreateIndex
CREATE INDEX "verification_reviews_assignmentId_idx" ON "verification_reviews"("assignmentId");

-- CreateIndex
CREATE INDEX "verification_reviews_verifierId_idx" ON "verification_reviews"("verifierId");

-- CreateIndex
CREATE INDEX "verification_reviews_decision_idx" ON "verification_reviews"("decision");

-- CreateIndex
CREATE UNIQUE INDEX "verification_reviews_evaluationId_verifierId_role_key" ON "verification_reviews"("evaluationId", "verifierId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "file_assets_storageKey_key" ON "file_assets"("storageKey");

-- CreateIndex
CREATE INDEX "file_assets_uploadedById_idx" ON "file_assets"("uploadedById");

-- CreateIndex
CREATE INDEX "file_assets_visibility_idx" ON "file_assets"("visibility");

-- CreateIndex
CREATE UNIQUE INDEX "generated_documents_fileId_key" ON "generated_documents"("fileId");

-- CreateIndex
CREATE INDEX "generated_documents_assignmentId_idx" ON "generated_documents"("assignmentId");

-- CreateIndex
CREATE INDEX "generated_documents_submissionId_idx" ON "generated_documents"("submissionId");

-- CreateIndex
CREATE INDEX "generated_documents_evaluationId_idx" ON "generated_documents"("evaluationId");

-- CreateIndex
CREATE INDEX "generated_documents_type_idx" ON "generated_documents"("type");

-- CreateIndex
CREATE INDEX "generated_documents_status_idx" ON "generated_documents"("status");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resourceType_resourceId_idx" ON "audit_logs"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- AddForeignKey
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_memberships" ADD CONSTRAINT "cohort_memberships_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_memberships" ADD CONSTRAINT "cohort_memberships_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_aims" ADD CONSTRAINT "learning_aims_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_criteria" ADD CONSTRAINT "assessment_criteria_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_criteria" ADD CONSTRAINT "assessment_criteria_learningAimId_fkey" FOREIGN KEY ("learningAimId") REFERENCES "learning_aims"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_ownerTeacherId_fkey" FOREIGN KEY ("ownerTeacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_tasks" ADD CONSTRAINT "assignment_tasks_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_criteria" ADD CONSTRAINT "assignment_criteria_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_criteria" ADD CONSTRAINT "assignment_criteria_sourceCriterionId_fkey" FOREIGN KEY ("sourceCriterionId") REFERENCES "assessment_criteria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_attempts" ADD CONSTRAINT "submission_attempts_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "assignment_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_attempts" ADD CONSTRAINT "submission_attempts_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_attempts" ADD CONSTRAINT "submission_attempts_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_evaluation_runs" ADD CONSTRAINT "ai_evaluation_runs_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "submission_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_evaluation_runs" ADD CONSTRAINT "ai_evaluation_runs_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "assignment_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "submission_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_aiRunId_fkey" FOREIGN KEY ("aiRunId") REFERENCES "ai_evaluation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_criterion_results" ADD CONSTRAINT "evaluation_criterion_results_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_criterion_results" ADD CONSTRAINT "evaluation_criterion_results_assignmentCriterionId_fkey" FOREIGN KEY ("assignmentCriterionId") REFERENCES "assignment_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_evaluation_responses" ADD CONSTRAINT "student_evaluation_responses_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_evaluation_responses" ADD CONSTRAINT "student_evaluation_responses_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resubmission_requests" ADD CONSTRAINT "resubmission_requests_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "assignment_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resubmission_requests" ADD CONSTRAINT "resubmission_requests_previousAttemptId_fkey" FOREIGN KEY ("previousAttemptId") REFERENCES "submission_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resubmission_requests" ADD CONSTRAINT "resubmission_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resubmission_requests" ADD CONSTRAINT "resubmission_requests_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_verifiers" ADD CONSTRAINT "assignment_verifiers_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_verifiers" ADD CONSTRAINT "assignment_verifiers_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_verifiers" ADD CONSTRAINT "assignment_verifiers_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_reviews" ADD CONSTRAINT "verification_reviews_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_reviews" ADD CONSTRAINT "verification_reviews_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_reviews" ADD CONSTRAINT "verification_reviews_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_reviews" ADD CONSTRAINT "verification_reviews_assignmentVerifierId_fkey" FOREIGN KEY ("assignmentVerifierId") REFERENCES "assignment_verifiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "assignment_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

