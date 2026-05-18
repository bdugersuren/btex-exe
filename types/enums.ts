export enum Role {
  ADMIN   = 'ADMIN',
  LEAD_IV = 'LEAD_IV',
  IV      = 'IV',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export enum Grade {
  UNGRADED = 'UNGRADED',
  A_STAR = 'A_STAR',
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  U = 'U',
  PASS = 'PASS',
  MERIT = 'MERIT',
  DISTINCTION = 'DISTINCTION',
}

export enum SubmissionStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  EVALUATING = 'EVALUATING',
  EVALUATED = 'EVALUATED',
  RETURNED = 'RETURNED',
  RESUBMIT_REQUESTED = 'RESUBMIT_REQUESTED',
  RESUBMIT_APPROVED = 'RESUBMIT_APPROVED',
  RESUBMITTED = 'RESUBMITTED',
  FINALIZED = 'FINALIZED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DISABLED = 'DISABLED',
}

export enum AssignmentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export enum FileType {
  PDF = 'PDF',
  DOCX = 'DOCX',
  TXT = 'TXT',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EVALUATE = 'EVALUATE',
  SUBMIT = 'SUBMIT',
  RESUBMIT = 'RESUBMIT',
}
