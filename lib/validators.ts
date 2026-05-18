import { z } from 'zod'

export const registerSchema = z.object({
  email:    z.string().email('Имэйл хаяг буруу байна'),
  password: z.string().min(8, 'Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой'),
  fullName: z.string().min(2, 'Бүтэн нэр хамгийн багадаа 2 тэмдэгт байх ёстой'),
  role:     z.enum(['TEACHER', 'STUDENT']).optional(),
})

export const loginSchema = z.object({
  email:    z.string().email('Имэйл хаяг буруу байна'),
  password: z.string().min(1, 'Нууц үг оруулна уу'),
})

export const rubricCriterionSchema = z.object({
  id:            z.string().optional(),
  code:          z.string().min(1, 'Код оруулна уу'),
  description:   z.string().min(1, 'Тайлбар оруулна уу'),
  descriptionMn: z.string().optional(),
  maxScore:      z.number().min(1).max(100),
  grade:         z.enum(['PASS', 'MERIT', 'DISTINCTION']),
})

export const assignmentSchema = z.object({
  title:             z.string().min(1, 'Гарчиг оруулна уу'),
  description:       z.string().min(1, 'Тайлбар оруулна уу'),
  descriptionMn:     z.string().optional(),
  rubric: z.object({
    criteria: z.array(rubricCriterionSchema).optional().default([]),
  }).optional().default({ criteria: [] }),
  deadline: z.preprocess((v) => (v === '' || v == null ? undefined : v), z.string().optional()),
  assignedTeacherId: z.string().uuid().nullish(),
})

export const paginationSchema = z.object({
  page:  z.preprocess((v) => (v == null || v === '' ? 1  : Number(v)), z.number().min(1).default(1)),
  limit: z.preprocess((v) => (v == null || v === '' ? 10 : Number(v)), z.number().min(1).max(100).default(10)),
})

export const resubmitRequestSchema = z.object({
  submissionId: z.string().uuid(),
  reason:       z.string().min(10, 'Шалтгааныг дэлгэрэнгүй бичнэ үү'),
})

export type RegisterInput     = z.infer<typeof registerSchema>
export type LoginInput         = z.infer<typeof loginSchema>
export type AssignmentInput    = z.infer<typeof assignmentSchema>
export type ResubmitRequestInput = z.infer<typeof resubmitRequestSchema>
