export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  timestamp: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  role?: 'TEACHER' | 'STUDENT'
}

export interface CreateAssignmentRequest {
  title: string
  description: string
  descriptionMn?: string
  rubric?: {
    criteria: Array<{
      id?: string
      code: string
      description: string
      descriptionMn?: string
      maxScore: number
      grade: 'PASS' | 'MERIT' | 'DISTINCTION'
    }>
  }
  deadline?: string
  assignedTeacherId?: string | null
}

export interface EvaluateRequest {
  submissionId: string
}

export interface ResubmitRequest {
  submissionId: string
  reason: string
}
