import { AssignmentStatus, Grade, Role, SubmissionStatus, UserStatus } from './enums'

export interface User {
  id: string
  email: string
  fullName: string
  role: Role
  status?: UserStatus
  isActive?: boolean
  createdAt: string
  updatedAt: string
}

export interface RubricCriterion {
  id?: string
  code: string
  description: string
  descriptionMn?: string
  maxScore: number
  grade: 'PASS' | 'MERIT' | 'DISTINCTION'
}

export interface Rubric {
  criteria: RubricCriterion[]
}

export interface Assignment {
  id: string
  title: string
  description: string
  descriptionMn?: string
  rubric: Rubric
  deadline?: string
  status?: AssignmentStatus
  createdBy: string
  assignedTeacherId?: string | null
  createdAt: string
  updatedAt: string
  teacher?: Pick<User, 'id' | 'fullName' | 'email'>
  assignedTeacher?: Pick<User, 'id' | 'fullName' | 'email'> | null
  _count?: { submissions: number }
}

export interface Submission {
  id: string
  assignmentId: string
  studentId: string
  filePath: string
  fileName: string
  fileType: string
  status: SubmissionStatus
  resubmitDeadline?: string
  attempt: number
  createdAt: string
  updatedAt: string
  assignment?: Pick<Assignment, 'id' | 'title'>
  student?: Pick<User, 'id' | 'fullName' | 'email'>
  evaluation?: Evaluation
}

export interface CriterionScore {
  criterionId?: string
  code:         string
  score:        number    // 0–100 percentage
  maxScore:     number
  passes:       boolean   // score >= 70
  feedback:     string
  feedbackMn?:  string
}

export interface Evaluation {
  id: string
  submissionId: string
  evaluatedBy: string
  score: number
  grade: Grade
  feedback: string
  feedbackMn?: string
  strengths: string[]
  strengthsMn?: string[]
  improvements: string[]
  improvementsMn?: string[]
  criteriaScores?: CriterionScore[]
  isPublished: boolean
  studentFeedback?: string
  isVerified: boolean
  verifiedBy?: string | null
  verifiedAt?: string | null
  verifierNote?: string | null
  createdAt: string
  updatedAt: string
  evaluator?: Pick<User, 'id' | 'fullName'>
  submission?: Pick<Submission, 'id' | 'fileName'> & {
    student?: Pick<User, 'id' | 'fullName'>
    assignment?: Pick<Assignment, 'id' | 'title'>
  }
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, unknown>
  createdAt: string
  user?: Pick<User, 'id' | 'fullName' | 'email'>
}
