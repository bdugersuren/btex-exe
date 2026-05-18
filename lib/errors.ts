export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} олдсонгүй`, 404)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Нэвтрэх эрх байхгүй') {
    super('UNAUTHORIZED', message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Хандах эрх байхгүй') {
    super('FORBIDDEN', message, 403)
    this.name = 'ForbiddenError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 422)
    this.name = 'ValidationError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409)
    this.name = 'ConflictError'
  }
}

export function handleApiError(error: unknown): { code: string; message: string; statusCode: number } {
  if (error instanceof AppError) {
    return { code: error.code, message: error.message, statusCode: error.statusCode }
  }

  // Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    const issues = (error as { issues: Array<{ message: string }> }).issues
    return { code: 'VALIDATION_ERROR', message: issues[0]?.message ?? 'Validation алдаа', statusCode: 422 }
  }

  // Prisma known errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaCode = (error as { code: string }).code
    if (prismaCode === 'P2003') {
      // Foreign key constraint — session user ID no longer exists in DB
      return { code: 'UNAUTHORIZED', message: 'Сессийн мэдээлэл хуучирсан байна. Дахин нэвтэрнэ үү.', statusCode: 401 }
    }
    if (prismaCode === 'P2025') {
      return { code: 'NOT_FOUND', message: 'Мэдээлэл олдсонгүй', statusCode: 404 }
    }
    if (prismaCode === 'P2002') {
      return { code: 'CONFLICT', message: 'Давхардсан мэдээлэл байна', statusCode: 409 }
    }
  }

  // Gemini API errors
  if (error instanceof Error) {
    const msg = error.message
    if (msg.includes('429') || msg.includes('Too Many Requests') || msg.includes('quota')) {
      return { code: 'GEMINI_QUOTA', message: 'Gemini API-н хүсэлтийн хязгаар хэтэрсэн байна. Түр хүлээгээд дахин оролдоно уу.', statusCode: 429 }
    }
    if (msg.includes('404') && msg.includes('model')) {
      return { code: 'GEMINI_MODEL', message: 'Gemini model олдсонгүй. Тохиргоо шалгана уу.', statusCode: 502 }
    }
    if (msg.includes('GEMINI_API_KEY')) {
      return { code: 'GEMINI_CONFIG', message: 'Gemini API key тохируулагдаагүй байна.', statusCode: 503 }
    }
    if (msg.includes('Бүх Gemini API key')) {
      return { code: 'GEMINI_ALL_KEYS_FAILED', message: 'Бүх Gemini API key амжилтгүй боллоо. Шинэ key оруулна уу.', statusCode: 503 }
    }
  }

  console.error('Unexpected error:', error)
  return { code: 'INTERNAL_ERROR', message: 'Серверийн алдаа гарлаа', statusCode: 500 }
}
