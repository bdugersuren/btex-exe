'use client'

import { useState } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { assignmentSchema } from '@/lib/validators'
import { useCreateAssignment, useUpdateAssignment } from '@/hooks/useAssignments'
import { useUsers } from '@/hooks/useUsers'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MarkdownEditor } from '@/components/ui/MarkdownEditor'
import { Assignment } from '@/types/models'
import { Role } from '@/types/enums'

type AssignmentInput = z.infer<typeof assignmentSchema>

interface AssignmentFormProps {
  defaultValues?: Partial<Assignment>
  onSuccess?: () => void
  role?: Role
}

const GRADE_OPTIONS = [
  { value: 'PASS',        label: 'Pass (P)' },
  { value: 'MERIT',       label: 'Merit (M)' },
  { value: 'DISTINCTION', label: 'Distinction (D)' },
] as const

const defaultCriteria = [
  { code: 'P1', description: '', descriptionMn: '', maxScore: 40, grade: 'PASS' as const },
  { code: 'M1', description: '', descriptionMn: '', maxScore: 30, grade: 'MERIT' as const },
  { code: 'D1', description: '', descriptionMn: '', maxScore: 30, grade: 'DISTINCTION' as const },
]

export function AssignmentForm({ defaultValues, onSuccess, role }: AssignmentFormProps) {
  const createAssignment = useCreateAssignment()
  const updateAssignment = useUpdateAssignment()
  const [submitError, setSubmitError] = useState('')

  const isLeadIv = role === Role.LEAD_IV
  const { data: teachers } = useUsers(Role.TEACHER)

  const form = useForm<AssignmentInput>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: defaultValues
      ? {
          title:             defaultValues.title ?? '',
          description:       defaultValues.description ?? '',
          descriptionMn:     defaultValues.descriptionMn ?? '',
          rubric:            defaultValues.rubric ?? { criteria: isLeadIv ? [] : defaultCriteria },
          deadline:          defaultValues.deadline ?? '',
          assignedTeacherId: defaultValues.assignedTeacherId ?? undefined,
        }
      : {
          title: '', description: '', descriptionMn: '', deadline: '',
          rubric: { criteria: isLeadIv ? [] : defaultCriteria },
          assignedTeacherId: undefined,
        },
  })

  const { register, handleSubmit, control, setValue, formState: { errors, isSubmitting } } = form

  const { fields, append, remove } = useFieldArray({ control, name: 'rubric.criteria' })

  const descriptionEn = useWatch({ control, name: 'description' })
  const descriptionMnVal = useWatch({ control, name: 'descriptionMn' })

  const onSubmit = async (data: AssignmentInput) => {
    setSubmitError('')
    try {
      if (defaultValues?.id) {
        await updateAssignment.mutateAsync({ id: defaultValues.id, data })
      } else {
        await createAssignment.mutateAsync(data)
      }
      onSuccess?.()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Хадгалахад алдаа гарлаа')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Гарчиг"
        placeholder="жш. Unit 1: Information Technology Systems"
        error={errors.title?.message}
        {...register('title')}
      />

      <MarkdownEditor
        label="Тайлбар (Англи)"
        placeholder={`# Unit Overview\n\nDescribe the unit objectives...\n\n## Requirements\n- Requirement 1`}
        value={descriptionEn ?? ''}
        onChange={(v) => setValue('description', v, { shouldValidate: true })}
        error={errors.description?.message}
        rows={10}
      />

      <MarkdownEditor
        label="Тайлбар (Монгол)"
        placeholder={`# Нэгжийн тойм\n\nНэгжийн зорилгыг тайлбарлана уу...`}
        value={descriptionMnVal ?? ''}
        onChange={(v) => setValue('descriptionMn', v)}
        rows={10}
      />

      <Input
        label="Дуусах хугацаа (заавал биш)"
        type="datetime-local"
        {...register('deadline')}
      />

      {/* LEAD_IV: assign teacher to manage this unit */}
      {isLeadIv && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Удирдах багш <span className="text-gray-400">(заавал биш)</span>
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            {...register('assignedTeacherId')}
          >
            <option value="">— Сонгох —</option>
            {teachers?.items.filter((t) => t.isActive).map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName} ({t.email})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Rubric criteria — show for TEACHER and ADMIN, hide for LEAD_IV unit shells */}
      {!isLeadIv && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Үнэлгээний шалгуурууд (PSA)</p>
            <button
              type="button"
              onClick={() =>
                append({ code: `C${fields.length + 1}`, description: '', descriptionMn: '', maxScore: 20, grade: 'PASS' })
              }
              className="text-sm text-primary-600 hover:underline"
            >
              + Шалгуур нэмэх
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, i) => (
              <div key={field.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Шалгуур {i + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      Устгах
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <Input
                      label="Код (жш. P1)"
                      placeholder="P1"
                      error={errors.rubric?.criteria?.[i]?.code?.message}
                      {...register(`rubric.criteria.${i}.code`)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Зэрэглэл</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      {...register(`rubric.criteria.${i}.grade`)}
                    >
                      {GRADE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <Input
                    label="Хамгийн их оноо"
                    type="number"
                    min={1}
                    max={100}
                    error={errors.rubric?.criteria?.[i]?.maxScore?.message}
                    {...register(`rubric.criteria.${i}.maxScore`, { valueAsNumber: true })}
                  />
                </div>

                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тайлбар <span className="text-gray-400">(Англи)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Criterion тайлбар..."
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.rubric?.criteria?.[i]?.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    {...register(`rubric.criteria.${i}.description`)}
                  />
                  {errors.rubric?.criteria?.[i]?.description && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.rubric.criteria[i]?.description?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тайлбар <span className="text-gray-400">(Монгол)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Criterion тайлбар монголоор..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    {...register(`rubric.criteria.${i}.descriptionMn`)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {submitError}
        </div>
      )}

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        {defaultValues?.id ? 'Хадгалах' : isLeadIv ? 'Unit үүсгэх' : 'Даалгавар үүсгэх'}
      </Button>
    </form>
  )
}
