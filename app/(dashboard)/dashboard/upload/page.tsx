'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAssignments, useAssignment } from '@/hooks/useAssignments'
import { useSubmissions } from '@/hooks/useSubmissions'
import { FileUpload } from '@/components/features/File/FileUpload'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import { formatDate, formatDateTime } from '@/lib/utils'
import { SubmissionStatus } from '@/types/enums'
import { GRADE_COLORS, GRADE_LABELS } from '@/lib/constants'

const statusLabels: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  PENDING:            { label: 'Хүлээгдэж байна',          variant: 'default' },
  EVALUATED:          { label: 'Үнэлэгдэж байна',          variant: 'info' },
  RETURNED:           { label: 'Үнэлгээ ирсэн',            variant: 'success' },
  RESUBMIT_REQUESTED: { label: 'Resubmit хүсэлт илгээсэн', variant: 'warning' },
  RESUBMIT_APPROVED:  { label: 'Resubmit зөвшөөрөгдсөн',  variant: 'info' },
  RESUBMITTED:        { label: 'Дахин илгээсэн',           variant: 'default' },
}

const gradeRowColor: Record<string, string> = {
  PASS:        'bg-green-50 border-green-200',
  MERIT:       'bg-blue-50 border-blue-200',
  DISTINCTION: 'bg-purple-50 border-purple-200',
}

function UploadContent() {
  const searchParams = useSearchParams()
  const [selectedId, setSelectedId] = useState(searchParams.get('assignmentId') ?? '')
  const [descLang, setDescLang]     = useState<'mn' | 'en'>('mn')
  const [uploadDone, setUploadDone] = useState(false)

  const { data: assignmentsData, isLoading: listLoading } = useAssignments(1, 100)
  const { data: assignment } = useAssignment(selectedId)
  const { data: submissionsData, isLoading: subLoading } = useSubmissions(1, 1, selectedId || undefined)

  const existing = selectedId ? submissionsData?.items[0] : undefined
  const canSubmit =
    !existing ||
    existing.status === SubmissionStatus.RESUBMIT_APPROVED

  const isResubmit = existing?.status === SubmissionStatus.RESUBMIT_APPROVED

  const handleSuccess = () => {
    setUploadDone(true)
    setSelectedId('')
    setTimeout(() => setUploadDone(false), 4000)
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Success banner */}
      {uploadDone && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-green-800">Тайлан амжилттай илгээгдлээ!</p>
            <p className="text-sm text-green-700 mt-0.5">
              <Link href="/dashboard/my-submissions" className="underline">Миний тайлангууд</Link> хэсгээс хянах боломжтой.
            </p>
          </div>
        </div>
      )}

      {/* Assignment selector */}
      <Card title="Даалгавар сонгох">
        {listLoading ? (
          <p className="text-gray-500 text-sm">Ачааллаж байна...</p>
        ) : (
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); setUploadDone(false) }}
          >
            <option value="">-- Даалгавар сонгоно уу --</option>
            {assignmentsData?.items.map((a) => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
        )}
      </Card>

      {/* Assignment details */}
      {selectedId && assignment && (
        <Card title="📋 Даалгаварын мэдээлэл">
          <div className="space-y-4">
            {assignment.deadline && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Дуусах хугацаа:</span>
                <span className={`font-semibold ${new Date() > new Date(assignment.deadline) ? 'text-red-600' : 'text-gray-800'}`}>
                  {formatDate(assignment.deadline)}
                </span>
                {new Date() > new Date(assignment.deadline) && (
                  <Badge label="Хугацаа дууссан" variant="error" />
                )}
              </div>
            )}

            {(assignment.description || assignment.descriptionMn) && (
              <div>
                {/* Language tabs */}
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mr-2">Тайлбар</span>
                  {assignment.descriptionMn && (
                    <button
                      onClick={() => setDescLang('mn')}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                        descLang === 'mn' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      🇲🇳 Монгол
                    </button>
                  )}
                  {assignment.description && (
                    <button
                      onClick={() => setDescLang('en')}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                        descLang === 'en' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      🇬🇧 English
                    </button>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                  <MarkdownRenderer
                    content={
                      descLang === 'mn' && assignment.descriptionMn
                        ? assignment.descriptionMn
                        : assignment.description
                    }
                  />
                </div>
              </div>
            )}

            {/* Rubric criteria */}
            {assignment.rubric?.criteria?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Үнэлгээний шалгуурууд</p>
                <div className="space-y-2">
                  {assignment.rubric.criteria.map((c) => (
                    <div
                      key={c.id ?? c.code}
                      className={`border rounded-lg px-4 py-3 ${gradeRowColor[c.grade] ?? 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-gray-800">{c.code}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{c.maxScore} оноо</span>
                          <Badge
                            label={c.grade === 'PASS' ? 'Pass' : c.grade === 'MERIT' ? 'Merit' : 'Distinction'}
                            variant={c.grade === 'PASS' ? 'success' : c.grade === 'MERIT' ? 'info' : 'warning'}
                          />
                        </div>
                      </div>
                      {(descLang === 'mn' ? (c.descriptionMn || c.description) : (c.description || c.descriptionMn)) && (
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {descLang === 'mn' ? (c.descriptionMn || c.description) : (c.description || c.descriptionMn)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Already submitted — show status */}
      {selectedId && !subLoading && existing && !canSubmit && (
        <Card className="border-yellow-200 bg-yellow-50">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">📋</span>
            <div className="flex-1">
              <p className="font-semibold text-yellow-900 mb-1">Та энэ даалгаварт тайлан илгээсэн байна</p>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <Badge
                  label={statusLabels[existing.status]?.label ?? existing.status}
                  variant={statusLabels[existing.status]?.variant ?? 'default'}
                />
                {(existing.evaluation as { isPublished?: boolean; score?: number; grade?: string } | null)?.isPublished && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    GRADE_COLORS[(existing.evaluation as { grade?: string })?.grade ?? ''] ?? 'bg-gray-100 text-gray-600'
                  }`}>
                    {GRADE_LABELS[(existing.evaluation as { grade?: string })?.grade ?? ''] ?? ''}
                    {' '}
                    {((existing.evaluation as { score?: number })?.score ?? 0).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-yellow-700 mb-3">Илгээсэн огноо: {formatDateTime(existing.createdAt)}</p>
              <Link
                href={`/dashboard/my-submissions/${existing.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                📄 Дэлгэрэнгүй харах
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Resubmit notice */}
      {isResubmit && existing?.resubmitDeadline && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="font-semibold text-blue-800 mb-1">✅ Resubmit зөвшөөрөгдсөн</p>
          <p className="text-sm text-blue-700">
            <strong>{formatDate(existing.resubmitDeadline)}</strong> хүртэл дахин тайлан илгээх боломжтой
          </p>
        </div>
      )}

      {/* Upload form */}
      {selectedId && canSubmit && (
        <Card title={isResubmit ? '📤 Дахин тайлан илгээх' : '📤 Тайлан илгээх'}>
          <FileUpload assignmentId={selectedId} onSuccess={handleSuccess} />
        </Card>
      )}

      {/* Placeholder when nothing selected */}
      {!selectedId && !uploadDone && (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-3xl mb-2">📂</p>
          <p className="text-sm font-medium">Дээрээс даалгавараа сонгоно уу</p>
        </div>
      )}
    </div>
  )
}

export default function UploadPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Тайлан илгээх</h1>
      <Suspense fallback={<div className="text-gray-500">Ачааллаж байна...</div>}>
        <UploadContent />
      </Suspense>
    </div>
  )
}
