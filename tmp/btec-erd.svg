# BTEC Prisma Schema

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  LEAD_IV
  IV
  TEACHER
  STUDENT
}

enum UserStatus {
  PENDING
  ACTIVE
  SUSPENDED
  DISABLED
}

enum CriterionLevel {
  PASS
  MERIT
  DISTINCTION
}

enum Grade {
  UNGRADED
  U
  PASS
  MERIT
  DISTINCTION
  A_STAR
  A
  B
  C
  D
  E
}

enum AssignmentStatus {
  DRAFT
  PUBLISHED
  CLOSED
  ARCHIVED
}

enum SubmissionStatus {
  NOT_STARTED
  PENDING
  SUBMITTED
  EVALUATING
  EVALUATED
  RETURNED
  RESUBMIT_REQUESTED
  RESUBMIT_APPROVED
  RESUBMITTED
  FINALIZED
  WITHDRAWN
}

enum AttemptStatus {
  UPLOADED
  TEXT_EXTRACTED
  EXTRACTION_FAILED
  EVALUATING
  EVALUATED
  RETURNED
  SUPERSEDED
  ARCHIVED
}

enum EvaluationSource {
  AI
  TEACHER
  HYBRID
}

enum EvaluationStatus {
  DRAFT
  READY_FOR_REVIEW
  PUBLISHED
  CHANGES_REQUESTED
  VERIFIED
  FINALIZED
  VOID
}

enum CriterionDecision {
  NOT_ASSESSED
  NOT_MET
  PARTIALLY_MET
  MET
}

enum AiRunStatus {
  PENDING
  RUNNING
  SUCCEEDED
  FAILED
  CANCELLED
}

enum ResubmissionRequestStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
  CANCELLED
}

enum VerificationRole {
  IV
  LEAD_IV
}

enum VerificationDecision {
  PENDING
  APPROVED
  CHANGES_REQUIRED
  REJECTED
}

enum StudentResponseType {
  COMMENT
  QUESTION
  RESUBMISSION_REQUEST
  APPEAL
}

enum FileVisibility {
  PRIVATE
  INTERNAL
  PUBLIC
}

enum DocumentType {
  ASSIGNMENT_BRIEF
  SUBMISSION_RECEIPT
  ASSESSMENT_RECORD
  IV_RECORD
  LEAD_IV_RECORD
  FEEDBACK_REPORT
  OTHER
}

enum DocumentStatus {
  DRAFT
  GENERATED
  SIGNED
  VOID
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  REGISTER
  ACTIVATE_USER
  ASSIGN_ROLE
  PUBLISH_ASSIGNMENT
  UPLOAD_SUBMISSION
  EXTRACT_TEXT
  RUN_AI_EVALUATION
  SAVE_EVALUATION
  PUBLISH_EVALUATION
  STUDENT_RESPONSE
  REQUEST_RESUBMISSION
  DECIDE_RESUBMISSION
  VERIFY_EVALUATION
  GENERATE_DOCUMENT
  SIGN_DOCUMENT
  DOWNLOAD_FILE
}

model User {
  id              String     @id @default(uuid())
  email           String     @unique
  password        String
  fullName        String
  role            Role       @default(STUDENT)
  status          UserStatus @default(PENDING)
  isActive        Boolean    @default(false)
  emailVerifiedAt DateTime?
  lastLoginAt     DateTime?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  createdUnits               Unit[]                      @relation("UnitCreatedBy")
  cohortMemberships          CohortMembership[]          @relation("CohortStudents")
  createdAssignments         Assignment[]                @relation("AssignmentCreatedBy")
  ownedAssignments           Assignment[]                @relation("AssignmentOwnerTeacher")
  submissions                AssignmentSubmission[]      @relation("SubmissionStudent")
  uploadedAttempts           SubmissionAttempt[]         @relation("AttemptUploadedBy")
  uploadedFiles              FileAsset[]                 @relation("FileUploadedBy")
  evaluations                Evaluation[]                @relation("EvaluationAssessor")
  aiRunsRequested            AiEvaluationRun[]           @relation("AiRunRequestedBy")
  resubmissionRequests       ResubmissionRequest[]       @relation("ResubmissionRequestedBy")
  resubmissionDecisions      ResubmissionRequest[]       @relation("ResubmissionDecidedBy")
  verifierAssignments        AssignmentVerifier[]        @relation("VerifierUser")
  verifierAssignmentsCreated AssignmentVerifier[]        @relation("VerifierAssignedBy")
  verificationReviews        VerificationReview[]        @relation("VerificationReviewer")
  studentResponses           StudentEvaluationResponse[] @relation("StudentEvaluationResponder")
  generatedDocuments         GeneratedDocument[]         @relation("DocumentGeneratedBy")
  signedDocuments            GeneratedDocument[]         @relation("DocumentSignedBy")
  auditLogs                  AuditLog[]                  @relation("AuditActor")
  notifications              Notification[]

  @@index([role])
  @@index([status])
  @@map("users")
}

model Program {
  id           String   @id @default(uuid())
  code         String   @unique
  name         String
  nameMn       String?
  level        String?
  awardingBody String   @default("Pearson")
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  units   Unit[]
  cohorts Cohort[]

  @@map("programs")
}

model AcademicYear {
  id        String   @id @default(uuid())
  name      String   @unique
  startsAt  DateTime
  endsAt    DateTime
  isActive  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  cohorts     Cohort[]
  assignments Assignment[]

  @@index([isActive])
  @@map("academic_years")
}

model Cohort {
  id             String   @id @default(uuid())
  name           String
  programId      String?
  academicYearId String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  program      Program?           @relation(fields: [programId], references: [id], onDelete: SetNull)
  academicYear AcademicYear       @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  memberships  CohortMembership[]
  assignments  Assignment[]

  @@unique([academicYearId, name])
  @@index([programId])
  @@map("cohorts")
}

model CohortMembership {
  id        String    @id @default(uuid())
  cohortId  String
  studentId String
  joinedAt  DateTime  @default(now())
  leftAt    DateTime?

  cohort  Cohort @relation(fields: [cohortId], references: [id], onDelete: Cascade)
  student User   @relation("CohortStudents", fields: [studentId], references: [id], onDelete: Restrict)

  @@unique([cohortId, studentId])
  @@index([studentId])
  @@map("cohort_memberships")
}

model Unit {
  id                  String   @id @default(uuid())
  programId           String?
  code                String
  title               String
  titleMn             String?
  description         String?
  descriptionMn       String?
  guidedLearningHours Int?
  credits             Int?
  createdById         String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  program      Program?              @relation(fields: [programId], references: [id], onDelete: SetNull)
  createdBy    User?                 @relation("UnitCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  learningAims LearningAim[]
  criteria     AssessmentCriterion[]
  assignments  Assignment[]

  @@unique([programId, code])
  @@index([createdById])
  @@map("units")
}

model LearningAim {
  id            String   @id @default(uuid())
  unitId        String
  code          String
  title         String
  titleMn       String?
  description   String?
  descriptionMn String?
  sortOrder     Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  unit     Unit                  @relation(fields: [unitId], references: [id], onDelete: Cascade)
  criteria AssessmentCriterion[]

  @@unique([unitId, code])
  @@index([unitId, sortOrder])
  @@map("learning_aims")
}

model AssessmentCriterion {
  id             String         @id @default(uuid())
  unitId         String
  learningAimId  String?
  code           String
  level          CriterionLevel
  title          String?
  titleMn        String?
  description    String
  descriptionMn  String?
  commandVerb    String?
  maxScore       Float?
  sortOrder      Int            @default(0)
  isActive       Boolean        @default(true)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  unit               Unit                  @relation(fields: [unitId], references: [id], onDelete: Cascade)
  learningAim        LearningAim?          @relation(fields: [learningAimId], references: [id], onDelete: SetNull)
  assignmentCriteria AssignmentCriterion[]

  @@unique([unitId, code])
  @@index([learningAimId])
  @@index([unitId, level])
  @@map("assessment_criteria")
}

model Assignment {
  id                     String           @id @default(uuid())
  unitId                 String?
  cohortId               String?
  academicYearId          String?
  title                  String
  titleMn                String?
  scenario               String?
  scenarioMn             String?
  instructions           String
  instructionsMn         String?
  issueDate              DateTime?
  dueAt                  DateTime?
  resubmissionWindowDays Int              @default(7)
  maxAttempts            Int              @default(2)
  status                 AssignmentStatus @default(DRAFT)
  rubricSnapshot         Json?
  createdById            String
  ownerTeacherId         String?
  publishedAt            DateTime?
  closedAt               DateTime?
  createdAt              DateTime         @default(now())
  updatedAt              DateTime         @updatedAt

  unit         Unit?                  @relation(fields: [unitId], references: [id], onDelete: SetNull)
  cohort       Cohort?                @relation(fields: [cohortId], references: [id], onDelete: SetNull)
  academicYear AcademicYear?          @relation(fields: [academicYearId], references: [id], onDelete: SetNull)
  createdBy    User                   @relation("AssignmentCreatedBy", fields: [createdById], references: [id], onDelete: Restrict)
  ownerTeacher User?                  @relation("AssignmentOwnerTeacher", fields: [ownerTeacherId], references: [id], onDelete: SetNull)
  tasks        AssignmentTask[]
  criteria     AssignmentCriterion[]
  submissions  AssignmentSubmission[]
  verifiers    AssignmentVerifier[]
  documents    GeneratedDocument[]

  @@index([unitId])
  @@index([cohortId])
  @@index([academicYearId])
  @@index([status])
  @@index([createdById])
  @@index([ownerTeacherId])
  @@map("assignments")
}

model AssignmentTask {
  id             String   @id @default(uuid())
  assignmentId   String
  title          String
  titleMn        String?
  instructions   String
  instructionsMn String?
  criterionCodes String[] @default([])
  sortOrder      Int      @default(0)
  estimatedHours Float?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  assignment Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)

  @@index([assignmentId, sortOrder])
  @@map("assignment_tasks")
}

model AssignmentCriterion {
  id                String         @id @default(uuid())
  assignmentId      String
  sourceCriterionId String?
  code              String
  level             CriterionLevel
  title             String?
  titleMn           String?
  description       String
  descriptionMn     String?
  maxScore          Float          @default(100)
  passThreshold     Float          @default(70)
  sortOrder         Int            @default(0)
  isRequired        Boolean        @default(true)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  assignment      Assignment                  @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  sourceCriterion AssessmentCriterion?        @relation(fields: [sourceCriterionId], references: [id], onDelete: SetNull)
  results         EvaluationCriterionResult[]

  @@unique([assignmentId, code])
  @@index([sourceCriterionId])
  @@index([assignmentId, level])
  @@map("assignment_criteria")
}

model AssignmentSubmission {
  id                     String           @id @default(uuid())
  assignmentId           String
  studentId              String
  status                 SubmissionStatus @default(NOT_STARTED)
  currentAttemptNo       Int              @default(0)
  resubmissionDeadlineAt DateTime?
  finalizedAt            DateTime?
  createdAt              DateTime         @default(now())
  updatedAt              DateTime         @updatedAt

  assignment           Assignment            @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  student              User                  @relation("SubmissionStudent", fields: [studentId], references: [id], onDelete: Restrict)
  attempts             SubmissionAttempt[]
  evaluations          Evaluation[]
  resubmissionRequests ResubmissionRequest[]
  documents            GeneratedDocument[]

  @@unique([assignmentId, studentId])
  @@index([studentId])
  @@index([status])
  @@map("assignment_submissions")
}

model SubmissionAttempt {
  id                   String        @id @default(uuid())
  submissionId         String
  attemptNo            Int
  status               AttemptStatus @default(UPLOADED)
  fileId               String        @unique
  uploadedById         String
  submittedAt          DateTime      @default(now())
  isLate               Boolean       @default(false)
  extractedText        String?
  extractedTextHash    String?
  extractionError      String?
  studentNote          String?
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  submission           AssignmentSubmission  @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  file                 FileAsset             @relation(fields: [fileId], references: [id], onDelete: Restrict)
  uploadedBy           User                  @relation("AttemptUploadedBy", fields: [uploadedById], references: [id], onDelete: Restrict)
  aiRuns               AiEvaluationRun[]
  evaluations          Evaluation[]
  resubmissionRequests ResubmissionRequest[] @relation("ResubmissionPreviousAttempt")

  @@unique([submissionId, attemptNo])
  @@index([uploadedById])
  @@index([status])
  @@map("submission_attempts")
}

model AiEvaluationRun {
  id             String      @id @default(uuid())
  attemptId      String
  requestedById  String
  provider       String      @default("google")
  model          String
  promptVersion  String      @default("v1")
  promptHash     String?
  status         AiRunStatus @default(PENDING)
  rawResponse    String?
  parsedResponse Json?
  errorCode      String?
  errorMessage   String?
  startedAt      DateTime?
  completedAt    DateTime?
  createdAt      DateTime    @default(now())

  attempt     SubmissionAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  requestedBy User              @relation("AiRunRequestedBy", fields: [requestedById], references: [id], onDelete: Restrict)
  evaluation  Evaluation?

  @@index([attemptId])
  @@index([requestedById])
  @@index([status])
  @@map("ai_evaluation_runs")
}

model Evaluation {
  id              String           @id @default(uuid())
  submissionId    String
  attemptId       String
  assessorId      String
  aiRunId         String?          @unique
  version         Int              @default(1)
  source          EvaluationSource @default(HYBRID)
  status          EvaluationStatus @default(DRAFT)
  score           Float?
  grade           Grade            @default(UNGRADED)
  feedback        String           @default("")
  feedbackMn      String?
  strengths       String[]         @default([])
  strengthsMn     String[]         @default([])
  improvements    String[]         @default([])
  improvementsMn  String[]         @default([])
  teacherOverride Boolean          @default(false)
  overrideReason  String?
  isFinal         Boolean          @default(false)
  publishedAt     DateTime?
  returnedAt      DateTime?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  submission          AssignmentSubmission       @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  attempt             SubmissionAttempt          @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  assessor            User                       @relation("EvaluationAssessor", fields: [assessorId], references: [id], onDelete: Restrict)
  aiRun               AiEvaluationRun?           @relation(fields: [aiRunId], references: [id], onDelete: SetNull)
  criterionResults    EvaluationCriterionResult[]
  studentResponses    StudentEvaluationResponse[]
  verificationReviews VerificationReview[]
  documents           GeneratedDocument[]

  @@unique([attemptId, version])
  @@index([submissionId])
  @@index([assessorId])
  @@index([status])
  @@index([grade])
  @@map("evaluations")
}

model EvaluationCriterionResult {
  id                    String            @id @default(uuid())
  evaluationId          String
  assignmentCriterionId String
  code                  String
  level                 CriterionLevel
  decision              CriterionDecision @default(NOT_ASSESSED)
  percentage            Float?
  score                 Float?
  maxScore              Float?
  feedback              String            @default("")
  feedbackMn            String?
  evidence              Json?
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt

  evaluation          Evaluation          @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  assignmentCriterion AssignmentCriterion @relation(fields: [assignmentCriterionId], references: [id], onDelete: Restrict)

  @@unique([evaluationId, assignmentCriterionId])
  @@index([assignmentCriterionId])
  @@index([decision])
  @@map("evaluation_criterion_results")
}

model StudentEvaluationResponse {
  id           String              @id @default(uuid())
  evaluationId String
  studentId    String
  type         StudentResponseType @default(COMMENT)
  message      String
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt

  evaluation Evaluation @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  student    User       @relation("StudentEvaluationResponder", fields: [studentId], references: [id], onDelete: Restrict)

  @@index([evaluationId])
  @@index([studentId])
  @@index([type])
  @@map("student_evaluation_responses")
}

model ResubmissionRequest {
  id                String                    @id @default(uuid())
  submissionId      String
  previousAttemptId String?
  requestedById     String
  reason            String
  status            ResubmissionRequestStatus @default(PENDING)
  decidedById       String?
  decisionNote      String?
  deadlineAt        DateTime?
  requestedAt       DateTime                  @default(now())
  decidedAt         DateTime?
  createdAt         DateTime                  @default(now())
  updatedAt         DateTime                  @updatedAt

  submission      AssignmentSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  previousAttempt SubmissionAttempt?   @relation("ResubmissionPreviousAttempt", fields: [previousAttemptId], references: [id], onDelete: SetNull)
  requestedBy     User                 @relation("ResubmissionRequestedBy", fields: [requestedById], references: [id], onDelete: Restrict)
  decidedBy       User?                @relation("ResubmissionDecidedBy", fields: [decidedById], references: [id], onDelete: SetNull)

  @@index([submissionId])
  @@index([requestedById])
  @@index([decidedById])
  @@index([status])
  @@map("resubmission_requests")
}

model AssignmentVerifier {
  id           String           @id @default(uuid())
  assignmentId String
  verifierId   String
  role         VerificationRole @default(IV)
  assignedById String?
  isActive     Boolean          @default(true)
  assignedAt   DateTime         @default(now())

  assignment Assignment           @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  verifier   User                 @relation("VerifierUser", fields: [verifierId], references: [id], onDelete: Restrict)
  assignedBy User?                @relation("VerifierAssignedBy", fields: [assignedById], references: [id], onDelete: SetNull)
  reviews    VerificationReview[]

  @@unique([assignmentId, verifierId])
  @@index([verifierId])
  @@index([role])
  @@map("assignment_verifiers")
}

model VerificationReview {
  id                   String               @id @default(uuid())
  evaluationId          String
  assignmentId          String
  verifierId            String
  assignmentVerifierId  String?
  role                  VerificationRole     @default(IV)
  decision              VerificationDecision @default(PENDING)
  note                  String?
  checklist             Json?
  reviewedAt            DateTime?
  createdAt             DateTime             @default(now())
  updatedAt             DateTime             @updatedAt

  evaluation         Evaluation          @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  assignment         Assignment          @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  verifier           User                @relation("VerificationReviewer", fields: [verifierId], references: [id], onDelete: Restrict)
  assignmentVerifier AssignmentVerifier? @relation(fields: [assignmentVerifierId], references: [id], onDelete: SetNull)

  @@unique([evaluationId, verifierId, role])
  @@index([assignmentId])
  @@index([verifierId])
  @@index([decision])
  @@map("verification_reviews")
}

model FileAsset {
  id             String         @id @default(uuid())
  storageKey     String         @unique
  originalName   String
  mimeType       String
  extension      String
  sizeBytes      BigInt
  checksumSha256 String?
  visibility     FileVisibility @default(PRIVATE)
  uploadedById   String?
  createdAt      DateTime       @default(now())
  deletedAt      DateTime?

  uploadedBy        User?               @relation("FileUploadedBy", fields: [uploadedById], references: [id], onDelete: SetNull)
  submissionAttempt SubmissionAttempt?
  generatedDocument GeneratedDocument?

  @@index([uploadedById])
  @@index([visibility])
  @@map("file_assets")
}

model GeneratedDocument {
  id            String         @id @default(uuid())
  assignmentId  String?
  submissionId  String?
  evaluationId  String?
  fileId        String         @unique
  type          DocumentType
  status        DocumentStatus @default(GENERATED)
  generatedById String?
  signedById    String?
  signedAt      DateTime?
  signatureHash String?
  metadata      Json?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  assignment  Assignment?           @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  submission  AssignmentSubmission? @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  evaluation  Evaluation?           @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  file        FileAsset             @relation(fields: [fileId], references: [id], onDelete: Restrict)
  generatedBy User?                 @relation("DocumentGeneratedBy", fields: [generatedById], references: [id], onDelete: SetNull)
  signedBy    User?                 @relation("DocumentSignedBy", fields: [signedById], references: [id], onDelete: SetNull)

  @@index([assignmentId])
  @@index([submissionId])
  @@index([evaluationId])
  @@index([type])
  @@index([status])
  @@map("generated_documents")
}

model AuditLog {
  id           String      @id @default(uuid())
  actorId      String?
  action       AuditAction
  resourceType String
  resourceId   String?
  ipAddress    String?
  userAgent    String?
  before       Json?
  after        Json?
  metadata     Json?
  createdAt    DateTime    @default(now())

  actor User? @relation("AuditActor", fields: [actorId], references: [id], onDelete: SetNull)

  @@index([actorId])
  @@index([action])
  @@index([resourceType, resourceId])
  @@index([createdAt])
  @@map("audit_logs")
}

model Notification {
  id        String    @id @default(uuid())
  userId    String
  type      String
  title     String
  body      String?
  data      Json?
  readAt    DateTime?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, readAt])
  @@index([createdAt])
  @@map("notifications")
}

```
