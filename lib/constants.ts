export const APP_NAME = 'BTEC IT Evaluator'

export const GRADE_LABELS: Record<string, string> = {
  UNGRADED: 'Ungraded',
  A_STAR: 'A*',
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'E',
  U: 'U',
  PASS: 'Pass',
  MERIT: 'Merit',
  DISTINCTION: 'Distinction',
}

export const GRADE_COLORS: Record<string, string> = {
  UNGRADED:     'text-gray-600 bg-gray-50',
  DISTINCTION: 'text-green-600 bg-green-50',
  MERIT:       'text-blue-600 bg-blue-50',
  PASS:        'text-yellow-600 bg-yellow-50',
  U:           'text-red-600 bg-red-50',
}

export const ALLOWED_FILE_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.docx', '.txt']
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const CRITERION_PASS_THRESHOLD = 70

export const RESUBMIT_WINDOW_DAYS = 7

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
}

export const API_ROUTES = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN:    '/api/auth/login',
    LOGOUT:   '/api/auth/logout',
    SESSION:  '/api/auth/session',
  },
  ASSIGNMENTS: '/api/assignments',
  SUBMISSIONS: '/api/submissions',
  EVALUATIONS: '/api/evaluations',
  FILES:       '/api/files',
  HEALTH:      '/api/health',
}
